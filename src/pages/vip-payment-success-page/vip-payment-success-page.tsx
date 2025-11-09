// vip-payment-success-page.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { CheckCircle, Loader } from 'lucide-react';
import { confirmVIPGuestPayment } from '../../controller/vip-controller';
import './vip-payment-success-page.css';

export const VIPPaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('Missing session information');
      setLoading(false);
      return;
    }

    confirmVIPGuestPayment(sessionId)
      .then(() => {
        setSuccess(true);
        setLoading(false);
        
        setTimeout(() => {
          navigate('/venues');
        }, 3000);
      })
      .catch((err) => {
        console.error('Error confirming payment:', err);
        setError(err.response?.data?.error || 'Error confirming payment');
        setLoading(false);
      });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <Layout>
        <div className="vip-payment-success-wrapper">
          <div className="vip-payment-success-bg-gradient" />
          
          <div className="vip-payment-success-content">
            <div className="vip-payment-success-container">
              <div className="vip-payment-success-card vip-payment-success-error">
                <div className="vip-payment-success-icon-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2"/>
                  </svg>
                </div>
                <h1 className="vip-payment-success-title">Error</h1>
                <p className="vip-payment-success-message">{error}</p>
                <button 
                  onClick={() => navigate('/venues')}
                  className="vip-payment-success-button"
                >
                  Back to Venues
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
      <div className="vip-payment-success-wrapper">
        <div className="vip-payment-success-bg-gradient" />

        <div className="vip-payment-success-content">
          <div className="vip-payment-success-container">
            <div className="vip-payment-success-card">
              {loading ? (
                <>
                  <div className="vip-payment-success-spinner">
                    <Loader className="spinner-icon" />
                  </div>
                  <h1 className="vip-payment-success-title">Processing Payment</h1>
                  <p className="vip-payment-success-message">
                    We're confirming your payment...
                  </p>
                  <div className="vip-payment-success-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </>
              ) : success ? (
                <>
                  <div className="vip-payment-success-icon">
                    <CheckCircle />
                  </div>
                  <h1 className="vip-payment-success-title">Payment Successful!</h1>
                  <p className="vip-payment-success-message">
                    Your payment has been confirmed. The organizer has been notified. See you at the event!
                  </p>
                  <div className="vip-payment-success-redirect">
                    Redirecting to venues...
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};