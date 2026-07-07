import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, Copy, ArrowRight, Check } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import './group-reservation-confirmation-page.css';

interface ConfirmationData {
  success: boolean;
  reservation_id: string;
  management_code: string;
  payment_link_code: string;
  total_amount?: number;
  message?: string;
  eventInfo?: {
    event_name: string;
    event_img: string;
    date: string;
    venue_slug?: string;
    custom_location?: {
      id: string;
      slug: string;
      name: string;
    };
  };
  guestCount?: number;
  hostPaysCount?: number;
}

export const GroupReservationConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { t, i18n } = useTranslation('group');
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!location.state) {
      navigate(buildUrl('/'));
      return;
    }
    setData(location.state as ConfirmationData);
  }, [location.state, navigate, buildUrl]);

  if (!data) return null;

  const handleCopyReference = () => {
    navigator.clipboard.writeText(data.management_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eventImage = data.eventInfo?.event_img;
  // Try multiple possible paths for venue slug
  const eventInfo = data.eventInfo as any;
  const venueSlug = eventInfo?.venue_slug
    || eventInfo?.slug_venue
    || eventInfo?.custom_location?.slug
    || eventInfo?.venue?.slug;

  return (
    <Layout>
      <div className="group-confirmation-wrapper">
        {eventImage && (
          <>
            <div
              className="group-confirmation-bg-blur"
              style={{ backgroundImage: `url(${eventImage})` }}
            />
            <div className="group-confirmation-bg-overlay-dark" />
          </>
        )}
        {!eventImage && <div className="group-confirmation-bg-overlay" />}

        <div className="group-confirmation-content">
          <div className="group-confirmation-container">
            {/* Header Section */}
            <div className="group-confirmation-header">
              <div className="group-confirmation-icon-wrapper">
                <CheckCircle className="group-confirmation-icon" />
              </div>
              <h1 className="group-confirmation-title">{t('confirmation.title')}</h1>
              <div className="group-confirmation-description">
                <p>{t('confirmation.description')}</p>
              </div>
            </div>

            {/* Two Column Grid - Directly on background */}
            <div className="group-confirmation-grid">
              {/* Left Column - Pending Staff Approval */}
              <div className="group-confirmation-grid-left">
                <div className="group-confirmation-status-card">
                  <div className="group-confirmation-status-header">
                    <Clock />
                    <span>{t('confirmation.pendingApproval')}</span>
                  </div>
                  <div className="group-confirmation-status-body">
                    <p>
                      {t('confirmation.reviewMessage')}
                    </p>
                    <div className="group-confirmation-timeline">
                      <div className="timeline-step timeline-step-completed">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h4>{t('confirmation.timeline.created')}</h4>
                          <p>{t('confirmation.timeline.createdDesc')}</p>
                        </div>
                      </div>
                      <div className="timeline-step timeline-step-current">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h4>{t('confirmation.timeline.review')}</h4>
                          <p>{t('confirmation.timeline.reviewDesc')}</p>
                        </div>
                      </div>
                      <div className="timeline-step timeline-step-pending">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h4>{t('confirmation.timeline.sent')}</h4>
                          <p>{t('confirmation.timeline.sentDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Management Code & Important Info */}
              <div className="group-confirmation-grid-right">
                {/* Management Code Card */}
                <div className="group-confirmation-reference">
                  <p className="group-confirmation-reference-label">{t('confirmation.managementCode')}</p>
                  <div className="group-confirmation-reference-content">
                    <p className="group-confirmation-reference-number">
                      {data.management_code}
                    </p>
                    <button
                      onClick={handleCopyReference}
                      className={`group-confirmation-reference-copy ${copied ? 'copied' : ''}`}
                    >
                      {copied ? (
                        <>
                          <Check />
                          {t('confirmation.copied')}
                        </>
                      ) : (
                        <>
                          <Copy />
                          {t('confirmation.copyCode')}
                        </>
                      )}
                    </button>
                  </div>
                  <p className="group-confirmation-reference-hint">
                    {t('confirmation.saveCode')}
                  </p>
                </div>

                {/* Important Information */}
                <div className="group-confirmation-info-box group-confirmation-info-box-blue">
                  <h3>{t('confirmation.importantInfo')}</h3>
                  <ul>
                    <li>{t('confirmation.infoList.reviewTime')}</li>
                    <li dangerouslySetInnerHTML={{ __html: t('confirmation.infoList.emailNotice') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('confirmation.infoList.paidGuests') }} />
                    <li dangerouslySetInnerHTML={{ __html: t('confirmation.infoList.unpaidGuests') }} />
                    <li>{t('confirmation.infoList.updates')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="group-confirmation-actions">
              <button
                onClick={() => navigate(buildUrl(venueSlug ? `/venues/${venueSlug}/events/` : '/'))}
                className="group-confirmation-button group-confirmation-button-primary"
              >
                {venueSlug ? t('confirmation.returnToVenue') : t('confirmation.goToHome')}
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
