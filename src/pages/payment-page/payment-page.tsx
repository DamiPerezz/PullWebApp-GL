// payment-page.tsx - CORREGIDO
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
import { ChevronLeft, Calendar, Clock, MapPin, AlertCircle, CheckCircle } from "lucide-react";

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
            } catch (e) {
              console.error("Error parsing tickets_data:", e);
            }
          }
        })
        .catch((error) => {
          console.error("Error loading cancelled order data:", error);
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
      .catch((error) => {
        console.error("Error fetching data:", error);
        setError("Failed to load event information. Please try again.");
        setIsLoading(false);
      });
  }, [eventId, ticketTypeId, orderIdParam, cancelledParam]);

  const onSubmit = async (formData: any) => {
    if (processing) return;

    console.log('📤 Form data received:', formData);

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

      console.log('✅ Data structure validated');

      // 1. Create pending order
      const orderResponse = await createPendingOrder(
        ticketTypeId!,
        eventId!,
        formData
      );

      console.log('✅ Order created:', orderResponse);

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || "Failed to create pending order");
      }

      const orderId = orderResponse.order_id;

      // 2. Simulate Stripe payment
      console.log('💳 Simulating payment...');
      const paymentResponse = await simulateStripePayment(orderId);

      console.log('✅ Payment simulated:', paymentResponse);

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || "Payment simulation failed");
      }

      // 3. Show success
      setPaymentSuccess(true);
      setProcessing(false);

      // 4. Redirect after 3 seconds - ✅ RUTA CORREGIDA
      setTimeout(() => {
        navigate(`/order/payment-success?order_id=${orderId}`);
      }, 3000);
      
    } catch (error: any) {
      console.error("❌ Error during checkout:", error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      if (error.response?.data?.details) {
        console.error('Error details:', error.response.data.details);
      }
      
      setError(errorMessage);
      setProcessing(false);
    }
  };

  const handleBack = () => {
    if (processing) return;
    navigate(`/event/${eventId}/tickets/${ticketTypeId}`);
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
            {!paymentSuccess && (
              <button
                onClick={handleBack}
                className="payment-page-back-button"
                disabled={processing}
              >
                <ChevronLeft />
                Back to Tickets
              </button>
            )}

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
                    <div className="payment-page-step-number">1</div>
                    <div className="payment-page-step-label">Select Tickets</div>
                  </div>
                  <div className="payment-page-step-line payment-page-step-line-completed"></div>
                  <div className="payment-page-step payment-page-step-active">
                    <div className="payment-page-step-number">2</div>
                    <div className="payment-page-step-label">Enter Data</div>
                  </div>
                  <div className="payment-page-step-line"></div>
                  <div className="payment-page-step">
                    <div className="payment-page-step-number">3</div>
                    <div className="payment-page-step-label">Payment</div>
                  </div>
                </div>

                <div className="payment-page-event-info">
                  <div className="payment-page-event-image">
                    <img src={eventInfo?.event_img} alt={eventInfo?.event_name} />
                  </div>
                  <div className="payment-page-event-details">
                    <h2 className="payment-page-event-name">{eventInfo?.event_name}</h2>
                    <div className="payment-page-event-meta">
                      <p>
                        <Calendar className="payment-page-event-icon" />
                        <span>{new Date(eventInfo?.date || '').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </p>
                      <p>
                        <Clock className="payment-page-event-icon" />
                        <span>{eventInfo?.open_time?.slice(0, 5)} - {eventInfo?.close_time?.slice(0, 5)}</span>
                      </p>
                      <p>
                        <MapPin className="payment-page-event-icon" />
                        <span>{eventInfo?.location}</span>
                      </p>
                    </div>
                  </div>
                </div>

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