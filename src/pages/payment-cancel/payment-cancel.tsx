// pages/payment-cancel-page/payment-cancel-page.tsx
// SECURITY: Validate URL parameters to prevent injection
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/layout/layout';
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import { getOrderDataAfterCancel } from '../../controller/purchase-pages-controller';
import { validateUUID, validateSlug, validateNumeric } from '../../utils/security';
import './payment-cancel.css';

export const PaymentCancelPage = () => {
  const { t, i18n } = useTranslation('payment');
  const { lang } = useParams<{ lang: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  // SECURITY: Validate and sanitize all URL parameters
  const orderId = useMemo(() => validateUUID(searchParams.get('order_id')), [searchParams]);
  const eventId = useMemo(() => validateSlug(searchParams.get('event_id')), [searchParams]);
  const ticketTypeId = useMemo(() => validateUUID(searchParams.get('ticket_type_id')), [searchParams]);
  const quantity = useMemo(() => validateNumeric(searchParams.get('quantity'), 1, 10), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [_orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    // SECURITY: Only proceed with validated orderId
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
      navigate(buildUrl(`/event/${eventId}/tickets/${ticketTypeId}/${quantity}?order_id=${orderId}&cancelled=true`));
    }
  };

  const handleGoHome = () => {
    navigate(buildUrl('/'));
  };

  if (loading) {
    return (
      <Layout>
        <div className="payment-cancel-wrapper">
          <div className="payment-cancel-loading">
            <div className="payment-cancel-spinner"></div>
            <p>{t('cancel.loading')}</p>
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
              <h1 className="payment-cancel-title">{t('cancel.title')}</h1>

              {/* Description */}
              <div className="payment-cancel-description">
                <p>{t('cancel.description')}</p>
              </div>

              {/* Info Box */}
              <div className="payment-cancel-info-box">
                <h3>{t('cancel.whatHappensNow')}</h3>
                <ul>
                  <li>{t('cancel.orderCancelled')}</li>
                  <li>{t('cancel.noPaymentProcessed')}</li>
                  <li>{t('cancel.formDataSaved')}</li>
                  <li>{t('cancel.tryWhenReady')}</li>
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
                    {t('cancel.tryAgain')}
                  </button>
                )}
                <button
                  onClick={handleGoHome}
                  className="payment-cancel-button payment-cancel-button-secondary"
                >
                  {t('cancel.returnToHome')}
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