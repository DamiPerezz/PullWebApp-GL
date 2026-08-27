// payment-page.tsx
// SECURITY: Using apiClient for consistent cookie-based authentication
//
// FLUJO NeoNet / Cybersource — TARJETA EN ESTA PÁGINA (18-ago-2026):
//
//   PÚBLICO   datos del asistente + tarjeta aquí → crear orden → POST
//             /orders/pay → el backend COBRA en la misma petición → se va a
//             /order/payment-success con las entradas ya emitidas.
//
//   PRIVADO   EL MISMO FORMULARIO. La tarjeta se pide al SOLICITAR: el backend
//             autoriza sin capturar y el importe queda RETENIDO
//             (orden en `payment_authorized`). Si el local aprueba, se cobra;
//             si rechaza o pasan 48 h, se libera. NO hay enlace de pago
//             posterior — pedir la tarjeta dos veces sería el bug.
//
// POR QUÉ VOLVIÓ ASÍ: con dLocal se probó "solicitar sin tarjeta → aprobar →
// pagar por enlace" y una redirección a su checkout alojado. Se abandonó
// dLocal, y con ella los dos desvíos. El componente SmartFields sigue en el
// repo (components/smartfields-card) pero YA NO SE USA desde aquí.
//
// TRAMPA: la tarjeta sí pasa por nuestro servidor en este flujo (el backend la
// reenvía a Cybersource y no la guarda). No la metas en logs, ni en estado
// global, ni en la URL.
//
// -----------------------------------------------------------------------------
// WIDGET NATIVO (Unified Checkout) — añadido en agosto 2026, DETRÁS DE UN
// INTERRUPTOR (`VITE_UNIFIED_CHECKOUT_ENABLED`)
//
// Encendido, el formulario de arriba se sustituye por el componente de
// Cybersource, que pinta la lista de métodos —Google Pay, Apple Pay y tarjeta,
// en el orden que manda el backend— y devuelve un "transient token" en lugar
// del PAN. Ese token va al MISMO `/orders/pay` de siempre; público vs privado,
// cobrar vs retener, emisión de entradas: todo idéntico, lo decide el servidor
// leyendo el evento.
//
// EL FORMULARIO DE TARJETA NO SE BORRA. Es la red de seguridad, y vuelve solo
// —sin que el comprador vea ningún error— cuando:
//   · el interruptor está apagado (entonces esta página es la de siempre,
//     literalmente: `showCardForm` sale true por la primera condición);
//   · la sesión de pago no se abre (backend apagado, pasarela sin wallets…);
//   · el SDK no carga o tarda más de la cuenta;
//   · el widget no llega a pintarse;
//   · el cobro con el token falla (el token es de un solo uso: no se reintenta).
// Eso es lo que hace verdad el "nivel 1" de ROLLBACK-WALLETS.md: apagar la
// variable en Cloudflare Pages y redeployar devuelve el checkout de siempre.
//
// ⚠️ EL CONSENTIMIENTO DEL EVENTO PRIVADO NO SE PUENTEA. La casilla obligatoria
// del modal sigue bloqueando antes de pagar, también con wallet — ver el guard
// al principio de `prepareWallet`.
//
// DÓNDE NO ESTÁ: en el modo "retomar orden" (`resuming`). Ese carril es para
// enlaces viejos del desvío de dLocal y se queda con la tarjeta de siempre, que
// es exactamente el comportamiento que ya estaba probado.
// -----------------------------------------------------------------------------
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Layout } from "../../components/layout/layout";
import "./payment-page.css";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import { UserDetailsForm } from "../../components/user-details-form/user-details-form";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  getTicketInfo,
  getEventDetailedInfo,
  createPendingOrder,
  payOrder,
  getOrderDetails,
  getOrderDataAfterCancel,
  startUnifiedCheckoutSession,
  payOrderWithTransientToken,
} from "../../controller/purchase-pages-controller";
import type { TicketType, EventDetailedInfo } from "../../types/types";
import { AlertCircle, CheckCircle, Clock, CreditCard, Wallet } from "lucide-react";
import { EventInfoCard } from "../../components/event-info-card/event-info-card";
import { apiClient } from "../../utils/axios";
import { validateUUID } from "../../utils/security";
import { classifyOrderStatus, validatePaymentLinkCode, type OrderStage } from "../../utils/orderStatus";
import {
  clientLibraryFromCaptureContext,
  createUnifiedPayments,
  extractTransientToken,
  loadUnifiedCheckoutSdk,
  waitForElement,
  withTimeout,
} from "../../utils/unifiedCheckout";
import {
  getDeviceFingerprintSessionId,
  startDeviceProfiling,
} from "../../utils/deviceFingerprint";

// ===========================================================================
// INTERRUPTOR DEL WIDGET, lado navegador. Apagado si la variable no existe:
// cualquier valor que no sea exactamente "true" deja la página como está hoy.
//
// ⚠️ NO SE ENCIENDE DESDE EL PANEL DE CLOUDFLARE. Los scripts de deploy
// construyen el bundle EN LOCAL (`npm run build:staging` / `npm run build`) y
// `wrangler pages deploy dist` sube ese bundle ya construido. Vite incrusta las
// `VITE_*` al construir, así que las "Environment variables" del panel de Pages
// no intervienen: solo alimentan las Functions en ejecución y las builds que
// hace Cloudflare desde git, y aquí no se usa ninguna de las dos.
//
// Encender:  `VITE_UNIFIED_CHECKOUT_ENABLED=true` en el fichero de entorno
//            COMMITEADO del entorno que toque —`.env.staging` para staging,
//            `.env.production` para producción— y volver a lanzar el script de
//            deploy correspondiente. (En el backend hace falta además
//            UNIFIED_CHECKOUT_ENABLED=true; si solo está encendido aquí, la
//            sesión responde 501 y se cae al formulario de tarjeta.)
// Apagar:    poner `false` (o borrar la línea) y volver a deployar. Ver
//            ROLLBACK-WALLETS.md, nivel 1.
//
// Es una constante de módulo, no estado: Vite la resuelve al construir el
// bundle, así que con el interruptor apagado el código del widget ni siquiera
// puede llegar a ejecutarse.
// ===========================================================================
const UNIFIED_CHECKOUT_ENABLED =
  String(import.meta.env.VITE_UNIFIED_CHECKOUT_ENABLED ?? '').trim().toLowerCase() === 'true';

// Id del hueco donde Cybersource pinta la lista de métodos. `show()` lo busca
// por selector, así que tiene que ser único en la página.
const UC_CONTAINER_ID = 'unified-checkout-payment-selection';

// Plazos. Ninguno es cosmético: pasado cualquiera de ellos vuelve el formulario
// de tarjeta. Un comprador esperando delante de un hueco en blanco abandona.
const UC_SESSION_TIMEOUT_MS = 8000;  // abrir la sesión contra nuestro backend
const UC_SDK_TIMEOUT_MS = 10000;     // descargar el SDK de Cybersource
const UC_INIT_TIMEOUT_MS = 8000;     // Accept() + unifiedPayments()
const UC_PAINT_TIMEOUT_MS = 5000;    // que React pinte el contenedor
const UC_MOUNT_TIMEOUT_MS = 8000;    // que el widget pinte ALGO dentro

// idle      → aún no se ha pedido nada; el hueco explica qué va a pasar.
// preparing → sesión + SDK en marcha.
// ready     → el widget está en pantalla y el comprador elige.
// fallback  → formulario de tarjeta de siempre. Estado terminal de esta página:
//             una vez aquí no se reintenta el widget solo, para no quitarle al
//             comprador un formulario que ya podía estar rellenando.
type WalletPhase = 'idle' | 'preparing' | 'ready' | 'fallback';

// Lo que devuelve `/orders/pay`, por los dos carriles (tarjeta y wallet). Solo
// los campos que esta página lee: el resto del cuerpo (tickets, mensajes) lo
// consume la página de éxito leyendo el estado REAL de la orden.
type PayResponse = {
  success?: boolean;
  error?: string;
  /** `true` SOLO en la rama de retención: el importe está bloqueado, no cobrado. */
  pending_approval?: boolean;
  order_number?: string;
};

type ResumeState =
  | { phase: 'loading' }
  // `approvedUnpaid` no se deduce del stage: `approved_unpaid` cae en
  // 'payable' como una `pending` cualquiera, pero esa YA está aprobada, así
  // que al pagarla se cobra de verdad en vez de retener. Se guarda aparte
  // para no prometer una retención que no va a pasar.
  | { phase: 'ready'; stage: OrderStage; orderNumber: string; approvedUnpaid: boolean }
  | { phase: 'notFound' };

// Panel centrado para los estados que NO son un formulario: solicitud enviada,
// orden ya pagada, solicitud caducada… Fuera del componente para no remontarlo
// en cada render.
const StatusPanel = ({
  icon,
  tone,
  title,
  body,
  extra,
  action,
}: {
  icon: ReactNode;
  tone: 'ok' | 'wait' | 'bad';
  title: string;
  body: string;
  extra?: ReactNode;
  action?: ReactNode;
}) => (
  <div className={`payment-status-panel payment-status-panel-${tone}`}>
    <div className="payment-status-panel-icon">{icon}</div>
    <h2 className="payment-status-panel-title">{title}</h2>
    <p className="payment-status-panel-body">{body}</p>
    {extra}
    {action && <div className="payment-status-panel-actions">{action}</div>}
  </div>
);

// Campos de tarjeta. TIENE que vivir fuera del componente: si se declara
// dentro, cada tecleo lo remonta y el input pierde el foco tras cada dígito.
const CardFields = ({
  number,
  expiry,
  cvv,
  onNumber,
  onExpiry,
  onCvv,
  disabled,
  title,
  note,
  labels,
}: {
  number: string;
  expiry: string;
  cvv: string;
  onNumber: (v: string) => void;
  onExpiry: (v: string) => void;
  onCvv: (v: string) => void;
  disabled: boolean;
  title: string;
  note: string;
  labels: { number: string; expiry: string; cvv: string };
}) => (
  <div className="payment-card-section">
    <div className="payment-card-header">
      <CreditCard size={18} />
      <span>{title}</span>
    </div>
    <div className="payment-card-fields">
      <input
        className="payment-card-input payment-card-number"
        type="text"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder={labels.number}
        aria-label={labels.number}
        value={number}
        onChange={(e) => onNumber(e.target.value)}
        disabled={disabled}
      />
      <div className="payment-card-row">
        <input
          className="payment-card-input"
          type="text"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder={labels.expiry}
          aria-label={labels.expiry}
          value={expiry}
          onChange={(e) => onExpiry(e.target.value)}
          disabled={disabled}
        />
        <input
          className="payment-card-input"
          type="password"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder={labels.cvv}
          aria-label={labels.cvv}
          maxLength={4}
          value={cvv}
          onChange={(e) => onCvv(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
    <p className="payment-card-note">{note}</p>
  </div>
);

// Hueco del widget nativo. Ocupa EL MISMO sitio que el formulario de tarjeta y
// reserva altura desde el primer render (`payment-wallet-stage`), para que
// pasar de "preparando" a la lista de métodos no empuje la página hacia abajo
// mientras el comprador está leyendo.
//
// Fuera del componente por el mismo motivo que CardFields: si se declara
// dentro, cada render lo remonta — y remontar el contenedor MATARÍA el iframe
// de Cybersource a media transacción.
const WalletFields = ({
  phase,
  containerId,
  title,
  idleBody,
  preparing,
  note,
  useCardLabel,
  onUseCard,
}: {
  phase: WalletPhase;
  containerId: string;
  title: string;
  idleBody: string;
  preparing: string;
  note: string;
  useCardLabel: string;
  onUseCard: () => void;
}) => (
  <div className="payment-card-section">
    <div className="payment-card-header">
      <Wallet size={18} />
      <span>{title}</span>
    </div>

    <div
      className={`payment-wallet-stage${
        phase === 'idle' ? '' : ' payment-wallet-stage--reserva'
      }`}
      aria-live="polite"
      aria-busy={phase === 'preparing'}
    >
      {/* Estado inicial: compacto y con los métodos anunciados. Antes esto era
          un cajón vacío de 280px con una frase suelta en medio y parecía roto.
          La altura solo se reserva cuando el widget está en camino. */}
      {phase === 'idle' && (
        <>
          <p className="payment-wallet-idle">{idleBody}</p>
          <div className="payment-wallet-anticipo" aria-hidden="true">
            <span>Google&nbsp;Pay</span>
            <span>Apple&nbsp;Pay</span>
            <span>
              <CreditCard size={13} /> Tarjeta
            </span>
          </div>
        </>
      )}

      {phase === 'preparing' && (
        <div className="payment-wallet-loading">
          <div className="payment-page-loading-spinner" />
          <p className="payment-wallet-loading-text">{preparing}</p>
        </div>
      )}

      {/* Solo existe en 'ready': `waitForElement` se apoya en eso para saber
          que React ya pintó el hueco antes de llamar a show(). */}
      {phase === 'ready' && <div id={containerId} className="payment-wallet-container" />}
    </div>

    <p className="payment-card-note">{note}</p>

    {/* Salida manual, SOLO mientras se prepara. Es el cable de emergencia para
        cuando la lista se queda pillada y la promesa de Cybersource no resuelve
        nunca; sin él ese comprador no tendría salida.
        En 'ready' ya no hace falta: el formulario de tarjeta está justo debajo,
        a la vista, y un botón que diga "usar tarjeta" teniéndola delante solo
        confunde. */}
    {phase === 'preparing' && (
      <button type="button" className="payment-wallet-escape" onClick={onUseCard}>
        {useCardLabel}
      </button>
    )}
  </div>
);

export const PaymentPage = () => {
  const { t, i18n } = useTranslation('payment');
  const { lang, eventId, ticketTypeId, quantity } = useParams<{
    lang: string;
    eventId: string;
    ticketTypeId: string;
    quantity: string;
  }>();

  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const [searchParams] = useSearchParams();
  // SECURITY: los 3 parámetros vienen de una URL que el usuario puede editar
  // (o que le llega por correo). Se validan antes de tocar la API.
  const orderIdParam = useMemo(() => validateUUID(searchParams.get("order_id")), [searchParams]);
  const codeParam = useMemo(() => validatePaymentLinkCode(searchParams.get("code")), [searchParams]);
  const cancelled = searchParams.get("cancelled") === "true";

  // RETOMAR ORDEN: con order_id y sin `cancelled` se retoma esa orden en vez de
  // crear una nueva (que volvería a reservar aforo). En el flujo actual esto
  // solo pasa con órdenes ANTIGUAS del desvío de dLocal (`approved_unpaid`) o
  // con una `pending` que se quedó a medias: los eventos privados de hoy ya no
  // generan enlaces de pago.
  const resuming = Boolean(orderIdParam) && !cancelled;

  const formRef = useRef<{ submit: (onSubmit: any) => void }>(null);
  // Orden ya creada, reutilizada entre reintentos: recrearla en cada intento
  // generaba una orden (y un cargo) nueva por reintento tras un timeout de red
  // → doble cobro. Con esto, un reintento reusa la misma orden y el backend
  // (claim atómico) lo resuelve sin recobrar.
  const orderRef = useRef<{ orderId: string; code: string } | null>(null);
  const navigate = useNavigate();

  // Datos de tarjeta. Estado local y nada más: no se persiste, no se loguea.
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + "/" + digits.slice(2);
  };

  // Validación de mínimos ANTES de tocar la red: una tarjeta a medias gastaría
  // un intento contra la pasarela y sumaría al contador anti-carding del
  // backend (429) sin que el comprador haya hecho nada raro.
  const cardValid = (): boolean => {
    const num = cardNumber.replace(/\s/g, "");
    const [mm, yy] = cardExpiry.split("/");
    return Boolean(
      num.length >= 12 &&
      mm && Number(mm) >= 1 && Number(mm) <= 12 &&
      yy && yy.length === 2 &&
      cardCvv.length >= 3
    );
  };

  const [ticketDetails, setTicketDetails] = useState<TicketType>({} as TicketType);
  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);
  const [loading, setIsLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelledOrderData, setCancelledOrderData] = useState<any>(null);
  // Público: cobrado y confirmado.
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  // Privado: solicitud enviada con el importe RETENIDO (no cobrado).
  const [requestSent, setRequestSent] = useState<{ orderNumber: string; orderId: string } | null>(null);
  const [resumeState, setResumeState] = useState<ResumeState>({ phase: 'loading' });
  // Consentimiento explícito para eventos privados: el usuario debe leer y
  // aceptar el flujo de aprobación (retención sin cobro hasta que el local
  // acepte) ANTES de ver el formulario de datos. Transparencia.
  const [approvalAccepted, setApprovalAccepted] = useState<boolean>(false);
  // Casilla del aviso. Separada de `approvalAccepted` a propósito: una cosa es
  // haber marcado que lo entiendes y otra haber continuado. Sin marcarla, el
  // botón de continuar está deshabilitado.
  const [approvalConsent, setApprovalConsent] = useState<boolean>(false);

  // Evento privado: se cobra RETENIENDO y el local aprueba o rechaza. Se
  // calcula arriba porque lo leen tanto el render como los handlers de cobro.
  const requiresApproval = Boolean(eventInfo?.is_private || eventInfo?.require_approval);

  // ===== WIDGET NATIVO (Unified Checkout) =====
  const [walletPhase, setWalletPhase] = useState<WalletPhase>('idle');
  // Vivo mientras la página esté montada. Sin esto, un comprador que se va a
  // otra pantalla mientras carga el SDK provoca setState sobre un componente
  // muerto.
  const walletAliveRef = useRef(true);
  // Se levanta cuando abandonamos el widget (vigilante de montaje o botón de
  // salida). A partir de ahí se ignora lo que devuelva `show()`: el comprador
  // ya está en el formulario de tarjeta y meterle un cobro por detrás sería lo
  // peor que podría pasar aquí.
  const walletAbortedRef = useRef(false);

  useEffect(() => {
    walletAliveRef.current = true;
    return () => { walletAliveRef.current = false; };
  }, []);

  // ==========================================================================
  // HUELLA DE DISPOSITIVO — se arranca al ABRIR la página, no al pulsar pagar.
  //
  // El script de Cybersource tarda unos segundos en recoger sus señales.
  // Lanzarlo aquí le da todo el rato que el comprador pasa tecleando sus datos;
  // lanzarlo en `chargeCard` llegaría tarde y la huella saldría vacía, que es
  // justo el problema que esto arregla (ver utils/deviceFingerprint.ts).
  //
  // Se arranca en LOS DOS carriles aunque solo lo use el de tarjeta: el
  // formulario de tarjeta es la red de seguridad del widget y puede aparecer en
  // cualquier momento, así que para entonces la huella tiene que estar hecha.
  //
  // NO SE ESPERA A NADA: no devuelve promesa, no bloquea el render y no tiene
  // rama de error que pueda impedir un pago. Mientras falte el `org_id` de
  // NeoNet esto es literalmente un no-op.
  // ==========================================================================
  useEffect(() => {
    startDeviceProfiling();
  }, []);

  // El carril del widget solo está en juego con el interruptor encendido y en
  // el flujo normal. `resuming` (enlaces viejos) se queda con la tarjeta.
  const walletMode = UNIFIED_CHECKOUT_ENABLED && !resuming;
  // ⚠️ LA LÍNEA QUE SOSTIENE TODO: con el interruptor apagado esto es `true`
  // siempre, así que cada sitio que la consulta se comporta como el día antes
  // de que el widget existiera.
  // ¿Se pinta NUESTRO formulario de tarjeta?
  //
  // Cambió el 2026-08-23. Antes era un RESPALDO: solo aparecía si los wallets
  // estaban apagados o el widget se caía, porque el propio widget traía su
  // formulario de tarjeta (PANENTRY). Ahora el widget se configura SOLO con
  // wallets y la tarjeta vuelve a ser nuestra, debajo.
  //
  // Los tres casos en los que se enseña:
  //   - wallets apagados     → como toda la vida
  //   - fase 'fallback'      → el widget falló, es la red de seguridad
  //   - fase 'ready'         → NUEVO: el widget ya pintó Apple/Google Pay, y
  //                            justo debajo va la tarjeta como tercera opción
  //
  // En 'idle' y 'preparing' NO se pinta: todavía no hay orden creada, así que
  // un formulario de tarjeta ahí no podría cobrar nada.
  const showCardForm =
    !walletMode || walletPhase === 'fallback' || walletPhase === 'ready';
  const walletPreparing = walletMode && walletPhase === 'preparing';
  const walletReady = walletMode && walletPhase === 'ready';

  // Al caer al formulario de tarjeta, llevarlo a la vista. No es un error ni
  // se le enseña ninguno: simplemente ahí está la forma de pagar de siempre.
  const scrollToCardForm = () => {
    window.setTimeout(() => {
      const el = document.querySelector('.payment-card-section');
      if (!el) return;
      const smooth = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center' });
    }, 80);
  };

  // Salida al formulario de tarjeta. Un único sitio para no dejarse el
  // `walletAbortedRef` en alguna rama.
  const fallbackToCard = () => {
    walletAbortedRef.current = true;
    setWalletPhase('fallback');
    setProcessing(false);
    scrollToCardForm();
  };

  const getTicketGender = (ticketName: string): 'male' | 'female' | null => {
    const nameLower = ticketName.toLowerCase();
    if (nameLower.includes('woman') || nameLower.includes('women') || nameLower.includes('female') || nameLower.includes('girl')) {
      return 'female';
    }
    if (nameLower.includes('man') || nameLower.includes('men') || nameLower.includes('male') || nameLower.includes('boy')) {
      return 'male';
    }
    return null;
  };

  useEffect(() => {
    if (!eventId || !ticketTypeId) {
      return;
    }

    if (cancelled && orderIdParam) {
      getOrderDataAfterCancel(orderIdParam)
        .then((data) => {
          if (data.order_data && data.order_data.tickets_data) {
            try {
              const ticketsData = typeof data.order_data.tickets_data === 'string'
                ? JSON.parse(data.order_data.tickets_data)
                : data.order_data.tickets_data;
              setCancelledOrderData(ticketsData);
            } catch {
              // Silently handle parsing error
            }
          }
        })
        .catch(() => {
          // Silently handle error
        });
    }

    Promise.all([
      getTicketInfo(eventId, ticketTypeId),
      getEventDetailedInfo(eventId)
    ])
      .then(([ticketData, eventData]) => {
        setTicketDetails(ticketData);
        setEventInfo(eventData);
        setIsLoading(false);
      })
      .catch(() => {
        setError(t('page.failedToLoad'));
        setIsLoading(false);
      });
  }, [eventId, ticketTypeId, orderIdParam, cancelled, t]);

  // Modo "retomar orden": leer el estado REAL antes de ofrecer pagar. Una orden
  // ya pagada, con el importe retenido, rechazada o caducada NO debe volver a
  // pasar por la pasarela.
  useEffect(() => {
    if (!resuming || !orderIdParam) return;

    let alive = true;
    getOrderDetails(orderIdParam)
      .then((data) => {
        if (!alive) return;
        const order = data?.order || {};
        setResumeState({
          phase: 'ready',
          stage: classifyOrderStatus(order.status),
          orderNumber: order.order_number || '',
          approvedUnpaid: String(order.status || '').toLowerCase() === 'approved_unpaid',
        });
      })
      .catch(() => {
        if (alive) setResumeState({ phase: 'notFound' });
      });

    return () => { alive = false; };
  }, [resuming, orderIdParam]);

  const clearCard = () => {
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
  };

  // Un 409 de "esta orden ya no es pagable" trae el estado REAL de la orden
  // (`{error, status}`). Con él se lleva al comprador a la pantalla que le
  // corresponde en vez de soltarle el "Order is not payable" del backend, que
  // además está en inglés. PASA DE VERDAD: si el cobro se autoriza y la
  // respuesta se pierde (red móvil), el reintento cae aquí con la orden ya en
  // `payment_authorized` y dinero retenido — lo último que ese comprador debe
  // leer es un error técnico que le invite a pagar otra vez.
  const settledElsewhere = (err: unknown, orderId: string): boolean => {
    const data = (err as { response?: { data?: { status?: string } } })?.response?.data;
    switch (classifyOrderStatus(data?.status)) {
      case 'authorizedHold':
        clearCard();
        // Sin `order_number` en el error: el panel omite la referencia si va
        // vacía, mejor eso que inventarse una.
        setRequestSent({ orderNumber: '', orderId });
        return true;
      case 'confirmed':
        clearCard();
        setPaymentSuccess(true);
        setTimeout(() => {
          navigate(buildUrl(`/order/payment-success?order_id=${orderId}`));
        }, 3000);
        return true;
      default:
        return false;
    }
  };

  const describeError = (err: unknown): string => {
    const e = (err || {}) as { response?: { data?: { error?: string } }; message?: string };
    // El mensaje del BACKEND primero (402 declinada, 403 código inválido, 409
    // ya pagada, 429 demasiados intentos… todos traen error.response.data).
    if (e.response?.data?.error) return e.response.data.error;
    // Sin `response` no hubo respuesta del servidor (timeout / red móvil). Con
    // un cobro síncrono como este el cargo PUDO pasar: se pide NO reintentar,
    // en vez de soltar el "Request failed with status code…" en inglés.
    if (!e.response) return t('page.networkError');
    if (e.message) return e.message;
    return t('page.unexpectedError');
  };

  // Cobro real con tarjeta. En público captura; en privado el backend autoriza
  // y RETIENE (responde `pending_approval: true`). Mismo endpoint, misma
  // llamada: la decisión de capturar o retener es del servidor, que mira el
  // evento — la web no puede ni debe elegirla. Si la web mandara un flag de
  // "reténmelo", cualquiera podría pedir retención en un evento público.
  const chargeCard = async (orderId: string, linkCode: string) => {
    const num = cardNumber.replace(/\s/g, "");
    const [mm, yy] = cardExpiry.split("/");
    // `linkCode` es el anti-carding: sin él el backend responde 403 y no toca
    // la pasarela.
    // La huella de dispositivo va SOLO por aquí: este es el carril que Decision
    // Manager estaba viendo a ciegas (el widget perfila el suyo aparte). Sale
    // cadena vacía —y entonces el campo ni viaja— si no está configurado el
    // `org_id` o si el script no llegó a cargar; en ninguno de los dos casos se
    // interrumpe el cobro.
    const deviceFingerprintId = getDeviceFingerprintSessionId();
    const paymentResponse = await payOrder(orderId, linkCode, {
      number: num,
      exp_month: mm,
      exp_year: yy,
      cvv: cardCvv,
    }, undefined, deviceFingerprintId);

    if (paymentResponse?.success === false) {
      throw new Error(paymentResponse.error || t('page.paymentFailed'));
    }

    // La tarjeta ya no hace falta: fuera del estado en cuanto se resuelve.
    clearCard();
    setProcessing(false);
    finishPayment(orderId, paymentResponse);
  };

  // Qué hacer con la respuesta de `/orders/pay`. Está extraído de `chargeCard`
  // para que el cobro con wallet lea la respuesta EXACTAMENTE igual: es el
  // mismo endpoint y la misma semántica, y duplicar esta lectura sería la
  // forma más fácil de acabar diciéndole a un comprador que su dinero está
  // retenido cuando ya se le cobró (o al revés).
  const finishPayment = (orderId: string, paymentResponse: PayResponse) => {
    // `pending_approval:true` SOLO lo manda la rama de retención, así que es
    // señal positiva y fiable. Se compara contra `true` a propósito.
    if (paymentResponse?.pending_approval === true) {
      setRequestSent({ orderNumber: paymentResponse?.order_number || '', orderId });
      return;
    }

    // Sin flag: en un evento público es el cobro normal. En uno PRIVADO no se
    // adivina. TRAMPA: el backend también responde sin flag cuando la orden ya
    // estaba `confirmed` ("Order already confirmed"), y ahí deducir "retenido"
    // del hecho de que el evento sea privado le diría "tu dinero está
    // bloqueado" a quien ya tiene las entradas emitidas. La página de éxito lee
    // el estado REAL de la orden y dice lo que toque, así que se delega en ella.
    if (requiresApproval) {
      navigate(buildUrl(`/order/payment-success?order_id=${orderId}`));
      return;
    }

    setPaymentSuccess(true);
    // Los 3 s son para que dé tiempo a LEER que el pago salió bien antes de
    // que la página cambie sola; saltar de golpe parece que se ha roto algo.
    setTimeout(() => {
      navigate(buildUrl(`/order/payment-success?order_id=${orderId}`));
    }, 3000);
  };

  // ==========================================================================
  // COBRO CON EL TOKEN DEL WIDGET
  //
  // Mismo endpoint, mismo guard anti-carding, misma lectura de la respuesta que
  // con tarjeta. Lo único que cambia es que el PAN no ha pasado por nuestro
  // servidor: Cybersource nos dio un token de un solo uso que lo representa.
  //
  // Y por eso mismo, si el cobro falla NO se puede reintentar con ese token:
  // se acabó de gastar. Se cae al formulario de tarjeta, que sí puede.
  //
  // No lanza: quien lo llama está dentro del flujo del widget y un throw aquí
  // acabaría tapado por el catch genérico de `prepareWallet`, que no sabría si
  // hubo cargo o no.
  // ==========================================================================
  const chargeWithToken = async (orderId: string, linkCode: string, token: string) => {
    setProcessing(true);
    setError(null);
    try {
      const paymentResponse = await payOrderWithTransientToken(orderId, linkCode, token);
      if (paymentResponse?.success === false) {
        throw new Error(paymentResponse.error || t('page.paymentFailed'));
      }
      setProcessing(false);
      finishPayment(orderId, paymentResponse);
    } catch (err: unknown) {
      setProcessing(false);
      // Aquí SÍ se enseña el error: el comprador pulsó pagar y no se pagó.
      // `settledElsewhere` cubre el caso de que el cobro sí cuajara y se
      // perdiera la respuesta — ahí no hay error que enseñar, hay una orden.
      if (!settledElsewhere(err, orderId)) {
        setError(describeError(err));
      }
      fallbackToCard();
    }
  };

  // ==========================================================================
  // MONTAR EL WIDGET
  //
  // Se llama DESPUÉS de crear la orden, porque la sesión de pago se abre contra
  // una orden concreta: el importe va firmado dentro del JWT y sale de la fila
  // de la base de datos, no del navegador.
  //
  // No cobra nada. Hasta que `show()` no devuelve un token y `chargeWithToken`
  // no llama a `/orders/pay`, no se ha movido un quetzal — por eso abandonar
  // este camino en cualquier punto es seguro.
  //
  // No lanza: todo lo que sale mal acaba en el formulario de tarjeta.
  // ==========================================================================
  const prepareWallet = async (orderId: string, linkCode: string) => {
    // ⚠️ CONSENTIMIENTO DEL EVENTO PRIVADO — NO TOCAR.
    // La casilla obligatoria vive en un modal que tapa la página (commit
    // 8887224), así que hasta aquí no se debería poder llegar sin marcarla. Se
    // comprueba IGUAL: que el comprador vea el aviso de que se le va a retener
    // el importe no puede depender de un z-index. Si falla, formulario de
    // tarjeta — que vuelve a pasar por el mismo modal.
    if (requiresApproval && !(approvalAccepted && approvalConsent)) {
      fallbackToCard();
      return;
    }

    walletAbortedRef.current = false;
    setWalletPhase('preparing');
    // Se quita el overlay de pantalla completa: a partir de aquí el estado de
    // carga vive DENTRO del hueco del widget, que ya tiene la altura reservada.
    setProcessing(false);

    try {
      const session = await withTimeout(
        startUnifiedCheckoutSession(orderId, linkCode),
        UC_SESSION_TIMEOUT_MS,
        'UC_SESSION_TIMEOUT'
      );

      // La orden ya estaba pagada (reintento, pestaña vieja). No se pinta
      // ningún widget: se le lleva a su pedido, que dice la verdad.
      if (session.alreadyPaid) {
        navigate(buildUrl(`/order/payment-success?order_id=${orderId}`));
        return;
      }

      // La URL del SDK viaja DENTRO del capture context, con su hash de
      // integridad. Ver `clientLibraryFromCaptureContext`: solo se aceptan
      // URLs https de Cybersource.
      const lib = clientLibraryFromCaptureContext(session.captureContext);
      if (!lib) throw new Error('UC_NO_CLIENT_LIBRARY');

      const accept = await loadUnifiedCheckoutSdk(lib, UC_SDK_TIMEOUT_MS);
      const up = await withTimeout(
        createUnifiedPayments(accept, session.captureContext),
        UC_INIT_TIMEOUT_MS,
        'UC_INIT_TIMEOUT'
      );

      if (!walletAliveRef.current || walletAbortedRef.current) return;

      setWalletPhase('ready');
      await waitForElement(UC_CONTAINER_ID, UC_PAINT_TIMEOUT_MS);

      // VIGILANTE DE MONTAJE. `show()` devuelve una promesa que solo resuelve
      // cuando el comprador termina, así que no sirve para saber si el widget
      // llegó a pintarse. Si pasado el plazo el hueco sigue VACÍO, no arrancó
      // — y dejar a alguien mirando un rectángulo en blanco en la página de
      // pago es peor que no haberlo intentado.
      //
      // Solo dispara con el contenedor vacío: si hay algo pintado, el
      // comprador puede estar a mitad de la hoja del wallet y arrancársela
      // sería un destrozo.
      const watchdog = window.setTimeout(() => {
        const el = document.getElementById(UC_CONTAINER_ID);
        if (!el || el.childElementCount === 0) fallbackToCard();
      }, UC_MOUNT_TIMEOUT_MS);

      let result: unknown;
      try {
        result = await up.show({ containers: { paymentSelection: `#${UC_CONTAINER_ID}` } });
      } finally {
        window.clearTimeout(watchdog);
      }

      if (!walletAliveRef.current || walletAbortedRef.current) return;

      const token = extractTransientToken(result);
      if (!token) throw new Error('UC_NO_TOKEN');

      await chargeWithToken(orderId, linkCode, token);
    } catch {
      // TODO lo que falle aquí acaba igual: formulario de tarjeta, SIN enseñar
      // ningún error. Y es honesto — sesión caída, SDK que no descarga, widget
      // que no monta, comprador que cierra la hoja del wallet: en ninguno de
      // esos casos hay nada roto para él ni ningún cargo hecho. Hay una forma
      // de pagar, la de siempre, y aparece donde estaba mirando.
      if (!walletAliveRef.current) return;
      fallbackToCard();
    }
  };

  const onSubmit = async (formData: any) => {
    if (processing) return;

    // Con el widget en pantalla no hay tarjeta que validar: el medio de pago lo
    // recoge Cybersource. Con el interruptor apagado `showCardForm` vale
    // SIEMPRE true y esta comprobación es literalmente la de antes.
    if (showCardForm && !cardValid()) {
      setError(t('page.card.incomplete'));
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (!formData || !formData.usuarios || !Array.isArray(formData.usuarios)) {
        throw new Error(t('page.invalidFormData'));
      }

      if (formData.usuarios.length === 0) {
        throw new Error(t('page.noTicketInfo'));
      }

      const missingFields = formData.usuarios.some((ticket: any) =>
        !ticket.owner_name || !ticket.owner_last_name || !ticket.owner_email ||
        !ticket.owner_phone || !ticket.owner_birthdate
      );

      if (missingFields) {
        throw new Error(t('page.fillAllFields'));
      }

      if (!eventInfo) {
        throw new Error(t('page.eventNotLoaded'));
      }

      // ✅ Necesitamos el event_id real del backend (la URL trae el slug)
      let realEventID = (eventInfo as any).event_id || (eventInfo as any).id;

      if (!realEventID) {
        const eventDetailsResponse = await apiClient.get(`/event/get-event-info/${eventId}`);
        const eventDetails = eventDetailsResponse.data;
        realEventID = eventDetails.event_id || eventDetails.id;
      }

      if (!realEventID) {
        throw new Error(t('page.couldNotDetermineEventId'));
      }

      // Crear la orden UNA sola vez; en reintentos se reusa la existente.
      let orderId: string | undefined = orderRef.current?.orderId;
      let linkCode: string | undefined = orderRef.current?.code;
      if (!orderId) {
        const orderResponse = await createPendingOrder(
          realEventID!, // ← ID REAL del evento
          ticketTypeId!,
          ticketDetails.ticket_name,
          ticketDetails.ticket_price,
          ticketDetails.currency || 'GTQ',
          formData
        );
        if (!orderResponse.success) {
          throw new Error(orderResponse.error || t('page.failedToCreateOrder'));
        }
        const newId: string = orderResponse.order_id;
        const newCode: string = orderResponse.payment_link_code;
        orderId = newId;
        linkCode = newCode;
        orderRef.current = { orderId: newId, code: newCode };
      }

      if (!orderId || !linkCode) {
        throw new Error(t('page.failedToCreateOrder'));
      }

      // Aquí se bifurca, y solo aquí. Con el interruptor apagado (o ya caídos
      // al formulario de tarjeta) se cobra igual que siempre; si no, se monta
      // el widget — que NO cobra: solo recoge el medio de pago.
      if (showCardForm) {
        await chargeCard(orderId, linkCode);
      } else {
        await prepareWallet(orderId, linkCode);
      }
    } catch (error: unknown) {
      const known = orderRef.current?.orderId;
      if (!known || !settledElsewhere(error, known)) {
        setError(describeError(error));
      }
      setProcessing(false);
    }
  };

  // Retomar una orden vieja que sigue siendo pagable (enlace de aprobación del
  // desvío de dLocal, o una `pending` a medias): mismo formulario, misma
  // llamada, pero el código viene de la URL en vez de la orden recién creada.
  const onResumePay = async () => {
    if (processing || !orderIdParam) return;
    if (!codeParam) {
      setError(t('page.resume.missingCode'));
      return;
    }
    if (!cardValid()) {
      setError(t('page.card.incomplete'));
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      await chargeCard(orderIdParam, codeParam);
    } catch (error: unknown) {
      if (!settledElsewhere(error, orderIdParam)) {
        setError(describeError(error));
      }
      setProcessing(false);
    }
  };

  const handleDismissError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="payment-page-loading">
          <div className="payment-page-loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  const ticketGender = getTicketGender(ticketDetails.ticket_name || '');

  const cardLabels = {
    number: t('page.card.number'),
    expiry: t('page.card.expiry'),
    cvv: t('page.card.cvv'),
  };

  // `hold` = a esta tarjeta se le va a RETENER el importe, no cobrar. El aviso
  // va PEGADO a los campos a propósito: es el último sitio donde el comprador
  // mira antes de teclear la tarjeta.
  const renderCardFields = (hold: boolean) => (
    <CardFields
      number={cardNumber}
      expiry={cardExpiry}
      cvv={cardCvv}
      onNumber={(v) => setCardNumber(formatCardNumber(v))}
      onExpiry={(v) => setCardExpiry(formatExpiry(v))}
      onCvv={(v) => setCardCvv(v.replace(/\D/g, ""))}
      disabled={processing}
      title={t('page.card.title')}
      note={hold ? t('page.card.holdNote') : t('page.card.secureNote')}
      labels={cardLabels}
    />
  );

  // Widget nativo. Ocupa el sitio del formulario de tarjeta cuando el
  // interruptor está encendido; en cuanto la fase es 'fallback' desaparece y
  // vuelve `renderCardFields` sin más ceremonia.
  //
  // `hold` dice lo mismo que en la tarjeta: en un evento privado el importe se
  // RETIENE, no se cobra. Google Pay y Apple Pay son tarjetas y van por el
  // mismo carril, así que el aviso es idéntico — y tiene que serlo, o el
  // comprador leería una cosa distinta según cómo pague.
  const renderWalletFields = (hold: boolean) => (
    <WalletFields
      phase={walletPhase}
      containerId={UC_CONTAINER_ID}
      title={t('page.wallet.title')}
      idleBody={t('page.wallet.idleBody')}
      preparing={t('page.wallet.preparing')}
      note={hold ? t('page.card.holdNote') : t('page.wallet.secureNote')}
      useCardLabel={t('page.wallet.useCardInstead')}
      onUseCard={fallbackToCard}
    />
  );

  const backToEvent = () => navigate(buildUrl(`/event/${eventId}`));

  const backButton = (
    <button className="payment-status-panel-button" onClick={backToEvent}>
      {t('page.resume.backToEvent')}
    </button>
  );

  const renderResume = () => {
    if (resumeState.phase === 'loading') {
      return (
        <div className="payment-page-loading">
          <div className="payment-page-loading-spinner"></div>
        </div>
      );
    }

    if (resumeState.phase === 'notFound') {
      return (
        <StatusPanel
          icon={<AlertCircle size={52} />}
          tone="bad"
          title={t('page.resume.deadTitle')}
          body={t('page.resume.notFound')}
          action={backButton}
        />
      );
    }

    const { stage, orderNumber, approvedUnpaid } = resumeState;
    const reference = orderNumber ? (
      <p className="payment-status-panel-reference">
        {t('page.requestSent.reference')}: <strong>{orderNumber}</strong>
      </p>
    ) : undefined;

    switch (stage) {
      case 'payable': {
        // HISTÓRICO dLocal: `approved_unpaid` se clasifica como pagable, pero
        // con NeoNet NO se puede cobrar: `POST /orders/pay` solo acepta órdenes
        // `pending` (y el claim atómico pending→processing tampoco engancharía),
        // así que responde 409 "Order is not payable". Pedir aquí la tarjeta
        // sería mandar al comprador a un callejón sin salida CON el PAN ya
        // tecleado. Se le dice la verdad y se le manda al local.
        // Si algún día /orders/pay vuelve a aceptar `approved_unpaid`, borra
        // este bloque y vuelve a caer en el formulario de abajo.
        if (approvedUnpaid) {
          return (
            <StatusPanel
              icon={<AlertCircle size={52} />}
              tone="bad"
              title={t('page.resume.approvedUnpaidTitle')}
              body={t('page.resume.approvedUnpaidBody')}
              extra={reference}
              action={backButton}
            />
          );
        }

        // Orden `pending` de un evento privado: al pagarla se RETIENE, no se
        // cobra. El aviso de arriba tiene que decir lo mismo que la nota de la
        // tarjeta, o el comprador lee dos cosas distintas en la misma pantalla.
        const holdPayable = requiresApproval;
        return (
          <>
            <EventInfoCard eventInfo={eventInfo} />
            <div className="payment-page-grid">
              <div className="payment-page-left">
                <div className="payment-approval-notice">
                  <div className="payment-approval-notice-title">
                    {holdPayable ? '🔒' : '✅'}{' '}
                    {holdPayable ? t('page.private.noticeTitle') : t('page.resume.payableTitle')}
                  </div>
                  <p>{holdPayable ? t('page.private.noticeBody') : t('page.resume.payableBody')}</p>
                  {reference}
                </div>

                {renderCardFields(holdPayable)}

                {!codeParam && (
                  <div className="payment-approval-notice payment-approval-notice-warn">
                    <p>{t('page.resume.missingCode')}</p>
                  </div>
                )}
              </div>
              <div className="payment-page-right">
                <TicketReceipt
                  quantity={Number(quantity!)}
                  ticketDetails={ticketDetails}
                  buttonText={
                    processing
                      ? t('page.processing')
                      : (holdPayable ? t('page.requestTicket') : t('page.resume.payNow'))
                  }
                  onConfirm={onResumePay}
                  disabled={processing || !codeParam}
                />
              </div>
            </div>
          </>
        );
      }

      // Flujo vigente: el importe está RETENIDO esperando la decisión del
      // local. No se vuelve a pedir tarjeta — ya hay dinero bloqueado.
      case 'authorizedHold':
        return (
          <StatusPanel
            icon={<Clock size={52} />}
            tone="wait"
            title={t('page.resume.holdTitle')}
            body={t('page.resume.holdBody')}
            extra={reference}
            action={backButton}
          />
        );

      // HISTÓRICO dLocal: solicitud sin tarjeta, sin nada retenido.
      case 'awaitingApproval':
        return (
          <StatusPanel
            icon={<Clock size={52} />}
            tone="wait"
            title={t('page.resume.awaitingTitle')}
            body={t('page.resume.awaitingBody')}
            extra={reference}
            action={backButton}
          />
        );

      case 'processing':
        return (
          <StatusPanel
            icon={<Clock size={52} />}
            tone="wait"
            title={t('page.resume.processingTitle')}
            body={t('page.resume.processingBody')}
            extra={reference}
            action={backButton}
          />
        );

      case 'confirmed':
        return (
          <StatusPanel
            icon={<CheckCircle size={52} />}
            tone="ok"
            title={t('page.resume.confirmedTitle')}
            body={t('page.resume.confirmedBody')}
            extra={reference}
            action={
              <button
                className="payment-status-panel-button"
                onClick={() => navigate(buildUrl(`/order/payment-success?order_id=${orderIdParam}`))}
              >
                {t('page.resume.viewOrder')}
              </button>
            }
          />
        );

      case 'dead':
      default:
        return (
          <StatusPanel
            icon={<AlertCircle size={52} />}
            tone="bad"
            title={t('page.resume.deadTitle')}
            body={t('page.resume.deadBody')}
            extra={reference}
            action={backButton}
          />
        );
    }
  };

  return (
    <Layout>
      <div className="payment-page-wrapper">
        <div
          className="payment-page-bg-blur"
          style={{ backgroundImage: `url(${eventInfo?.event_img})` }}
        />
        <div className="payment-page-bg-overlay" />

        {/* Consentimiento del flujo privado: solo antes de crear la solicitud. */}
        {requiresApproval && !approvalAccepted && !resuming && !requestSent && !paymentSuccess && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-modal-title"
            style={{
              // zIndex 2000: por ENCIMA de MobileTabBar (fixed, bottom:0,
              // z-index:1000). Con el mismo z-index la barra se pintaba encima
              // y tapaba el botón Continuar en móvil. overflowY:auto +
              // alignItems:flex-start para que en pantallas bajas el modal
              // haga scroll en vez de empujar los botones fuera de la vista.
              position: "fixed", inset: 0, zIndex: 2000,
              background: "rgba(3, 3, 8, 0.82)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "flex-start", justifyContent: "center",
              padding: "1rem", overflowY: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div style={{
              maxWidth: "460px", width: "100%",
              maxHeight: "calc(100dvh - 2rem)", overflowY: "auto",
              margin: "auto",
              background: "#14141c",
              border: "1px solid rgba(139, 92, 246, 0.35)",
              borderRadius: "16px", padding: "1.5rem",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              color: "#e8e8ee",
            }}>
              <div style={{ fontSize: "2rem", textAlign: "center", marginBottom: "0.5rem" }}>🔒</div>
              <h3 id="approval-modal-title" style={{
                margin: "0 0 0.75rem", textAlign: "center",
                fontSize: "1.25rem", fontWeight: 700, color: "#ffffff",
              }}>
                {t('page.private.title')}
              </h3>
              {/* Modal compacto: una sola línea que CONSERVA el aviso del
                  "cargo normal (no pendiente)" — la regla de siempre para
                  evitar la llamada de "me habéis cobrado". El detalle completo
                  (los 4 pasos, la reversión, las 48 h) vive en la pestaña de
                  términos que abre el enlace del checkbox. */}
              <p style={{ margin: "0 0 1rem", fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.8)" }}>
                {t('page.private.leadShort')}
              </p>

              {/* CASILLA OBLIGATORIA. Marcar exige un gesto distinto a pulsar
                  un botón "entendido", y deja constancia de que el comprador
                  aceptó el aviso del cargo. Fila pulsable (onClick) en vez de
                  <label> envolvente para que tocar el enlace de términos NO
                  marque/desmarque la casilla. */}
              <div
                onClick={() => setApprovalConsent((v) => !v)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "0.7rem",
                  margin: "0 0 1.25rem", padding: "0.85rem",
                  borderRadius: "12px", cursor: "pointer",
                  background: approvalConsent ? "rgba(139, 92, 246, 0.12)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${approvalConsent ? "rgba(139, 92, 246, 0.5)" : "rgba(255,255,255,0.12)"}`,
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <input
                  id="approval-consent"
                  type="checkbox"
                  checked={approvalConsent}
                  onChange={(e) => setApprovalConsent(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "20px", height: "20px", marginTop: "1px",
                    accentColor: "#8b5cf6", cursor: "pointer", flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
                  {(() => {
                    const parts = t('page.private.consentShort').split('%TERMS%');
                    return (
                      <>
                        {parts[0]}
                        <a
                          href={`/${currentLang}/private-event-terms`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "#a78bfa", textDecoration: "underline", fontWeight: 600 }}
                        >
                          {t('page.private.termsLink')}
                        </a>
                        {parts[1] ?? ''}
                      </>
                    );
                  })()}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    flex: 1, padding: "0.75rem", borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.18)", background: "transparent",
                    color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", cursor: "pointer",
                  }}
                >
                  {t('page.private.back')}
                </button>
                <button
                  onClick={() => setApprovalAccepted(true)}
                  disabled={!approvalConsent}
                  aria-disabled={!approvalConsent}
                  style={{
                    flex: 2, padding: "0.75rem", borderRadius: "10px", border: "none",
                    background: approvalConsent
                      ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                      : "rgba(255,255,255,0.1)",
                    color: approvalConsent ? "#fff" : "rgba(255,255,255,0.4)",
                    fontSize: "0.95rem", fontWeight: 600,
                    cursor: approvalConsent ? "pointer" : "not-allowed",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {t('page.private.accept')}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="payment-page-content">
          <div className="payment-page-container">
            {error && (
              <div className="payment-page-error">
                <div className="payment-page-error-content">
                  <AlertCircle className="payment-page-error-icon" />
                  <div className="payment-page-error-text">
                    <h4 className="payment-page-error-title">{t('page.error')}</h4>
                    <p className="payment-page-error-message">{error}</p>
                  </div>
                  <button
                    onClick={handleDismissError}
                    className="payment-page-error-close"
                    aria-label={t('page.dismissError')}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {cancelled && (
              <div style={{
                padding: "1rem",
                marginBottom: "1.5rem",
                borderRadius: "0.75rem",
                background: "rgba(251, 191, 36, 0.1)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                color: "rgb(252, 211, 77)",
              }}>
                <AlertCircle size={20} />
                <span>{t('page.cancelledWarning')}</span>
              </div>
            )}

            {requestSent ? (
              // PRIVADO: no es "pagado", es "solicitud enviada con el importe
              // retenido". El texto lo dice sin rodeos para que nadie crea que
              // ya tiene entrada.
              <StatusPanel
                icon={<Clock size={52} />}
                tone="wait"
                title={t('page.requestSent.title')}
                body={t('page.requestSent.body')}
                extra={
                  <>
                    <p className="payment-status-panel-body">{t('page.requestSent.detail')}</p>
                    {requestSent.orderNumber && (
                      <p className="payment-status-panel-reference">
                        {t('page.requestSent.reference')}: <strong>{requestSent.orderNumber}</strong>
                      </p>
                    )}
                  </>
                }
                action={
                  <>
                    <button
                      className="payment-status-panel-button"
                      onClick={() => navigate(buildUrl(`/order/payment-success?order_id=${requestSent.orderId}`))}
                    >
                      {t('page.requestSent.viewStatus')}
                    </button>
                    <button
                      className="payment-status-panel-button payment-status-panel-button-ghost"
                      onClick={backToEvent}
                    >
                      {t('page.requestSent.backToEvent')}
                    </button>
                  </>
                }
              />
            ) : paymentSuccess ? (
              <StatusPanel
                icon={<CheckCircle size={52} />}
                tone="ok"
                title={t('page.paidTitle')}
                body={t('page.paidBody')}
                extra={
                  <>
                    <div className="payment-page-loading-spinner" style={{ margin: "1.5rem auto 0" }}></div>
                    <p className="payment-status-panel-reference">{t('page.redirecting')}</p>
                  </>
                }
              />
            ) : resuming ? (
              renderResume()
            ) : (
              <>
                <EventInfoCard eventInfo={eventInfo} />

                <div className="payment-page-grid">
                  <div className="payment-page-left">
                    {requiresApproval && (
                      <div className="payment-approval-notice">
                        <div className="payment-approval-notice-title">
                          🔒 {t('page.private.noticeTitle')}
                        </div>
                        <p>{t('page.private.noticeBody')}</p>
                        <ul>
                          <li>{t('page.private.step2')}</li>
                          <li>{t('page.private.step3')}</li>
                          <li>{t('page.private.step4')}</li>
                        </ul>
                        <p className="payment-approval-notice-foot">
                          {t('page.private.foot')}
                        </p>
                      </div>
                    )}

                    <UserDetailsForm
                      quantity={Number(quantity!)}
                      ref={formRef}
                      initialData={cancelledOrderData}
                      ticketGender={ticketGender}
                      minAge={eventInfo?.min_age}
                    />

                    {/* Público y privado usan EL MISMO formulario: la
                        diferencia (cobrar vs retener) la decide el backend.
                        Y con el interruptor apagado `showCardForm` es true
                        siempre: esto es exactamente lo que se pintaba antes. */}
                    {/* TARJETA ARRIBA, WALLETS DEBAJO.
                        No es un o-uno-o-el-otro: en la fase 'ready' se pintan
                        LOS DOS. Arriba el formulario de tarjeta de siempre y
                        debajo el widget con Apple Pay y Google Pay. El
                        comprador elige viéndolo todo.

                        El orden es SOLO visual: los dos carriles son
                        independientes (el widget cobra con su propio botón, el
                        formulario con el del resumen), así que intercambiarlos
                        no toca la lógica de pago. */}
                    {showCardForm && renderCardFields(requiresApproval)}
                    {walletMode && walletPhase !== 'fallback' &&
                      renderWalletFields(requiresApproval)}
                  </div>

                  <div className="payment-page-right">
                    <TicketReceipt
                      quantity={Number(quantity!)}
                      ticketDetails={ticketDetails}
                      buttonText={
                        processing
                          ? t('page.processing')
                          : walletPreparing
                            ? t('page.wallet.preparing')
                            // Con el widget YA pintado, este botón cobra con el
                            // formulario de tarjeta (que va ARRIBA del widget)
                            // — los wallets tienen su propio botón dentro del
                            // widget. Antes aquí ponía "elige arriba" y el
                            // botón se quedaba muerto, porque la tarjeta vivía
                            // dentro del widget.
                            : walletReady
                              ? t('page.wallet.payWithCardBelow')
                              : (requiresApproval ? t('page.requestTicket') : t('page.proceedToPayment'))
                      }
                      onConfirm={() => !processing && formRef.current?.submit(onSubmit)}
                      // Ya NO se desactiva en 'ready': ahí es justo cuando sirve
                      // para pagar con tarjeta. Solo mientras se prepara.
                      disabled={processing || walletPreparing}
                    />
                  </div>
                </div>
              </>
            )}

            {processing && (
              <div style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                backdropFilter: "blur(4px)",
              }}>
                <div style={{
                  background: "rgba(15, 15, 21, 0.9)",
                  padding: "2rem",
                  borderRadius: "1rem",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  textAlign: "center",
                  maxWidth: "26rem",
                }}>
                  <div className="payment-page-loading-spinner" style={{ margin: "0 auto 1rem" }}></div>
                  <p style={{ color: "white", margin: 0 }}>{t('page.processingOrder')}</p>
                  <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.875rem", margin: "0.5rem 0 0" }}>
                    {t('page.processingWait')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
