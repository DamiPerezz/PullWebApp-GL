import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import { useEffect, useState } from "react";
import { cancelOrder, getEventDetailedInfo } from "../../controller/purchase-pages-controller";
import "../payment-success/payment-success.css";
import { XCircle } from "lucide-react";

export const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [eventImage, setEventImage] = useState<string | null>(null);

  useEffect(() => {
    const orderId = localStorage.getItem('pending_order_id');
    const eventId = localStorage.getItem('pending_event_id');

    // Cargar imagen del evento para el fondo
    if (eventId) {
      getEventDetailedInfo(eventId)
        .then((eventData) => {
          if (eventData?.event_img) {
            setEventImage(eventData.event_img);
          }
        })
        .catch((err) => {
          console.log("Could not load event image:", err);
        });
    }

    if (orderId) {
      // Cancelar la orden en el backend
      cancelOrder(orderId).catch((err) => {
        console.error("Error canceling order:", err);
      });
    }
  }, [searchParams]);

  const handleRetry = () => {
    const orderId = localStorage.getItem('pending_order_id');
    const eventId = localStorage.getItem('pending_event_id');
    const ticketTypeId = localStorage.getItem('pending_ticket_type_id');
    const quantity = localStorage.getItem('pending_quantity');
    
    if (orderId && eventId && ticketTypeId && quantity) {
      // Redirigir de vuelta a la página de pago con el parámetro cancelled
      navigate(`/event/${eventId}/tickets/${ticketTypeId}/${quantity}?order_id=${orderId}&cancelled=true`);
    } else {
      // Si no hay datos guardados, volver al inicio
      navigate('/');
    }
  };

  const handleGoHome = () => {
    // Limpiar localStorage
    localStorage.removeItem('pending_order_id');
    localStorage.removeItem('pending_event_id');
    localStorage.removeItem('pending_ticket_type_id');
    localStorage.removeItem('pending_quantity');
    
    navigate('/');
  };

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
            <div className="payment-success-card payment-success-error">
              <div className="payment-success-icon-error">
                <XCircle />
              </div>
              <h1 className="payment-success-title">Payment cancelled</h1>
              <p className="payment-success-message">
                The payment process has been cancelled. Your data has been saved and you can try again.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%' }}>
                <button 
                  onClick={handleRetry}
                  className="payment-success-button"
                >
                  Try again
                </button>
                <button 
                  onClick={handleGoHome}
                  className="payment-success-button"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Back to home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};