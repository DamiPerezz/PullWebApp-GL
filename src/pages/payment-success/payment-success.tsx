import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import { useEffect, useState } from "react";
import { confirmStripePayment } from "../../controller/purchase-pages-controller";
import { getEventDetailedInfo } from "../../controller/purchase-pages-controller";
import "./payment-success.css";
import { CheckCircle, Loader } from "lucide-react";

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [eventImage, setEventImage] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const orderId = localStorage.getItem('pending_order_id');
    const eventId = localStorage.getItem('pending_event_id');

    if (!sessionId) {
      setError("Missing session information");
      setLoading(false);
      return;
    }

    if (!orderId || !eventId) {
      setError("Missing order information");
      setLoading(false);
      return;
    }

    // Cargar imagen del evento para el fondo
    getEventDetailedInfo(eventId)
      .then((eventData) => {
        if (eventData?.event_img) {
          setEventImage(eventData.event_img);
        }
      })
      .catch((err) => {
        console.log("Could not load event image:", err);
      });

    console.log('Processing payment success:', { sessionId, orderId, eventId });

    // Confirmar el pago con el backend
    confirmStripePayment(sessionId, orderId)
      .then(() => {
        console.log('Payment confirmed successfully');
        
        // Mostrar mensaje de éxito
        setSuccess(true);
        setLoading(false);
        
        // Esperar 2 segundos para que el usuario vea el mensaje
        setTimeout(() => {
          // Limpiar localStorage
          localStorage.removeItem('pending_order_id');
          localStorage.removeItem('pending_event_id');
          localStorage.removeItem('pending_ticket_type_id');
          localStorage.removeItem('pending_quantity');
          
          // Redirigir a la página de post-payment
          navigate(`/wallet/${orderId}/${eventId}`);
        }, 2000);
      })
      .catch((err) => {
        console.error("Error confirming payment:", err);
        setError(err.response?.data?.error || "Error confirming payment");
        setLoading(false);
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <Layout>
        <div className="payment-success-wrapper">
          {/* Background */}
          {eventImage ? (
            <>
              <div 
                className="payment-success-bg-blur"
                style={{ backgroundImage: `url(${eventImage})` }}
              />
              <div className="payment-success-bg-overlay" />
            </>
          ) : (
            <div className="payment-success-bg-gradient" />
          )}

          <div className="payment-success-content">
            <div className="payment-success-container">
              <div className="payment-success-card payment-success-error">
                <div className="payment-success-icon-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2"/>
                  </svg>
                </div>
                <h1 className="payment-success-title">Error</h1>
                <p className="payment-success-message">{error}</p>
                <button 
                  onClick={() => navigate('/')}
                  className="payment-success-button"
                >
                  Back to home
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="payment-success-wrapper">
        {/* Background with blur effect */}
        {eventImage ? (
          <>
            <div 
              className="payment-success-bg-blur"
              style={{ backgroundImage: `url(${eventImage})` }}
            />
            <div className="payment-success-bg-overlay" />
          </>
        ) : (
          <div className="payment-success-bg-gradient" />
        )}

        <div className="payment-success-content">
          <div className="payment-success-container">
            <div className="payment-success-card">
              {loading ? (
                <>
                  <div className="payment-success-spinner">
                    <Loader className="spinner-icon" />
                  </div>
                  <h1 className="payment-success-title">Processing payment</h1>
                  <p className="payment-success-message">
                    We're confirming your payment and generating your tickets...
                  </p>
                  <div className="payment-success-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </>
              ) : success ? (
                <>
                  <div className="payment-success-icon">
                    <CheckCircle />
                  </div>
                  <h1 className="payment-success-title">Payment successful!</h1>
                  <p className="payment-success-message">
                    Your payment has been processed successfully. Redirecting to your tickets...
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};