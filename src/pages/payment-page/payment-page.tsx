// payment-page.tsx
// SECURITY: Using apiClient for consistent cookie-based authentication
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Layout } from "../../components/layout/layout";
import "./payment-page.css";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import { UserDetailsForm } from "../../components/user-details-form/user-details-form";
import { useEffect, useRef, useState } from "react";
import {
  getTicketInfo,
  getEventDetailedInfo,
  createPendingOrder,
  payOrder,
  getOrderDataAfterCancel,
} from "../../controller/purchase-pages-controller";
import type { TicketType, EventDetailedInfo } from "../../types/types";
import { AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { EventInfoCard } from "../../components/event-info-card/event-info-card";
import { apiClient } from "../../utils/axios";

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
  const orderIdParam = searchParams.get("order_id");
  const cancelledParam = searchParams.get("cancelled");

  const formRef = useRef<{ submit: (onSubmit: any) => void }>(null);
  // Orden ya creada, reutilizada entre reintentos: recrearla en cada intento
  // generaba una orden (y un cargo) nueva por reintento tras un timeout de red
  // → doble cobro. Con esto, un reintento reusa la misma orden y el backend
  // (claim atómico) lo resuelve sin recobrar.
  const orderRef = useRef<{ orderId: string; code: string } | null>(null);
  const navigate = useNavigate();

  // Card state (direct-card flow — the backend charges via the gateway).
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

  const cardValid = () => {
    const num = cardNumber.replace(/\s/g, "");
    const [mm, yy] = cardExpiry.split("/");
    return (
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
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

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

    if (cancelledParam === "true" && orderIdParam) {
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
  }, [eventId, ticketTypeId, orderIdParam, cancelledParam, t]);

  const onSubmit = async (formData: any) => {
    if (processing) return;

    if (!cardValid()) {
      setError("Completa los datos de la tarjeta (número, vencimiento MM/AA y CVV)");
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

      // Verificar que tenemos eventInfo con el ID real
      if (!eventInfo) {
        throw new Error(t('page.eventNotLoaded'));
      }

      // ✅ Necesitamos obtener el event_id real del backend
      // Primero verificamos si eventInfo tiene un campo 'id' o 'event_id'
      let realEventID = (eventInfo as any).event_id || (eventInfo as any).id;

      if (!realEventID) {
        // Si no tenemos el ID, necesitamos hacer una petición adicional
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

      // Cobro real con tarjeta: el backend hace las dos transacciones
      // atómicas (parte del venue + fee de servicio) contra la pasarela.
      // El payment_link_code de la orden es obligatorio (anti-carding).
      const num = cardNumber.replace(/\s/g, "");
      const [mm, yy] = cardExpiry.split("/");
      const paymentResponse = await payOrder(orderId, linkCode, {
        number: num,
        exp_month: mm,
        exp_year: yy,
        cvv: cardCvv,
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || t('page.paymentSimulationFailed'));
      }

      setPaymentSuccess(true);
      setProcessing(false);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate(buildUrl(`/order/payment-success?order_id=${orderId}`));
      }, 3000);

    } catch (error: any) {
      // El mensaje del BACKEND primero (402/403/409 traen error.response.data).
      // Si NO hay response (timeout/red móvil), NO mostrar el técnico
      // "Request failed with status code…" en inglés: el cobro pudo pasar, así
      // que se pide NO reintentar y revisar el correo.
      let errorMessage = t('page.unexpectedError');
      const noResponse = !error.response;

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (noResponse) {
        errorMessage = t('page.networkError');
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
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

  // Private events hold the payment until staff approves the request.
  const requiresApproval = Boolean(
    (eventInfo as any)?.is_private || (eventInfo as any)?.require_approval
  );

  return (
    <Layout>
      <div className="payment-page-wrapper">
        <div
          className="payment-page-bg-blur"
          style={{ backgroundImage: `url(${eventInfo?.event_img})` }}
        />
        <div className="payment-page-bg-overlay" />

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

            {cancelledParam === "true" && (
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

            {!paymentSuccess ? (
              <>
                <EventInfoCard eventInfo={eventInfo} />

                <div className="payment-page-grid">
                  <div className="payment-page-left">
                    {requiresApproval && (
                      <div className="payment-approval-notice">
                        <div className="payment-approval-notice-title">
                          🔒 Evento privado — requiere aprobación
                        </div>
                        <p>
                          Este es un evento privado. Al continuar,{" "}
                          <strong>se retiene el importe pero NO se cobra todavía</strong>.
                          El equipo del local revisa tu solicitud (hasta 48&nbsp;h):
                        </p>
                        <ul>
                          <li>✅ Si te <strong>aceptan</strong>, se cobra y recibes tu entrada con el QR por correo.</li>
                          <li>↩️ Si te <strong>rechazan</strong> o pasan 48&nbsp;h, se libera la retención y no se te cobra nada.</li>
                        </ul>
                        <p className="payment-approval-notice-foot">
                          No hace falta que llames: te avisaremos por correo en cada paso.
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

                    <div className="payment-card-section">
                      <div className="payment-card-header">
                        <CreditCard size={18} />
                        <span>Datos de pago</span>
                      </div>
                      <div className="payment-card-fields">
                        <input
                          className="payment-card-input payment-card-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder="Número de tarjeta"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                          disabled={processing}
                        />
                        <div className="payment-card-row">
                          <input
                            className="payment-card-input"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            disabled={processing}
                          />
                          <input
                            className="payment-card-input"
                            type="password"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder="CVV"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            disabled={processing}
                          />
                        </div>
                      </div>
                      <p className="payment-card-note">
                        Pago seguro procesado por Cybersource. No almacenamos los datos de tu tarjeta.
                      </p>
                    </div>
                  </div>

                  <div className="payment-page-right">
                    <TicketReceipt
                      quantity={Number(quantity!)}
                      ticketDetails={ticketDetails}
                      buttonText={processing ? t('page.processing') : (requiresApproval ? 'Solicitar entrada' : t('page.proceedToPayment'))}
                      onConfirm={() => !processing && formRef.current?.submit(onSubmit)}
                      disabled={processing}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                textAlign: "center",
                padding: "2rem",
              }}>
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "linear-gradient(to right, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.2))",
                  border: "3px solid rgba(52, 211, 153, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "2rem",
                }}>
                  <CheckCircle size={60} color="rgb(52, 211, 153)" />
                </div>
                <h2 style={{ color: "white", fontSize: "2rem", marginBottom: "1rem" }}>
                  {t('page.paymentSuccessTitle')}
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.125rem", marginBottom: "2rem", maxWidth: "600px" }}>
                  {/* Público = ya cobrado y confirmado; privado = retenido
                      pendiente de aprobación. Antes TODOS veían "pendiente
                      de aprobación", falso para el 100% de compras públicas. */}
                  {requiresApproval
                    ? t('page.paymentSuccessDesc')
                    : t('page.paymentSuccessDescConfirmed')}
                </p>
                <div className="payment-page-loading-spinner" style={{ margin: "0 auto" }}></div>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: "1rem" }}>
                  {t('page.redirecting')}
                </p>
              </div>
            )}

            {processing && !paymentSuccess && (
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