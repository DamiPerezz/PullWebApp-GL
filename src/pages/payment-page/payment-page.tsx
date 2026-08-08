// payment-page.tsx
// SECURITY: Using apiClient for consistent cookie-based authentication
//
// FLUJO dLOCAL GO (checkout alojado) — 2026-08:
//
//   PÚBLICO   datos del asistente → crear orden → el backend crea el pago en
//             dLocal y devuelve `redirect_url` → REDIRIGIMOS al comprador a la
//             página de dLocal. Vuelve a /order/payment-success, que consulta
//             el estado real (el pago se confirma por webhook, no aquí).
//
//   PRIVADO   datos del asistente → crear orden → el backend responde
//             `requires_approval: true` → NO se pide tarjeta y NO se redirige:
//             se muestra "solicitud enviada". Si el local la aprueba, llega un
//             correo con un ENLACE DE PAGO (?order_id=…&code=…) que vuelve a
//             esta misma página en modo "retomar orden".
//
// Aquí NUNCA se piden datos de tarjeta: dLocal Go no los acepta y el
// comprador los introduce en la página de dLocal.
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
  startOrderCheckout,
  getOrderDetails,
  getOrderDataAfterCancel,
} from "../../controller/purchase-pages-controller";
import type { TicketType, EventDetailedInfo } from "../../types/types";
import { AlertCircle, CheckCircle, Clock, Lock, ShieldCheck } from "lucide-react";
import { EventInfoCard } from "../../components/event-info-card/event-info-card";
import { apiClient } from "../../utils/axios";
import { validateUUID } from "../../utils/security";
import { classifyOrderStatus, validatePaymentLinkCode, type OrderStage } from "../../utils/orderStatus";

type ResumeState =
  | { phase: 'loading' }
  | { phase: 'ready'; stage: OrderStage; orderNumber: string }
  | { phase: 'notFound' };

// Panel centrado para los estados que NO son un formulario: solicitud
// enviada, orden ya pagada, solicitud caducada… Fuera del componente para no
// remontarlo en cada render.
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

  // RETOMAR ORDEN: el enlace de pago del correo de aprobación trae
  // ?order_id=…&code=…. Antes la página IGNORABA order_id fuera de la rama
  // `cancelled=true` y creaba una orden NUEVA (reservando plaza otra vez).
  // Ahora, con order_id y sin `cancelled`, se retoma esa orden tal cual.
  const resuming = Boolean(orderIdParam) && !cancelled;

  const formRef = useRef<{ submit: (onSubmit: any) => void }>(null);
  // Orden ya creada, reutilizada entre reintentos: recrearla en cada intento
  // generaba una orden (y una reserva de aforo) nueva por reintento tras un
  // timeout de red. Con esto, un reintento reusa la misma orden.
  const orderRef = useRef<{ orderId: string; code: string } | null>(null);
  const navigate = useNavigate();

  const [ticketDetails, setTicketDetails] = useState<TicketType>({} as TicketType);
  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);
  const [loading, setIsLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelledOrderData, setCancelledOrderData] = useState<any>(null);
  // Evento privado: la solicitud se envió (sin cobro, sin tarjeta).
  const [requestSent, setRequestSent] = useState<{ orderNumber: string } | null>(null);
  const [resumeState, setResumeState] = useState<ResumeState>({ phase: 'loading' });
  // Consentimiento explícito para eventos privados: el usuario debe leer y
  // aceptar cómo funciona (solicitud gratis → si aprueban, pagas) ANTES de
  // ver el formulario. Transparencia.
  const [approvalAccepted, setApprovalAccepted] = useState<boolean>(false);

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

  // Modo "retomar orden": leer el estado REAL antes de ofrecer pagar. Una
  // orden ya pagada, rechazada o caducada no debe volver a mandar a la
  // pasarela.
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
        });
      })
      .catch(() => {
        if (alive) setResumeState({ phase: 'notFound' });
      });

    return () => { alive = false; };
  }, [resuming, orderIdParam]);

  // Manda al comprador a la página de pago de dLocal. A partir de aquí el
  // pago ocurre FUERA de nuestra web; volverá por success_url (o back_url si
  // se echa atrás).
  const goToCheckout = async (orderId: string, code: string) => {
    const origin = window.location.origin;
    const successUrl = `${origin}${buildUrl(`/order/payment-success?order_id=${orderId}`)}`;
    // El `code` viaja en el back_url para que, si el comprador se echa atrás
    // en dLocal, "intentar de nuevo" RETOME esta orden en vez de crear otra
    // (y volver a reservar aforo).
    const backUrl = `${origin}${buildUrl(
      `/order/payment-cancel?order_id=${orderId}&code=${code}&event_id=${eventId}&ticket_type_id=${ticketTypeId}&quantity=${quantity}`
    )}`;

    const { redirectUrl } = await startOrderCheckout(orderId, code, { successUrl, backUrl });
    setRedirecting(true);
    // assign (y no replace): que el botón "atrás" del navegador devuelva aquí.
    window.location.assign(redirectUrl);
  };

  const describeError = (err: unknown): string => {
    const e = (err || {}) as { response?: { data?: { error?: string } }; message?: string };
    // El mensaje del BACKEND primero (402/403/409 traen error.response.data).
    if (e.response?.data?.error) return e.response.data.error;
    if (e.message === 'MISSING_REDIRECT_URL' || e.message === 'CHECKOUT_UNAVAILABLE') {
      return t('page.checkoutFailed');
    }
    // Sin `response` no hubo respuesta del servidor (timeout / red móvil).
    if (!e.response) return t('page.networkError');
    if (e.message) return e.message;
    return t('page.unexpectedError');
  };

  const onSubmit = async (formData: any) => {
    if (processing) return;

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
      let needsApproval = false;

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

        // EVENTO PRIVADO: el backend crea la SOLICITUD (awaiting_approval) sin
        // mover dinero. No hay tarjeta, no hay redirección — se acabó el flujo
        // aquí hasta que el local decida.
        //
        // La fuente de verdad es `requires_approval` de la respuesta. Si el
        // backend no lo manda (versión antigua), se cae al flag del evento:
        // mandar a pagar una solicitud privada sería un 409 y una pantalla
        // rota.
        const eventIsPrivate = Boolean(eventInfo.is_private || eventInfo.require_approval);
        needsApproval = orderResponse.requires_approval === undefined
          ? eventIsPrivate
          : Boolean(orderResponse.requires_approval);
        if (needsApproval) {
          setRequestSent({ orderNumber: orderResponse.order_number || '' });
          setProcessing(false);
          return;
        }
      }

      if (!orderId || !linkCode) {
        throw new Error(t('page.failedToCreateOrder'));
      }

      // EVENTO PÚBLICO: a la pasarela de dLocal.
      await goToCheckout(orderId, linkCode);
    } catch (error) {
      setError(describeError(error));
      setProcessing(false);
    }
  };

  const onResumePay = async () => {
    if (processing || !orderIdParam) return;
    if (!codeParam) {
      setError(t('page.resume.missingCode'));
      return;
    }
    setProcessing(true);
    setError(null);
    try {
      await goToCheckout(orderIdParam, codeParam);
    } catch (error) {
      setError(describeError(error));
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

  // Evento privado: se solicita sin pagar y el local aprueba o rechaza.
  const requiresApproval = Boolean(eventInfo?.is_private || eventInfo?.require_approval);

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

    const { stage, orderNumber } = resumeState;
    const reference = orderNumber ? (
      <p className="payment-status-panel-reference">
        {t('page.requestSent.reference')}: <strong>{orderNumber}</strong>
      </p>
    ) : undefined;

    switch (stage) {
      case 'payable':
        return (
          <>
            <EventInfoCard eventInfo={eventInfo} />
            <div className="payment-page-grid">
              <div className="payment-page-left">
                <div className="payment-approval-notice">
                  <div className="payment-approval-notice-title">
                    ✅ {t('page.resume.payableTitle')}
                  </div>
                  <p>{t('page.resume.payableBody')}</p>
                  {reference}
                </div>
                <div className="payment-redirect-notice">
                  <ShieldCheck size={18} />
                  <span>{t('page.redirectNotice')}</span>
                </div>
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
                  buttonText={processing ? t('page.processing') : t('page.resume.payNow')}
                  onConfirm={onResumePay}
                  disabled={processing || !codeParam}
                />
              </div>
            </div>
          </>
        );

      case 'awaitingApproval':
      case 'legacyHold':
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

        {/* Consentimiento del flujo privado: solo al CREAR una solicitud. */}
        {requiresApproval && !approvalAccepted && !resuming && !requestSent && (
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
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.55)" }}>
                {t('page.private.foot')}
              </p>
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
                  style={{
                    flex: 2, padding: "0.75rem", borderRadius: "10px", border: "none",
                    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                    color: "#fff", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
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
              <StatusPanel
                icon={<CheckCircle size={52} />}
                tone="ok"
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
                  <button className="payment-status-panel-button" onClick={backToEvent}>
                    {t('page.requestSent.backToEvent')}
                  </button>
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

                    {/* Sin campos de tarjeta: dLocal Go no los acepta y el
                        comprador los introduce en la pasarela. */}
                    {!requiresApproval && (
                      <div className="payment-redirect-notice">
                        <ShieldCheck size={18} />
                        <span>{t('page.redirectNotice')}</span>
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
                          : (requiresApproval ? t('page.requestTicket') : t('page.proceedToPayment'))
                      }
                      onConfirm={() => !processing && formRef.current?.submit(onSubmit)}
                      disabled={processing}
                    />
                  </div>
                </div>
              </>
            )}

            {(processing || redirecting) && (
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
                  <p style={{ color: "white", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    {redirecting && <Lock size={16} />}
                    {redirecting ? t('page.redirectTitle') : t('page.processingOrder')}
                  </p>
                  <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.875rem", margin: "0.5rem 0 0" }}>
                    {redirecting ? t('page.redirectBody') : t('page.processingWait')}
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
