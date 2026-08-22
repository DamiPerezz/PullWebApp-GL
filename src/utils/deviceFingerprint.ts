// utils/deviceFingerprint.ts
// =============================================================================
// HUELLA DE DISPOSITIVO para Decision Manager (el antifraude de Cybersource).
//
// POR QUÉ EXISTE ESTE FICHERO — el problema que arregla:
//
// En el panel de Decision Manager, la columna "Device Fingerprint" sale VACÍA en
// todas nuestras transacciones. Eso no es un hueco cosmético: NeoNet aplica
// reglas de velocidad COMPARTIDAS con el resto de sus comercios, y una de ellas
// agrupa por huella ("Mismo DF > 3 x 1 día", umbral 3). Si la huella va vacía,
// para esa regla las 200 compras de la noche del evento no son 200 compradores:
// son UN dispositivo comprando 200 veces, y a partir de la 4ª rechaza.
//
// La IP y las cabeceras las observa el BACKEND en la propia petición
// (middleware.GetRealIP + User-Agent/Accept/Accept-Language, ver
// Pull-API-v2/controllers/pay_controller.go). La huella NO: la produce el script
// de profiling de Cybersource DENTRO del navegador, y por eso vive aquí.
//
// -----------------------------------------------------------------------------
// QUÉ CARRIL CUBRE, Y POR QUÉ IMPORTA
//
// El widget de Unified Checkout perfila el dispositivo él solo cuando la sesión
// se abre con `completeMandate.decisionManager: true`, y mete la huella dentro
// del transient token. PERO el widget está configurado con
// `allowedPaymentTypes = APPLEPAY,GOOGLEPAY` (PANENTRY se deja fuera a
// propósito, ver unified_checkout_controller.go): o sea que solo cubre WALLETS.
//
// La TARJETA se sigue tecleando en NUESTRO formulario, y ese es justo el carril
// que hoy mueve el dinero y el que se llevó los DECISION_PROFILE_REJECT. Este
// fichero existe para taparle ese agujero, y solo ese.
//
// -----------------------------------------------------------------------------
// ⛔ HOY ESTÁ INERTE, A PROPÓSITO — FALTA EL `org_id` DE NEONET
//
// El script de profiling se identifica con un `org_id` del comercio. NeoNet
// todavía NO nos lo ha dado (no aparece en ninguno de los PDF que pasaron:
// Unified Checkout, Digital Accept Secure Integration, ni el API Field
// Reference). Sin él no se puede cargar nada.
//
// Mientras `VITE_CYBS_DF_ORG_ID` esté vacía:
//   · no se inyecta ningún script,
//   · no se toca la red,
//   · `getDeviceFingerprintSessionId()` devuelve '' y la petición de pago sale
//     EXACTAMENTE como salía antes de este fichero.
//
// El día que NeoNet lo dé: rellenar la variable en `.env.production` y volver a
// deployar. Cero cambios de código, aquí y en el backend.
//
// LO QUE HAY QUE PEDIRLE A NEONET (las dos cosas, en el mismo correo):
//   1. El `org_id` de PRODUCCIÓN para el merchant `visanetgt_pull` (y el de
//      pruebas, si lo hay, para staging).
//   2. Que confirmen la COMPOSICIÓN del `session_id`: si el valor que viaja en
//      `deviceInformation.fingerprintSessionId` es el id a secas (lo que hace
//      este fichero) o el id con el merchant id delante. La documentación de
//      Cybersource concatena el merchant id en la URL del script, y de ahí sale
//      la duda. Por eso `VITE_CYBS_DF_MERCHANT_ID` existe y afecta SOLO a la URL
//      — ver `scriptUrl()`.
//
// ⚠️ LO QUE NO SE HACE, Y NO SE DEBE HACER: inventarse un id sin que el script
// haya corrido. Es tentador —un id distinto por compra rompería cualquier
// agrupación por huella vacía— y está MAL: ese id apuntaría a un dispositivo que
// nunca se perfiló, o sea que le estaríamos dando al antifraude un dato FALSO
// para decidir sobre dinero real. Preferimos la columna vacía a la columna
// mentirosa. De ahí el flag `profiled` de abajo: si el script no cargó, no se
// manda id.
// =============================================================================

// -----------------------------------------------------------------------------
// Configuración (se incrusta al construir el bundle: son `VITE_*`)
// -----------------------------------------------------------------------------

/**
 * Valida un identificador que va a acabar en una URL de <script>. Se aceptan
 * solo caracteres inertes: una errata en el `.env` no puede convertirse en otra
 * cosa. Mismo espíritu que `LooksLikeFingerprintSessionID` en el backend.
 */
const isSafeIdentifier = (value: string, maxLength: number): boolean =>
  value.length > 0 && value.length <= maxLength && /^[A-Za-z0-9_-]+$/.test(value);

const readConfig = (name: string, maxLength: number): string => {
  const raw = String(import.meta.env[name] ?? '').trim();
  if (raw === '') return '';
  if (!isSafeIdentifier(raw, maxLength)) {
    // Ni se carga con un valor raro ni se rompe la página: se avisa y se sigue
    // sin huella, que es el estado de hoy.
    console.warn(`[deviceFingerprint] ${name} tiene un valor inválido; se ignora`);
    return '';
  }
  return raw;
};

/** El `org_id` del comercio. VACÍO hoy: lo tiene que dar NeoNet. */
const ORG_ID = readConfig('VITE_CYBS_DF_ORG_ID', 32);

/**
 * Merchant id de Cybersource (`visanetgt_pull`). OPCIONAL y de uso limitado:
 * solo se antepone al session_id DENTRO DE LA URL del script, nunca en el valor
 * que se manda al backend. Ver la nota 2 de arriba.
 */
const MERCHANT_ID = readConfig('VITE_CYBS_DF_MERCHANT_ID', 32);

/** Host del servicio de profiling de Cybersource. */
const PROFILER_HOST = 'https://h.online-metrix.net';

/** ¿Hay configuración suficiente para perfilar? Si no, todo esto es un no-op. */
export const deviceFingerprintConfigured = (): boolean => ORG_ID !== '';

// -----------------------------------------------------------------------------
// Session id
// -----------------------------------------------------------------------------

/**
 * Id de sesión de perfilado: 32 caracteres hex. Sin guiones a propósito, para
 * que quepa holgadamente en la ventana de 8-64 que valida el backend tanto si se
 * manda a secas como si algún día hubiera que anteponerle el merchant id.
 *
 * `crypto.randomUUID` no está en Safari < 15.4, así que se va directo a
 * `getRandomValues`, que sí está en todo lo que nos importa. Sin dependencias.
 */
const newSessionId = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

// -----------------------------------------------------------------------------
// Estado del módulo
//
// UNA sesión por carga de página. El comprador que reintenta tras una declinada
// sigue siendo el MISMO dispositivo, así que reutilizar el id es lo correcto —y
// además evita inyectar el script otra vez a mitad del pago.
// -----------------------------------------------------------------------------

type ProfilingState = {
  sessionId: string;
  /** true SOLO cuando el script se descargó y ejecutó. Es lo que autoriza a
   *  mandar el id: sin esto, el id no representa ninguna huella real. */
  profiled: boolean;
};

let state: ProfilingState | null = null;

const scriptUrl = (sessionId: string): string => {
  // La documentación de Cybersource concatena el merchant id delante del session
  // id EN LA URL. Si no tenemos merchant id configurado se manda el id solo.
  const urlSessionId = MERCHANT_ID ? `${MERCHANT_ID}${sessionId}` : sessionId;
  return `${PROFILER_HOST}/fp/tags.js?org_id=${encodeURIComponent(ORG_ID)}&session_id=${encodeURIComponent(urlSessionId)}`;
};

/**
 * Arranca el perfilado. Llamar lo ANTES posible en la página de pago: el script
 * necesita unos segundos para recoger sus señales, y el comprador tarda mucho
 * más que eso en teclear una tarjeta, así que en la práctica siempre le da
 * tiempo. Llamarlo justo al pulsar "pagar" sería demasiado tarde.
 *
 * NO DEVUELVE NADA Y NO SE ESPERA. Es deliberado: el pago no puede depender de
 * que un tercero conteste. Si el script no carga, tarda, o lo bloquea un
 * adblocker, el cobro sigue su camino sin huella — exactamente como hoy.
 *
 * Idempotente: llamarlo dos veces no inyecta dos scripts.
 */
export const startDeviceProfiling = (): void => {
  if (!deviceFingerprintConfigured()) return;
  if (state) return;
  if (typeof document === 'undefined') return;

  const sessionId = newSessionId();
  state = { sessionId, profiled: false };

  try {
    const script = document.createElement('script');
    script.src = scriptUrl(sessionId);
    script.async = true;
    // Sin `integrity`: Cybersource sirve este fichero con contenido variable
    // (lleva la sesión dentro), así que no hay hash estable que exigir.
    script.onload = () => {
      // El script CORRIÓ con este session id. No garantiza que el perfilado haya
      // terminado —eso pasa después, de forma asíncrona— pero sí que la sesión
      // existe del lado de Cybersource, que es lo que hace honesto mandar el id.
      if (state && state.sessionId === sessionId) state.profiled = true;
    };
    script.onerror = () => {
      // Bloqueado, caído o sin red. Se deja `profiled` en false: se paga sin
      // huella, que es el comportamiento de siempre.
      console.warn('[deviceFingerprint] el script de perfilado no cargó; se paga sin huella');
    };
    document.head.appendChild(script);
  } catch {
    // Que un fallo montando un <script> tumbe la página de pago sería mucho peor
    // que quedarse sin huella.
    state = { sessionId, profiled: false };
  }
};

/**
 * El id que se manda al backend en `device_fingerprint_id`, o '' si no hay
 * huella que respaldarlo (no configurado, script no cargado, o profiling no
 * arrancado). Cadena vacía = el campo no viaja y la petición sale como siempre.
 */
export const getDeviceFingerprintSessionId = (): string => {
  if (!state || !state.profiled) return '';
  return state.sessionId;
};

/** Solo para pruebas: olvida la sesión actual. */
export const resetDeviceProfilingForTests = (): void => {
  state = null;
};
