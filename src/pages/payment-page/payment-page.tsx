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
} from "../../controller/purchase-pages-controller";
import type { TicketType, EventDetailedInfo } from "../../types/types";
import { AlertCircle, CheckCircle, Clock, CreditCard } from "lucide-react";
import { EventInfoCard } from "../../components/event-info-card/event-info-card";
import { apiClient } from "../../utils/axios";
import { validateUUID } from "../../utils/security";
import { classifyOrderStatus, validatePaymentLinkCode, type OrderStage } from "../../utils/orderStatus";

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
    const paymentResponse = await payOrder(orderId, linkCode, {
      number: num,
      exp_month: mm,
      exp_year: yy,
      cvv: cardCvv,
    });

    if (paymentResponse?.success === false) {
      throw new Error(paymentResponse.error || t('page.paymentFailed'));
    }

    // La tarjeta ya no hace falta: fuera del estado en cuanto se resuelve.
    clearCard();
    setProcessing(false);

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

  const onSubmit = async (formData: any) => {
    if (processing) return;

    if (!cardValid()) {
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

      await chargeCard(orderId, linkCode);
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
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(3, 3, 8, 0.82)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "1rem",
            }}
          >
            <div style={{
              maxWidth: "460px", width: "100%",
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
              <p style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.8)" }}>
                {t('page.private.intro')}
              </p>
              <ul style={{ margin: "0 0 0.75rem", paddingLeft: "1.1rem", fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(255,255,255,0.78)" }}>
                <li>{t('page.private.step1')}</li>
                <li>{t('page.private.step2')}</li>
                <li>{t('page.private.step3')}</li>
                <li>{t('page.private.step4')}</li>
              </ul>
              <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>
                {t('page.private.foot')}
              </p>

              {/* CASILLA OBLIGATORIA. Antes bastaba con pulsar "Entendido", y
                  eso se pulsa sin leer. Marcar una casilla exige un gesto
                  distinto y deja constancia de que el comprador aceptó ESTE
                  texto — que es el que le explica que en su banco puede verlo
                  como un cargo normal, no como algo pendiente. Sin eso, la
                  llamada de "me habéis cobrado" es cuestión de tiempo.
                  Toda la fila es pulsable: en móvil dar solo a la casilla es
                  incómodo. */}
              <label
                htmlFor="approval-consent"
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
                  style={{
                    width: "20px", height: "20px", marginTop: "1px",
                    accentColor: "#8b5cf6", cursor: "pointer", flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
                  {t('page.private.consent')}
                </span>
              </label>

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
                        diferencia (cobrar vs retener) la decide el backend. */}
                    {renderCardFields(requiresApproval)}
                  </div>

                  <div className="payment-page-right">
                    <TicketReceipt
                      quantity={Number(quantity!)}
                      ticketDetails={ticketDetails}
                      buttonText={
                        processing
                          ? t('page.processing')
                          : (requiresApproval ? t('page.requestTicket') : t('page.proceedToPayment'))
                      }
                      onConfirm={() => !processing && formRef.current?.submit(onSubmit)}
                      disabled={processing}
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
