// payment-page.tsx
// SECURITY: Using apiClient for consistent cookie-based authentication
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import "./payment-page.css";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import { UserDetailsForm } from "../../components/user-details-form/user-details-form";
import { useEffect, useRef, useState } from "react";
import {
  getTicketInfo,
  getEventDetailedInfo,
  createPendingOrder,
  simulateStripePayment,
  getOrderDataAfterCancel,
} from "../../controller/purchase-pages-controller";
import type { TicketType, EventDetailedInfo } from "../../types/types";
import { AlertCircle, CheckCircle, Check } from "lucide-react";
import { EventInfoCard } from "../../components/event-info-card/event-info-card";
import { apiClient } from "../../utils/axios";

export const PaymentPage = () => {
  const { eventId, ticketTypeId, quantity } = useParams<{
    eventId: string;
    ticketTypeId: string;
    quantity: string;
  }>();

  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get("order_id");
  const cancelledParam = searchParams.get("cancelled");

  const formRef = useRef<{ submit: (onSubmit: any) => void }>(null);
  const navigate = useNavigate();

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
        setError("Failed to load event information. Please try again.");
        setIsLoading(false);
      });
  }, [eventId, ticketTypeId, orderIdParam, cancelledParam]);

  const onSubmit = async (formData: any) => {
    if (processing) return;

    setProcessing(true);
    setError(null);

    try {
      if (!formData || !formData.usuarios || !Array.isArray(formData.usuarios)) {
        throw new Error("Invalid form data structure. Expected { usuarios: [...] }");
      }

      if (formData.usuarios.length === 0) {
        throw new Error("No ticket information provided");
      }

      const missingFields = formData.usuarios.some((ticket: any) =>
        !ticket.owner_name || !ticket.owner_last_name || !ticket.owner_email ||
        !ticket.owner_phone || !ticket.owner_birthdate
      );

      if (missingFields) {
        throw new Error("Please fill in all required fields for each ticket");
      }

      // Verificar que tenemos eventInfo con el ID real
      if (!eventInfo) {
        throw new Error("Event information not loaded");
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
        throw new Error("Could not determine event ID");
      }

      // Crear orden pendiente
      const orderResponse = await createPendingOrder(
        realEventID!, // ← ID REAL del evento
        ticketTypeId!,
        ticketDetails.ticket_name,
        ticketDetails.ticket_price,
        ticketDetails.currency || 'EUR',
        formData
      );

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || "Failed to create pending order");
      }

      const orderId = orderResponse.order_id;

      // Simular pago de Stripe
      const paymentResponse = await simulateStripePayment(orderId);

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || "Payment simulation failed");
      }

      setPaymentSuccess(true);
      setProcessing(false);

      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate(`/order/payment-success?order_id=${orderId}`);
      }, 3000);

    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
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
                    <h4 className="payment-page-error-title">Error</h4>
                    <p className="payment-page-error-message">{error}</p>
                  </div>
                  <button
                    onClick={handleDismissError}
                    className="payment-page-error-close"
                    aria-label="Dismiss error"
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
                <span>Payment was cancelled. Your form data has been preserved. You can try again when ready.</span>
              </div>
            )}

            {!paymentSuccess ? (
              <>
                <div className="payment-page-steps">
                  <div className="payment-page-step payment-page-step-completed">
                    <div className="payment-page-step-number"><Check size={14} strokeWidth={3} /></div>
                    <div className="payment-page-step-label">Select Tickets</div>
                  </div>
                  <div className="payment-page-step-line payment-page-step-line-completed"></div>
                  <div className="payment-page-step payment-page-step-active">
                    <div className="payment-page-step-number">2</div>
                    <div className="payment-page-step-label">Enter Details</div>
                  </div>
                  <div className="payment-page-step-line"></div>
                  <div className="payment-page-step">
                    <div className="payment-page-step-number">3</div>
                    <div className="payment-page-step-label">Payment</div>
                  </div>
                </div>

                <EventInfoCard eventInfo={eventInfo} />

                <div className="payment-page-grid">
                  <div className="payment-page-left">
                    <UserDetailsForm
                      quantity={Number(quantity!)}
                      ref={formRef}
                      initialData={cancelledOrderData}
                      ticketGender={ticketGender}
                    />
                  </div>

                  <div className="payment-page-right">
                    <TicketReceipt
                      quantity={Number(quantity!)}
                      ticketDetails={ticketDetails}
                      buttonText={processing ? "Processing..." : "Proceed to Payment"}
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
                  Payment Successful!
                </h2>
                <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "1.125rem", marginBottom: "2rem", maxWidth: "600px" }}>
                  Your order has been submitted and is pending staff approval. You'll receive an email confirmation shortly.
                </p>
                <div className="payment-page-loading-spinner" style={{ margin: "0 auto" }}></div>
                <p style={{ color: "rgba(255, 255, 255, 0.6)", marginTop: "1rem" }}>
                  Redirecting...
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
                  <p style={{ color: "white", margin: 0 }}>Processing your order...</p>
                  <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.875rem", margin: "0.5rem 0 0" }}>
                    Please wait while we confirm your payment
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