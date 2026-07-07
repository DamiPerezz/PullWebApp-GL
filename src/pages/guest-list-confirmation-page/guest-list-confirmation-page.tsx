// pages/guest-list-confirmation-page/guest-list-confirmation-page.tsx
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, ArrowRight, Copy, Check, AlertCircle, Home, Users, ClipboardList } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import { useState } from 'react';
import './guest-list-confirmation-page.css';

interface LocationState {
  signupId: string;
  verificationCode: string;
  eventInfo: {
    event_name: string;
    event_img: string;
    date: string;
    open_time: string;
    close_time: string;
    location: string;
    venue_slug?: string;
  };
  guestListName: string;
  responsibleName: string;
  guestCount: number;
}

export const GuestListConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { t, i18n } = useTranslation('guestList');
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const state = location.state as LocationState | null;
  const [copied, setCopied] = useState(false);

  if (!state) {
    return (
      <Layout>
        <div className="gl-confirm-wrapper">
          <div className="gl-confirm-bg-overlay-error" />
          <div className="gl-confirm-content">
            <div className="gl-confirm-container">
              <div className="gl-confirm-error-card">
                <div className="gl-confirm-error-icon-wrapper">
                  <AlertCircle className="gl-confirm-error-icon" />
                </div>
                <h1 className="gl-confirm-error-title">{t('confirmation.notFound')}</h1>
                <p className="gl-confirm-error-description">
                  {t('confirmation.notFoundDescription')}
                </p>
                <button onClick={() => navigate(buildUrl('/'))} className="gl-confirm-button gl-confirm-button-primary">
                  <Home />
                  {t('confirmation.goHome')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { verificationCode, eventInfo, guestListName, responsibleName, guestCount } = state;
  const venueSlug = eventInfo?.venue_slug;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Layout>
      <div className="gl-confirm-wrapper">
        {eventInfo?.event_img && (
          <>
            <div
              className="gl-confirm-bg-blur"
              style={{ backgroundImage: `url(${eventInfo.event_img})` }}
            />
            <div className="gl-confirm-bg-overlay-dark" />
          </>
        )}
        {!eventInfo?.event_img && <div className="gl-confirm-bg-overlay" />}

        <div className="gl-confirm-content">
          <div className="gl-confirm-container">
            {/* Header Section */}
            <div className="gl-confirm-header">
              <div className="gl-confirm-icon-wrapper">
                <CheckCircle className="gl-confirm-icon" />
              </div>
              <h1 className="gl-confirm-title">{t('confirmation.title')}</h1>
              <div className="gl-confirm-description">
                <p>{t('confirmation.description')}</p>
              </div>
            </div>

            {/* Two Column Grid */}
            <div className="gl-confirm-grid">
              {/* Left Column - Pending Staff Approval */}
              <div className="gl-confirm-grid-left">
                <div className="gl-confirm-status-card">
                  <div className="gl-confirm-status-header">
                    <Clock />
                    <span>{t('confirmation.pendingApproval')}</span>
                  </div>
                  <div className="gl-confirm-status-body">
                    <p>{t('confirmation.pendingDescription')}</p>
                    <div className="gl-confirm-timeline">
                      <div className="gl-timeline-step gl-timeline-step-completed">
                        <div className="gl-timeline-dot"></div>
                        <div className="gl-timeline-content">
                          <h4>{t('confirmation.timeline.registered')}</h4>
                          <p>{t('confirmation.timeline.registeredDesc')}</p>
                        </div>
                      </div>
                      <div className="gl-timeline-step gl-timeline-step-current">
                        <div className="gl-timeline-dot"></div>
                        <div className="gl-timeline-content">
                          <h4>{t('confirmation.timeline.staffReview')}</h4>
                          <p>{t('confirmation.timeline.staffReviewDesc')}</p>
                        </div>
                      </div>
                      <div className="gl-timeline-step gl-timeline-step-pending">
                        <div className="gl-timeline-dot"></div>
                        <div className="gl-timeline-content">
                          <h4>{t('confirmation.timeline.approved')}</h4>
                          <p>{t('confirmation.timeline.approvedDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Code & Details */}
              <div className="gl-confirm-grid-right">
                {/* Verification Code Card */}
                <div className="gl-confirm-code-card">
                  <p className="gl-confirm-code-label">{t('confirmation.code')}</p>
                  <div className="gl-confirm-code-content">
                    <p className="gl-confirm-code-number">{verificationCode}</p>
                    <button
                      onClick={handleCopyCode}
                      className={`gl-confirm-code-copy ${copied ? 'copied' : ''}`}
                    >
                      {copied ? (
                        <>
                          <Check />
                          {t('confirmation.copied')}
                        </>
                      ) : (
                        <>
                          <Copy />
                          {t('confirmation.copy')}
                        </>
                      )}
                    </button>
                  </div>
                  <p className="gl-confirm-code-hint">{t('confirmation.codeHint')}</p>
                </div>

                {/* Registration Details */}
                <div className="gl-confirm-details-card">
                  <h3>{t('confirmation.details')}</h3>
                  <div className="gl-confirm-details-list">
                    <div className="gl-confirm-detail-row">
                      <span className="gl-confirm-detail-label">
                        <ClipboardList size={14} />
                        {t('confirmation.list')}
                      </span>
                      <span className="gl-confirm-detail-value">{guestListName}</span>
                    </div>
                    <div className="gl-confirm-detail-row">
                      <span className="gl-confirm-detail-label">
                        {t('confirmation.responsible')}
                      </span>
                      <span className="gl-confirm-detail-value">{responsibleName}</span>
                    </div>
                    <div className="gl-confirm-detail-row">
                      <span className="gl-confirm-detail-label">
                        <Users size={14} />
                        {t('confirmation.totalPeople')}
                      </span>
                      <span className="gl-confirm-detail-value gl-confirm-detail-highlight">
                        {1 + guestCount} {t('confirmation.people')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Important Information */}
                <div className="gl-confirm-info-box">
                  <h3>{t('confirmation.importantInfo')}</h3>
                  <ul>
                    <li>{t('confirmation.infoList.registered')}</li>
                    <li>{t('confirmation.infoList.staffReview')}</li>
                    <li>{t('confirmation.infoList.approved')}</li>
                    <li>{t('confirmation.infoList.emailUpdates')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="gl-confirm-actions">
              <button
                onClick={() => navigate(buildUrl(venueSlug ? `/venues/${venueSlug}/events` : '/'))}
                className="gl-confirm-button gl-confirm-button-primary"
              >
                {t('confirmation.returnToVenue')}
                <ArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
