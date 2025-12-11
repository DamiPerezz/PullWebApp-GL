// pages/payment-cancel-page/payment-cancel-page.tsx - CORREGIDO
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { getOrderDataAfterCancel } from '../../controller/purchase-pages-controller';
import './payment-cancel.css';

export const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const eventId = searchParams.get('event_id');
  const ticketTypeId = searchParams.get('ticket_type_id');
  const quantity = searchParams.get('quantity');
  
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [_orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      getOrderDataAfterCancel(orderId)
        .then((data) => {
          setOrderData(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const handleRetry = () => {
    // Navegar de vuelta a la página de pago con los datos preservados
    if (eventId && ticketTypeId && quantity && orderId) {
      navigate(`/event/${eventId}/tickets/${ticketTypeId}/${quantity}?order_id=${orderId}&cancelled=true`);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="payment-cancel-wrapper">
          <div className="payment-cancel-loading">
            <div className="payment-cancel-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="payment-cancel-wrapper">
        <div className="payment-cancel-bg-overlay" />
        
        <div className="payment-cancel-content">
          <div className="payment-cancel-container">
            <div className="payment-cancel-card">
              {/* Warning Icon */}
              <div className="payment-cancel-icon-wrapper">
                <AlertTriangle className="payment-cancel-icon" />
              </div>

              {/* Title */}
              <h1 className="payment-cancel-title">Payment Cancelled</h1>
              
              {/* Description */}
              <div className="payment-cancel-description">
                <p>Your payment was cancelled. No charges were made to your account.</p>
              </div>

              {/* Info Box */}
              <div className="payment-cancel-info-box">
                <h3>What happens now?</h3>
                <ul>
                  <li>Your order has been cancelled</li>
                  <li>No payment was processed</li>
                  <li>Your form data has been saved</li>
                  <li>You can try again when you&apos;re ready</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="payment-cancel-actions">
                {orderId && eventId && ticketTypeId && quantity && (
                  <button 
                    onClick={handleRetry} 
                    className="payment-cancel-button payment-cancel-button-primary"
                  >
                    <RefreshCw />
                    Try Again
                  </button>
                )}
                <button 
                  onClick={handleGoHome} 
                  className="payment-cancel-button payment-cancel-button-secondary"
                >
                  Return to Home
                  <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};