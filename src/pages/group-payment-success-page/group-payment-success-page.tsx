import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { CheckCircle, Mail, ArrowRight, Ticket } from 'lucide-react';
import './group-payment-success-page.css';

export const GroupPaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('group');
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const [loading, setLoading] = useState(true);
  const [_paymentData, _setPaymentData] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // TODO: Fetch payment details from backend
    // For now, just show success
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <Layout>
        <div className="group-payment-success-page">
          <div className="group-payment-success-loading">
            <div className="group-payment-success-spinner"></div>
            <p>{t('payment.success.verifying')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!sessionId) {
    return (
      <Layout>
        <div className="group-payment-success-page">
          <div className="group-payment-success-container">
            <div className="group-payment-success-error">
              <div className="group-payment-error-icon">âš ï¸</div>
              <h1>{t('payment.success.notFound')}</h1>
              <p>{t('payment.success.notFoundDesc')}</p>
              <button onClick={() => navigate(buildUrl('/'))} className="group-payment-success-btn group-payment-success-btn-primary">
                {t('payment.success.backToHome')}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="group-payment-success-page">
        <div className="group-payment-success-bg-overlay" />
        <div className="group-payment-success-bg-overlay-dark" />

        <div className="group-payment-success-content">
          <div className="group-payment-success-container">
            <div className="group-payment-success-header">
              <div className="group-payment-success-icon-wrapper">
                <CheckCircle className="group-payment-success-icon" />
              </div>

              <h1 className="group-payment-success-title">{t('payment.success.title')}</h1>

              <div className="group-payment-success-description">
                <p>{t('payment.success.description')}</p>
              </div>
            </div>

            <div className="group-payment-status-card">
              <div className="group-payment-status-header">
                <Ticket />
                <span>{t('payment.success.waitingApproval')}</span>
              </div>
              <div className="group-payment-status-body">
                <p>
                  {t('payment.success.approvalDesc')}
                </p>
                <div className="group-payment-timeline">
                  <div className="timeline-step timeline-step-completed">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>{t('payment.success.timeline.completed')}</h4>
                      <p>{t('payment.success.timeline.completedDesc')}</p>
                    </div>
                  </div>
                  <div className="timeline-step timeline-step-current">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>{t('payment.success.timeline.review')}</h4>
                      <p>{t('payment.success.timeline.reviewDesc')}</p>
                    </div>
                  </div>
                  <div className="timeline-step timeline-step-pending">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>{t('payment.success.timeline.sent')}</h4>
                      <p>{t('payment.success.timeline.sentDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group-payment-info-box">
              <div className="group-payment-info-icon">
                <Mail size={24} />
              </div>
              <div className="group-payment-info-content">
                <h3>{t('payment.success.whatNext')}</h3>
                <ul>
                  <li>{t('payment.success.nextSteps.review')}</li>
                  <li>{t('payment.success.nextSteps.email')}</li>
                  <li>{t('payment.success.nextSteps.hostTickets')}</li>
                  <li>{t('payment.success.nextSteps.saveTicket')}</li>
                </ul>
              </div>
            </div>

            <div className="group-payment-success-actions">
              <button
                onClick={() => navigate(buildUrl('/'))}
                className="group-payment-success-btn group-payment-success-btn-primary"
              >
                {t('payment.success.backToHome')}
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
