import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import './group-payment-cancel-page.css';

export const GroupPaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const paymentLinkCode = searchParams.get('payment_link_code');
  const guestEmail = searchParams.get('guest_email');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('group');
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Could fetch reservation details if needed
    setLoading(false);
  }, []);

  const handleRetry = () => {
    if (paymentLinkCode) {
      navigate(buildUrl(`/group/payment/${paymentLinkCode}`), {
        state: { guestEmail }
      });
    }
  };

  const handleGoHome = () => {
    navigate(buildUrl('/'));
  };

  if (loading) {
    return (
      <Layout>
        <div className="group-payment-cancel-page">
          <div className="group-payment-cancel-loading">
            <div className="group-payment-cancel-spinner"></div>
            <p>{t('payment.cancel.loading')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="group-payment-cancel-page">
        <div className="group-payment-cancel-overlay" />

        <div className="group-payment-cancel-content">
          <div className="group-payment-cancel-container">
            <div className="group-payment-cancel-card">
              <div className="group-payment-cancel-icon-wrapper">
                <AlertTriangle className="group-payment-cancel-icon" />
              </div>

              <h1 className="group-payment-cancel-title">{t('payment.cancel.title')}</h1>

              <div className="group-payment-cancel-description">
                <p>{t('payment.cancel.description')}</p>
              </div>

              <div className="group-payment-cancel-info-box">
                <h3>{t('payment.cancel.whatHappened')}</h3>
                <ul>
                  <li>{t('payment.cancel.reasons.canceled')}</li>
                  <li>{t('payment.cancel.reasons.noCharge')}</li>
                  <li>{t('payment.cancel.reasons.secure')}</li>
                  <li>{t('payment.cancel.reasons.retry')}</li>
                </ul>
              </div>

              <div className="group-payment-cancel-actions">
                {paymentLinkCode && (
                  <button
                    onClick={handleRetry}
                    className="group-payment-cancel-btn group-payment-cancel-btn-primary"
                  >
                    <RefreshCw />
                    {t('payment.cancel.tryAgain')}
                  </button>
                )}
                <button
                  onClick={handleGoHome}
                  className="group-payment-cancel-btn group-payment-cancel-btn-secondary"
                >
                  {t('payment.cancel.backToHome')}
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
