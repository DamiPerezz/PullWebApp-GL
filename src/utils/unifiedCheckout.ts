// utils/unifiedCheckout.ts
// =============================================================================
// FONTANERÍA del widget nativo de Cybersource (Unified Checkout).
//
// QUÉ HACE ESTE FICHERO: cargar el SDK y sacarle el token. NADA de UI y NADA de
// dinero — el cobro sigue saliendo por `/orders/pay` desde la página de pago.
//
// EL CAMINO COMPLETO, para quien llegue nuevo:
//
//   1. El backend abre la sesión (`POST /payments/capture-context`) y devuelve
//      un JWT firmado por Cybersource con el IMPORTE y los ORÍGENES dentro.
//      Ese importe NO se puede tocar desde aquí: va firmado. Es justo lo que
//      impide pagar 1 GTQ una entrada de 300.
//   2. Dentro de ese JWT viene la URL del SDK (`ctx[].data.clientLibrary`) y su
//      hash de integridad. Se carga con <script>, sin dependencia npm.
//   3. `Accept(jwt) → unifiedPayments() → show({containers})` pinta la lista de
//      métodos (wallets arriba, tarjeta abajo — el orden lo fija el array
//      `allowedPaymentTypes` que manda el BACKEND) y resuelve con un
//      "transient token": un JWT de un solo uso que representa el medio de pago.
//   4. Ese token va a `/orders/pay` en lugar de la tarjeta.
//
// NO SE MUEVE DINERO EN NINGÚN PASO DE ESTE FICHERO. El transient token no es
// un cobro: es un sustituto del PAN. Abandonar el widget a mitad no deja nada
// cobrado ni retenido, y por eso caerse al formulario de tarjeta es SIEMPRE
// seguro, en cualquier punto.
// =============================================================================

/** Global que publica el SDK de Unified Checkout al cargarse. */
type AcceptFactory = (captureContext: string) => Promise<UnifiedAccept>;

type UnifiedAccept = {
  unifiedPayments: (manual?: boolean) => Promise<UnifiedPayments>;
};

export type UnifiedPayments = {
  show: (args: { containers: { paymentSelection: string; paymentScreen?: string } }) => Promise<unknown>;
};

declare global {
  interface Window {
    Accept?: AcceptFactory;
  }
}

// -----------------------------------------------------------------------------
// JWT: forma y payload
// -----------------------------------------------------------------------------

/**
 * Comprueba la FORMA de un JWT (tres segmentos base64url). No valida la firma
 * — eso solo puede hacerlo quien lo emitió.
 *
 * Es el MISMO criterio que aplica el backend antes de reenviar el token a la
 * pasarela (`services.LooksLikeJWT`, Pull-API-v2/services/cybersource.go). Se
 * repite aquí para no gastar una petición —y un intento contra la pasarela— con
 * algo que ya sabemos que va a rebotar.
 */
export const looksLikeJwt = (value: unknown): value is string => {
  if (typeof value !== 'string' || value === '' || value.length > 8192) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0 && /^[A-Za-z0-9_\-=]+$/.test(p));
};

/** Decodifica el payload (segmento central) de un JWT. `null` si no se puede. */
export const decodeJwtPayload = (jwt: string): Record<string, unknown> | null => {
  try {
    const segment = jwt.split('.')[1];
    if (!segment) return null;
    // base64url → base64, y se rellena el padding que base64url se come.
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    // El payload trae texto (URLs, locales) que puede llevar UTF-8: hay que
    // reinterpretar los bytes, no leerlos como latin-1.
    const json = decodeURIComponent(
      Array.from(binary, (ch) => '%' + ch.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    );
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

// -----------------------------------------------------------------------------
// Localizar el SDK dentro del capture context
// -----------------------------------------------------------------------------

export type ClientLibrary = { url: string; integrity?: string };

/**
 * SECURITY — de aquí sale una URL que vamos a meter en un <script>. Aunque hoy
 * el capture context lo emite Cybersource y nos llega por NUESTRO backend, un
 * `<script src>` construido con un dato remoto es exactamente la primitiva que
 * convierte "me colaron un JSON raro" en "ejecutan código en la página de
 * pago". Así que la URL tiene que ser https y de un host de Cybersource, o no
 * se carga nada y se cae al formulario de tarjeta.
 */
const isCybersourceScriptUrl = (raw: string): boolean => {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host === 'cybersource.com' || host.endsWith('.cybersource.com');
  } catch {
    return false;
  }
};

/**
 * Saca del capture context la URL del SDK y su hash de integridad.
 *
 * El JWT trae un array `ctx`, y la librería vive en `ctx[n].data.clientLibrary`.
 * Se recorre entero en vez de asumir `ctx[0]` porque el orden lo decide
 * Cybersource, no nosotros.
 */
export const clientLibraryFromCaptureContext = (captureContext: string): ClientLibrary | null => {
  const payload = decodeJwtPayload(captureContext);
  if (!payload) return null;

  const candidates: Array<Record<string, unknown>> = [];
  const ctx = payload['ctx'];
  if (Array.isArray(ctx)) {
    for (const entry of ctx) {
      if (entry && typeof entry === 'object') {
        const data = (entry as Record<string, unknown>)['data'];
        if (data && typeof data === 'object') candidates.push(data as Record<string, unknown>);
      }
    }
  }
  // Fallback por si algún día viene plano en la raíz.
  candidates.push(payload);

  for (const data of candidates) {
    const url = data['clientLibrary'];
    if (typeof url === 'string' && isCybersourceScriptUrl(url)) {
      const integrity = data['clientLibraryIntegrity'];
      return { url, integrity: typeof integrity === 'string' && integrity ? integrity : undefined };
    }
  }
  return null;
};

// -----------------------------------------------------------------------------
// Carga del SDK
// -----------------------------------------------------------------------------

/** Cache por URL: el SDK se carga UNA vez aunque el comprador reintente. */
let sdkLoad: { url: string; promise: Promise<AcceptFactory> } | null = null;

/**
 * Mete el <script> del SDK en la página y resuelve cuando `window.Accept` está
 * disponible. Rechaza si tarda más de `timeoutMs` — ese límite es media red de
 * seguridad: sin él, una red mala dejaría al comprador mirando un hueco.
 *
 * NO añade dependencias npm a propósito: Cybersource sirve el fichero con un
 * hash de integridad que cambia con cada versión del SDK, y empaquetarlo lo
 * dejaría congelado.
 */
export const loadUnifiedCheckoutSdk = (
  lib: ClientLibrary,
  timeoutMs: number
): Promise<AcceptFactory> => {
  if (!isCybersourceScriptUrl(lib.url)) {
    return Promise.reject(new Error('UC_UNTRUSTED_CLIENT_LIBRARY'));
  }
  if (sdkLoad && sdkLoad.url === lib.url) return sdkLoad.promise;

  const promise = new Promise<AcceptFactory>((resolve, reject) => {
    // Ya cargado por un intento anterior (o por otra pestaña del mismo bundle).
    if (typeof window.Accept === 'function') {
      resolve(window.Accept);
      return;
    }

    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      fn();
    };

    const timer = window.setTimeout(() => {
      finish(() => reject(new Error('UC_SDK_TIMEOUT')));
    }, timeoutMs);

    const script = document.createElement('script');
    script.src = lib.url;
    script.async = true;
    if (lib.integrity) {
      // Si Cybersource nos da el hash, se exige: un fichero alterado no se
      // ejecuta. `crossOrigin` es obligatorio para que integrity funcione.
      script.integrity = lib.integrity;
      script.crossOrigin = 'anonymous';
    }
    script.onload = () => {
      finish(() => {
        if (typeof window.Accept === 'function') resolve(window.Accept);
        else reject(new Error('UC_SDK_NO_ACCEPT'));
      });
    };
    script.onerror = () => {
      finish(() => reject(new Error('UC_SDK_LOAD_ERROR')));
    };
    document.head.appendChild(script);
  });

  // Si falla se olvida el cache: el siguiente intento vuelve a probar de cero.
  promise.catch(() => {
    if (sdkLoad && sdkLoad.url === lib.url) sdkLoad = null;
  });

  sdkLoad = { url: lib.url, promise };
  return promise;
};

// -----------------------------------------------------------------------------
// Arranque del componente
// -----------------------------------------------------------------------------

/** `Accept(jwt) → unifiedPayments()`. Devuelve el objeto que sabe pintar. */
export const createUnifiedPayments = async (
  accept: AcceptFactory,
  captureContext: string
): Promise<UnifiedPayments> => {
  const instance = await accept(captureContext);
  if (!instance || typeof instance.unifiedPayments !== 'function') {
    throw new Error('UC_NO_UNIFIED_PAYMENTS');
  }
  const up = await instance.unifiedPayments();
  if (!up || typeof up.show !== 'function') throw new Error('UC_NO_SHOW');
  return up;
};

/**
 * Normaliza lo que devuelve `show()`. La documentación dice que resuelve con el
 * transient token en crudo (una cadena), pero se acepta también un objeto que
 * lo lleve dentro: si un día cambia la forma, preferimos encontrar el token a
 * mandar `[object Object]` a la pasarela.
 *
 * Si no hay nada con forma de JWT devuelve `null`, y quien llama se cae al
 * formulario de tarjeta. Eso es seguro: sin token no se ha cobrado nada.
 */
export const extractTransientToken = (result: unknown): string | null => {
  if (looksLikeJwt(result)) return result;
  if (result && typeof result === 'object') {
    const o = result as Record<string, unknown>;
    for (const key of ['transientToken', 'token', 'jwt', 'transient_token', 'id']) {
      if (looksLikeJwt(o[key])) return o[key] as string;
    }
  }
  return null;
};

// -----------------------------------------------------------------------------
// Utilidades de tiempo / DOM
// -----------------------------------------------------------------------------

/** Corta una promesa que tarda demasiado. La original sigue viva, pero se ignora. */
export const withTimeout = <T,>(p: Promise<T>, ms: number, label: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(label)), ms);
    p.then(
      (v) => { window.clearTimeout(timer); resolve(v); },
      (e) => { window.clearTimeout(timer); reject(e); }
    );
  });

/**
 * Espera a que React haya pintado el contenedor. `show()` busca el nodo por
 * selector: si se le llama antes del render, no encuentra dónde pintar y el
 * comprador se queda mirando un hueco.
 */
export const waitForElement = (id: string, timeoutMs: number): Promise<HTMLElement> =>
  new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const look = () => {
      const el = document.getElementById(id);
      if (el) { resolve(el); return; }
      if (Date.now() > deadline) { reject(new Error('UC_CONTAINER_MISSING')); return; }
      window.requestAnimationFrame(look);
    };
    look();
  });
