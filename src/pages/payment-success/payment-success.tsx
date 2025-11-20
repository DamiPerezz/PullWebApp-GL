// pages/payment-success-page.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import './payment-success.css';

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/orders/${orderId}/details`)
      .then(res => res.json())
      .then(data => {
        setOrderData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <Layout>
        <div className="payment-success-wrapper">
          <div className="payment-success-loading">
            <div className="payment-success-spinner"></div>
            <p>Loading your order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orderId) {
    return (
      <Layout>
        <div className="payment-success-wrapper">
          <div className="payment-success-container">
            <div className="payment-success-card payment-error-card">
              <div className="payment-error-icon">⚠️</div>
              <h1>Order Not Found</h1>
              <p>Unable to find your order information</p>
              <button onClick={() => navigate('/')} className="payment-success-button payment-success-button-primary">
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="payment-success-wrapper">
        {orderData?.event_img && (
          <>
            <div 
              className="payment-success-bg-blur"
              style={{ backgroundImage: `url(${orderData.event_img})` }}
            />
            <div className="payment-success-bg-overlay-dark" />
          </>
        )}
        {!orderData?.event_img && <div className="payment-success-bg-overlay" />}
        
        <div className="payment-success-content">
          <div className="payment-success-container">
            <div className="payment-success-card">
              <div className="payment-success-icon-wrapper">
                <CheckCircle className="payment-success-icon" />
              </div>

              <h1 className="payment-success-title">Payment Authorized!</h1>
              
              <div className="payment-success-description">
                <p>Your payment has been successfully authorized and is being held securely.</p>
              </div>

              <div className="payment-status-card">
                <div className="payment-status-header">
                  <Clock />
                  <span>Pending Staff Approval</span>
                </div>
                <div className="payment-status-body">
                  <p>
                    Your order is now waiting for staff confirmation. Once approved, your payment will be processed and you'll receive your tickets via email.
                  </p>
                  <div className="payment-status-timeline">
                    <div className="timeline-step timeline-step-completed">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>Payment Authorized</h4>
                        <p>Your payment is securely held</p>
                      </div>
                    </div>
                    <div className="timeline-step timeline-step-current">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>Staff Review</h4>
                        <p>Staff is reviewing your order</p>
                      </div>
                    </div>
                    <div className="timeline-step">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>Tickets Sent</h4>
                        <p>You'll receive tickets via email</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="payment-info-box">
                <h3>Important Information</h3>
                <ul>
                  <li>Your payment is <strong>authorized but not yet charged</strong></li>
                  <li>Staff will review your order shortly (usually within 24 hours)</li>
                  <li>If approved, payment will be processed and tickets sent to your email</li>
                  <li>If rejected, the authorization will be cancelled and funds returned</li>
                  <li>You'll receive email updates about your order status</li>
                </ul>
              </div>

              <div style={{
                padding: "1rem",
                borderRadius: "0.5rem",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                marginBottom: "2rem",
              }}>
                <p style={{ 
                  fontSize: "0.8125rem", 
                  color: "rgba(255, 255, 255, 0.6)", 
                  margin: "0 0 0.25rem 0" 
                }}>
                  Order Reference
                </p>
                <p style={{ 
                  fontSize: "0.9375rem", 
                  color: "white", 
                  fontWeight: "500",
                  fontFamily: "monospace",
                  margin: 0 
                }}>
                  {orderId.slice(0, 8).toUpperCase()}
                </p>
              </div>

              <div className="payment-success-actions">
                <button 
                  onClick={() => navigate('/')} 
                  className="payment-success-button payment-success-button-primary"
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