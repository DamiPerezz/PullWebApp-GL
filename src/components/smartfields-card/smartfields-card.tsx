// components/smartfields-card/smartfields-card.tsx
//
// ⚠️ FUERA DE USO DESDE EL 18-AGO-2026. NINGUNA PÁGINA MONTA ESTE COMPONENTE.
//
// Se abandonó dLocal y se volvió a NeoNet/Cybersource: la tarjeta se teclea en
// nuestro propio formulario (`pages/payment-page`) y la cobra el backend con
// POST /orders/pay. Con NeoNet vuelve además la RETENCIÓN de los eventos
// privados, que este componente no sabe hacer: SmartFields cobra o no cobra,
// no autoriza sin capturar.
//
// SE CONSERVA A PROPÓSITO, sin borrar, junto a `startSmartFieldsSession` /
// `confirmSmartFieldsPayment` (controller/purchase-pages-controller.ts) y a su
// CSS. Montarlo de nuevo desde cero costaría días, y dLocal sigue siendo el
// plan B si NeoNet vuelve a caerse.
//
// TRAMPA si alguien lo reactiva: los endpoints `/orders/smartfields/*` del
// backend siguen existiendo, pero el venue tiene que estar configurado con la
// pasarela dLocal — si no, cobrará (o fallará) contra la pasarela equivocada.
//
// Formulario de tarjeta de dLocal (SmartFields) embebido en nuestra web.
//
// POR QUÉ EXISTE: en Guatemala la cuenta de dLocal no ofrece tarjeta en su
// checkout alojado — solo efectivo, y la lista de métodos sale vacía. Con
// SmartFields pintamos nosotros el formulario y la tarjeta se tokeniza contra
// dLocal desde el navegador, saltándose esa limitación.
//
// SEGURIDAD: los campos viven dentro de un iframe SERVIDO POR dLOCAL. Este
// código nunca ve, ni puede ver, el número de tarjeta: solo recibe un token de
// un solo uso que manda al backend. Por eso tampoco hay estado de "número de
// tarjeta" en ningún sitio de este fichero.
import { useEffect, useRef, useState } from 'react';
import './smartfields-card.css';
import {
  startSmartFieldsSession,
  confirmSmartFieldsPayment,
  type SmartFieldsResult,
} from '../../controller/purchase-pages-controller';

// SDK de PRODUCCIÓN. El de pruebas es checkout-sbx.dlocalgo.com — ojo, el
// soporte de dLocal reparte por defecto el enlace de sandbox.
const SDK_URL = 'https://checkout.dlocalgo.com/js/dlocalgo-smartfields-bundled.js';

declare global {
  interface Window {
    dlocalGo?: {
      initialize: (apiKey: string, checkoutToken: string) => Promise<void>;
      fields: () => { create: (type: string, opts?: any) => any };
      createCardToken: (field: any, data?: any) => Promise<any>;
      onInstallmentsChange?: (cb: (i: any) => void) => void;
    };
  }
}

/** Carga el SDK una sola vez aunque el componente se monte varias veces. */
let sdkPromise: Promise<void> | null = null;
const loadSDK = (): Promise<void> => {
  if (window.dlocalGo) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('SDK_LOAD_FAILED')));
      return;
    }
    const s = document.createElement('script');
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdkPromise = null; // permitir reintento
      reject(new Error('SDK_LOAD_FAILED'));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
};

type Props = {
  orderId: string;
  paymentLinkCode: string;
  /** Se llama cuando el cobro se aprueba. */
  onPaid: () => void;
  /** Se llama si la orden resulta estar ya pagada. */
  onAlreadyPaid?: () => void;
  /** Texto del botón; por defecto incluye el importe. */
  labels?: {
    pay?: string;
    cardLabel?: string;
    secureNote?: string;
  };
};

export default function SmartFieldsCard({
  orderId,
  paymentLinkCode,
  onPaid,
  onAlreadyPaid,
  labels,
}: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const cardFieldRef = useRef<any>(null);
  // Nombre del titular: el SDK lo pide al tokenizar.
  const cardholderRef = useRef<string>('');
  const mountedRef = useRef(false);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'paying' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<{ value: number; currency: string } | null>(null);
  // Aviso para el caso "no sabemos si se cobró": NO se puede decir que falló.
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setPhase('loading');
        setError(null);

        // 1) Abrir el cobro en nuestro backend (el que habla con dLocal).
        const session = await startSmartFieldsSession(orderId, paymentLinkCode);
        if (!alive) return;

        if (session.alreadyPaid) {
          onAlreadyPaid ? onAlreadyPaid() : onPaid();
          return;
        }
        setAmount({ value: session.amount, currency: session.currency });
        cardholderRef.current = session.clientName || '';

        // 2) Cargar el SDK y montar los campos.
        await loadSDK();
        if (!alive) return;
        if (!window.dlocalGo) throw new Error('SDK_LOAD_FAILED');

        await window.dlocalGo.initialize(session.apiKey, session.checkoutToken);
        if (!alive || !boxRef.current) return;

        // Guard: en React 18 StrictMode el efecto corre dos veces en desarrollo
        // y montaríamos dos iframes encima del otro.
        if (mountedRef.current) return;
        mountedRef.current = true;

        const fields = window.dlocalGo.fields();
        const card = fields.create('card', {
          style: {
            base: {
              fontSize: '16px',
              lineHeight: '24px',
              color: '#ffffff',
              '::placeholder': { color: '#8a8a8a' },
              iconColor: '#8a8a8a',
            },
          },
        });
        card.mount(boxRef.current);
        cardFieldRef.current = card;
        setPhase('ready');
      } catch (e: any) {
        if (!alive) return;
        mountedRef.current = false;
        const code = e?.response?.data?.error || e?.message || '';
        setError(
          code === 'SDK_LOAD_FAILED'
            ? 'No se pudo cargar el formulario de pago. Revisa tu conexión y vuelve a intentarlo.'
            : code || 'No se pudo iniciar el pago.'
        );
        setPhase('error');
      }
    })();

    return () => { alive = false; };
    // Deliberadamente sin dependencias cambiantes: la sesión se abre UNA vez
    // por montaje. Reabrirla crearía cobros nuevos en dLocal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, paymentLinkCode]);

  const handlePay = async () => {
    if (phase !== 'ready' || !cardFieldRef.current) return;
    setPhase('paying');
    setError(null);
    setPending(null);

    try {
      // 3) Tokenizar. Aquí es donde dLocal lee la tarjeta de SU iframe —
      // nosotros solo recibimos el token.
      // OJO: el `name` NO es opcional en la práctica. Sin él dLocal crea el
      // token igualmente, pero al confirmar el cobro responde
      // 400 {"code":406,"message":"Missing payment method"} — un mensaje que
      // no tiene nada que ver con la causa y manda a buscar al sitio
      // equivocado (a la configuración de métodos de la cuenta).
      const tokenResp = await window.dlocalGo!.createCardToken(cardFieldRef.current, {
        name: cardholderRef.current,
      });

      // SOLO `.token`, que es lo que documenta dLocal
      // (`const { token: cardToken } = response`). Antes había una cadena de
      // alternativas (token || card_token || id) y eso es peligroso: si la
      // respuesta no trae `token`, se acababa mandando OTRO campo como si
      // fuera la tarjeta, y dLocal respondía "Missing payment method" — un
      // error que no señala en absoluto a esta línea.
      const cardToken = tokenResp?.token;
      if (!cardToken) {
        // Se deja constancia de la FORMA de la respuesta (nunca su contenido:
        // ahí puede haber datos de la tarjeta) para poder diagnosticarlo sin
        // tener que pedirle al comprador que lo intente diez veces.
        const forma = tokenResp && typeof tokenResp === 'object'
          ? Object.keys(tokenResp).join(', ')
          : typeof tokenResp;
        // eslint-disable-next-line no-console
        console.error('[SmartFields] createCardToken sin `token`. Campos devueltos:', forma);
        throw new Error(
          `No se pudo validar la tarjeta (respuesta inesperada de dLocal: ${forma}).`
        );
      }

      // 4) Confirmar en nuestro backend.
      const res: SmartFieldsResult = await confirmSmartFieldsPayment(
        orderId,
        paymentLinkCode,
        cardToken
      );

      if (res.paid) {
        onPaid();
        return;
      }
      // 3D SECURE: el banco quiere confirmar antes de cobrar. Se manda al
      // comprador a su página; al volver, la de éxito consulta el estado real.
      // Sin esto, una tarjeta que pida 3DS no se puede pagar NUNCA.
      if (res.requiresAction && res.redirectUrl) {
        window.location.assign(res.redirectUrl);
        return;
      }
      if (res.indeterminate) {
        // NO decir que falló: puede haberse cobrado.
        setPending(res.message);
        setPhase('ready');
        return;
      }
      setError(res.message || 'El pago no se completó.');
      setPhase('ready');
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        'No se pudo completar el pago. Inténtalo de nuevo.';
      setError(msg);
      setPhase('ready');
    }
  };

  const money =
    amount && amount.value > 0
      ? `${amount.currency === 'GTQ' ? 'Q' : amount.currency + ' '}${amount.value.toFixed(2)}`
      : '';

  return (
    <div className="smartfields">
      <label className="smartfields__label">
        {labels?.cardLabel || 'Datos de tu tarjeta'}
      </label>

      {/* Contenedor del iframe de dLocal. Alto mínimo para que no salte el
          layout mientras carga. */}
      <div
        ref={boxRef}
        className="smartfields__field"
        style={{ minHeight: 48 }}
        aria-busy={phase === 'loading'}
      />

      {phase === 'loading' && (
        <p className="smartfields__hint">Cargando formulario seguro…</p>
      )}

      {pending && (
        <div className="smartfields__pending" role="status">
          {pending}
        </div>
      )}

      {error && (
        <div className="smartfields__error" role="alert">
          {error}
        </div>
      )}

      <button
        type="button"
        className="smartfields__pay"
        onClick={handlePay}
        disabled={phase !== 'ready'}
      >
        {phase === 'paying'
          ? 'Procesando…'
          : `${labels?.pay || 'Pagar'}${money ? ` ${money}` : ''}`}
      </button>

      <p className="smartfields__secure">
        {labels?.secureNote ||
          'Pago seguro procesado por dLocal. Tus datos de tarjeta no pasan por nuestros servidores.'}
      </p>
    </div>
  );
}
