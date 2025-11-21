// pages/payment-success-page.tsx
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { CheckCircle, Clock, ArrowRight, Copy, Check } from 'lucide-react';
import './payment-success.css';

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // ✅ Obtener detalles completos de la orden
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'}/orders/details/${orderId}`)
      .then(res => res.json())
      .then(data => {
        console.log('📦 Order data:', data);
        setOrderData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Error fetching order:', err);
        setLoading(false);
      });
  }, [orderId]);

  const handleCopyReference = () => {
    const reference = orderData?.order?.order_number || orderId;
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  // ✅ Obtener order_number del response
  const orderNumber = orderData?.order?.order_number;
  const eventImage = orderData?.event?.image;

  return (
    <Layout>
      <div className="payment-success-wrapper">
        {eventImage && (
          <>
            <div
              className="payment-success-bg-blur"
              style={{ backgroundImage: `url(${eventImage})` }}
            />
            <div className="payment-success-bg-overlay-dark" />
          </>
        )}
        {!eventImage && <div className="payment-success-bg-overlay" />}

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

              {/* ✅ Order Reference Card Centrada */}
              <div style={{
                padding: "1.5rem",
                borderRadius: "0.75rem",
                background: "rgba(139, 92, 246, 0.05)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                marginBottom: "2rem",
                textAlign: "center", // ← CENTRADO
              }}>
                <p style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255, 255, 255, 0.6)",
                  margin: "0 0 0.75rem 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: "500"
                }}>
                  Order Reference
                </p>
                <div style={{
                  display: "flex",
                  flexDirection: "column", // ← Stack vertical
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <p style={{
                    fontSize: "1.5rem", // ← Más grande
                    color: "white",
                    fontWeight: "600",
                    fontFamily: "monospace",
                    margin: 0,
                    letterSpacing: "0.15em",
                    background: "linear-gradient(135deg, rgb(167, 139, 250), rgb(217, 70, 239))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}>
                    {orderNumber || orderId.slice(0, 8).toUpperCase()}
                  </p>
                  <button
                    onClick={handleCopyReference}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.625rem 1.25rem",
                      background: copied ? "rgba(52, 211, 153, 0.1)" : "rgba(139, 92, 246, 0.1)",
                      border: copied ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "0.5rem",
                      color: copied ? "rgb(52, 211, 153)" : "rgb(167, 139, 250)",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!copied) {
                        e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!copied) {
                        e.currentTarget.style.background = "rgba(139, 92, 246, 0.1)";
                      }
                    }}
                  >
                    {copied ? (
                      <>
                        <Check style={{ width: "1rem", height: "1rem" }} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy style={{ width: "1rem", height: "1rem" }} />
                        Copy Reference
                      </>
                    )}
                  </button>
                </div>
                <p style={{
                  fontSize: "0.75rem",
                  color: "rgba(255, 255, 255, 0.5)",
                  margin: "1rem 0 0 0",
                  lineHeight: "1.5"
                }}>
                  Save this reference number. You can use it to track your order status or contact support.
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