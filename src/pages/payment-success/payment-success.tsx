// pages/payment-success-page.tsx
// SECURITY: Strict UUID validation and sanitization to prevent XSS/IDOR attacks
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/layout/layout';
import { CheckCircle, Clock, ArrowRight, Copy, Check, AlertCircle, Home } from 'lucide-react';
import { apiClient } from '../../utils/axios';
import './payment-success.css';

// SECURITY: Strict UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * SECURITY: Validates and sanitizes an order ID parameter
 * - Only accepts valid UUID v4 format
 * - Returns null for any invalid input (prevents XSS/injection)
 * - UUIDs have 122 bits of entropy (prevents IDOR enumeration)
 */
const validateOrderId = (rawInput: string | null): string | null => {
  if (!rawInput) return null;

  // Trim and lowercase for consistent validation
  const sanitized = rawInput.trim().toLowerCase();

  // Strict UUID v4 format check
  if (!UUID_REGEX.test(sanitized)) {
    console.warn('SECURITY: Invalid order_id format rejected');
    return null;
  }

  return sanitized;
};

export const PaymentSuccessPage = () => {
  const { t, i18n } = useTranslation('payment');
  const { lang } = useParams<{ lang: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  // SECURITY: Validate and sanitize order_id immediately
  const orderId = useMemo(() => {
    return validateOrderId(searchParams.get('order_id'));
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // SECURITY: Only make API call with validated UUID
    if (!orderId) {
      setLoading(false);
      return;
    }

    // SECURITY: orderId is already validated as UUID, safe to use in URL
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
    // SECURITY: Prefer server-provided order_number, fallback to validated UUID prefix
    const reference = orderData?.order?.order_number || (orderId ? orderId.slice(0, 8).toUpperCase() : '');
    if (reference) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="payment-success-wrapper">
          <div className="payment-success-loading">
            <div className="payment-success-spinner"></div>
            <p>{t('loading.order')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  // SECURITY: Show error for missing or invalid order_id
  if (!orderId) {
    return (
      <Layout>
        <div className="payment-success-wrapper">
          <div className="payment-error-bg-overlay" />
          <div className="payment-success-content">
            <div className="payment-success-container">
              <div className="payment-error-card">
                <div className="payment-error-icon-wrapper">
                  <AlertCircle className="payment-error-icon" />
                </div>
                <h1 className="payment-error-title">{t('error.orderNotFound')}</h1>
                <p className="payment-error-description">
                  {t('error.orderNotFoundDesc')}
                </p>
                <button onClick={() => navigate(buildUrl('/'))} className="payment-success-button payment-success-button-primary">
                  <Home />
                  {t('error.returnToHome')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // SECURITY: Use only server-provided data for display, with validated orderId as fallback
  const orderNumber = orderData?.order?.order_number;
  const eventImage = orderData?.event?.image;
  const venueSlug = orderData?.event?.venue_slug || orderData?.venue?.slug;

  // SECURITY: Display reference - prefer server data, fallback to validated UUID prefix
  const displayReference = orderNumber || orderId.slice(0, 8).toUpperCase();

  // PUBLIC vs PRIVATE: a private-event order is held awaiting staff approval
  // (payment_authorized); a public order is already confirmed with tickets on
  // the way. Show the right messaging for each.
  const orderStatus = orderData?.order?.status;
  const isPendingApproval = orderStatus === 'payment_authorized';

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
              <h1 className="payment-success-title">{isPendingApproval ? t('success.title') : t('success.confirmedTitle')}</h1>
              <div className="payment-success-description">
                <p>{isPendingApproval ? t('success.description') : t('success.confirmedDescription')}</p>
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="payment-success-grid">
              {/* Left Column - status card (private=pending approval, public=tickets sent) */}
              <div className="payment-success-grid-left">
                <div className="payment-status-card">
                  {isPendingApproval ? (
                    <>
                      <div className="payment-status-header">
                        <Clock />
                        <span>{t('success.pendingApproval')}</span>
                      </div>
                      <div className="payment-status-body">
                        <p>{t('success.pendingDescription')}</p>
                        <div className="payment-status-timeline">
                          <div className="timeline-step timeline-step-completed">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <h4>{t('success.timeline.paymentAuthorized')}</h4>
                              <p>{t('success.timeline.paymentAuthorizedDesc')}</p>
                            </div>
                          </div>
                          <div className="timeline-step timeline-step-current">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <h4>{t('success.timeline.staffReview')}</h4>
                              <p>{t('success.timeline.staffReviewDesc')}</p>
                            </div>
                          </div>
                          <div className="timeline-step timeline-step-pending">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <h4>{t('success.timeline.ticketsSent')}</h4>
                              <p>{t('success.timeline.ticketsSentDesc')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="payment-status-header">
                        <CheckCircle />
                        <span>{t('success.ticketsSentTitle')}</span>
                      </div>
                      <div className="payment-status-body">
                        <p>{t('success.ticketsSentBody')}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column - Order Reference & Important Info */}
              <div className="payment-success-grid-right">
                {/* Order Reference Card */}
                <div className="payment-order-reference">
                  <p className="payment-order-reference-label">{t('success.orderReference')}</p>
                  <div className="payment-order-reference-content">
                    <p className="payment-order-reference-number">
                      {displayReference}
                    </p>
                    <button
                      onClick={handleCopyReference}
                      className={`payment-order-reference-copy ${copied ? 'copied' : ''}`}
                    >
                      {copied ? (
                        <>
                          <Check />
                          {t('success.copied')}
                        </>
                      ) : (
                        <>
                          <Copy />
                          {t('success.copyReference')}
                        </>
                      )}
                    </button>
                  </div>
                  <p className="payment-order-reference-hint">
                    {t('success.referenceHint')}
                  </p>
                </div>

                {/* Important Information */}
                <div className="payment-info-box payment-info-box-blue">
                  <h3>{t('success.importantInfo')}</h3>
                  {isPendingApproval ? (
                    <ul>
                      <li dangerouslySetInnerHTML={{ __html: t('success.infoList.authorized') }} />
                      <li>{t('success.infoList.staffReview')}</li>
                      <li>{t('success.infoList.approved')}</li>
                      <li>{t('success.infoList.rejected')}</li>
                      <li>{t('success.infoList.emailUpdates')}</li>
                    </ul>
                  ) : (
                    <ul>
                      <li>{t('success.ticketsSentBody')}</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="payment-success-actions">
              <button
                onClick={() => navigate(buildUrl(venueSlug ? `/venues/${venueSlug}/events` : '/'))}
                className="payment-success-button payment-success-button-primary"
              >
                {t('success.returnToVenue')}
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
