// pages/payment-success-page.tsx
// SECURITY: Using apiClient for consistent cookie-based authentication
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { CheckCircle, Clock, ArrowRight, Copy, Check } from 'lucide-react';
import { apiClient } from '../../utils/axios';
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

    apiClient.get(`/orders/details/${orderId}`)
      .then(response => {
        setOrderData(response.data);
        setLoading(false);
      })
      .catch(() => {
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

  const orderNumber = orderData?.order?.order_number;
  const eventImage = orderData?.event?.image;
  const venueSlug = orderData?.event?.venue_slug || orderData?.venue?.slug;

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
            {/* Header Section */}
            <div className="payment-success-header">
              <div className="payment-success-icon-wrapper">
                <CheckCircle className="payment-success-icon" />
              </div>
              <h1 className="payment-success-title">Payment Authorized!</h1>
              <div className="payment-success-description">
                <p>Your payment has been successfully authorized and is being held securely.</p>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="payment-success-main-card">
              <h2 className="payment-success-section-title">Order Information</h2>

              {/* Two Column Grid */}
              <div className="payment-success-grid">
                {/* Left Column - Pending Staff Approval */}
                <div className="payment-success-grid-left">
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
                        <div className="timeline-step timeline-step-pending">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h4>Tickets Sent</h4>
                            <p>You'll receive tickets via email</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Order Reference & Important Info */}
                <div className="payment-success-grid-right">
                  {/* Order Reference Card */}
                  <div className="payment-order-reference">
                    <p className="payment-order-reference-label">Order Reference</p>
                    <div className="payment-order-reference-content">
                      <p className="payment-order-reference-number">
                        {orderNumber || orderId.slice(0, 8).toUpperCase()}
                      </p>
                      <button
                        onClick={handleCopyReference}
                        className={`payment-order-reference-copy ${copied ? 'copied' : ''}`}
                      >
                        {copied ? (
                          <>
                            <Check />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy />
                            Copy Reference
                          </>
                        )}
                      </button>
                    </div>
                    <p className="payment-order-reference-hint">
                      Save this reference number. You can use it to track your order status or contact support.
                    </p>
                  </div>

                  {/* Important Information */}
                  <div className="payment-info-box payment-info-box-blue">
                    <h3>Important Information</h3>
                    <ul>
                      <li>Your payment is <strong>authorized but not yet charged</strong></li>
                      <li>Staff will review your order shortly (usually within 24 hours)</li>
                      <li>If approved, payment will be processed and tickets sent to your email</li>
                      <li>If rejected, the authorization will be cancelled and funds returned</li>
                      <li>You'll receive email updates about your order status</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="payment-success-actions">
                <button
                  onClick={() => navigate(venueSlug ? `/venues/${venueSlug}` : '/')}
                  className="payment-success-button payment-success-button-primary"
                >
                  Return to Venue
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
