// pages/guest-list-signup-page/guest-list-signup-page.tsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Plus, Minus, AlertCircle, ArrowRight, Info, Users, ShoppingCart } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import { EventInfoCard } from '../../components/event-info-card/event-info-card';
import { UserDetailsForm } from '../../components/user-details-form/user-details-form';
import type { EventDetailedInfo, GuestListType } from '../../types/types';
import { getEventDetailedInfo } from '../../controller/event-controller';
import { getGuestListsForEvent, signupForGuestList } from '../../controller/guest-list-controller';
import './guest-list-signup-page.css';

export const GuestListSignupPage = () => {
  const { eventId, guestListTypeId, lang } = useParams<{ eventId: string; guestListTypeId: string; lang: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('guestList');
  const { t: tCommon } = useTranslation('common');
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const formRef = useRef<{ submit: (onSubmit: any) => void }>(null);

  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);
  const [guestListType, setGuestListType] = useState<GuestListType | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(0);

  useEffect(() => {
    if (!eventId || !guestListTypeId) return;

    const loadData = async () => {
      try {
        const [event, guestLists] = await Promise.all([
          getEventDetailedInfo(eventId),
          getGuestListsForEvent(eventId)
        ]);

        setEventInfo(event);

        const targetList = guestLists.find(gl => gl.id === guestListTypeId);
        if (targetList) {
          setGuestListType(targetList);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading guest list data:', err);
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, guestListTypeId]);

  const handleSubmit = async (formData: any) => {
    if (submitting || !eventId || !guestListTypeId) return;

    setSubmitting(true);
    setError(null);

    try {
      const userData = formData.usuarios[0];

      const response = await signupForGuestList({
        event_slug: eventId,
        guest_list_type_id: guestListTypeId,
        name: userData.owner_name.trim(),
        last_name: userData.owner_last_name.trim(),
        email: userData.owner_email.trim(),
        phone: userData.owner_phone || undefined,
        phone_prefix: userData.owner_phone_prefix,
        gender: userData.owner_gender as 'male' | 'female',
        guest_count: guestCount,
        instagram: (userData.owner_instagram || '').trim() || undefined,
      } as any);

      if (response.success) {
        navigate(buildUrl('/list/confirmation'), {
          state: {
            signupId: response.signup_id,
            verificationCode: response.verification_code,
            eventInfo: {
              ...eventInfo,
              event_slug: eventInfo?.event_slug
            },
            guestListName: guestListType?.name,
            responsibleName: `${userData.owner_name} ${userData.owner_last_name}`,
            guestCount
          }
        });
      }
    } catch (err: any) {
      console.error('Error signing up for guest list:', err);

      // Check for specific error codes
      if (err?.response?.status === 409) {
        setError(t('signup.errorEmailExists'));
      } else if (err?.response?.status === 400) {
        setError(t('signup.errorInvalidData'));
      } else if (err?.response?.status === 404) {
        setError(t('signup.errorListNotFound'));
      } else {
        setError(t('signup.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismissError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="guest-list-signup-wrapper">
          <div className="guest-list-signup-bg-blur" />
          <div className="guest-list-signup-bg-overlay" />
          <div className="guest-list-signup-content">
            <div className="guest-list-signup-loading">
              <div className="guest-list-signup-loading-spinner"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const availableSpots = guestListType?.max_capacity
    ? guestListType.max_capacity - guestListType.current_count
    : null;

  const maxGuests = availableSpots !== null ? Math.max(0, availableSpots - 1) : 50;

  const getGenderRestriction = (): 'male' | 'female' | null => {
    if (guestListType?.allowed_gender === 'male') return 'male';
    if (guestListType?.allowed_gender === 'female') return 'female';
    return null;
  };

  return (
    <Layout>
      <div className="guest-list-signup-wrapper">
        <div
          className="guest-list-signup-bg-blur"
          style={{ backgroundImage: `url(${eventInfo?.event_img})` }}
        />
        <div className="guest-list-signup-bg-overlay" />

        <div className="guest-list-signup-content">
          <div className="guest-list-signup-container">
            {error && (
              <div className="guest-list-signup-error-banner">
                <div className="guest-list-signup-error-content">
                  <AlertCircle className="guest-list-signup-error-icon" />
                  <div className="guest-list-signup-error-text">
                    <h4 className="guest-list-signup-error-title">{tCommon('error')}</h4>
                    <p className="guest-list-signup-error-message">{error}</p>
                  </div>
                  <button
                    onClick={handleDismissError}
                    className="guest-list-signup-error-close"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <EventInfoCard eventInfo={eventInfo} />

            <div className="guest-list-signup-grid">
              <div className="guest-list-signup-left">
                {/* Guest List Info Card */}
                <div className="guest-list-signup-ticket-card">
                  <div className="guest-list-signup-ticket-content">
                    <div className="guest-list-signup-ticket-header">
                      <ClipboardList size={24} className="guest-list-signup-ticket-icon" />
                      <h3 className="guest-list-signup-ticket-title">
                        {guestListType?.name}
                      </h3>
                    </div>
                    {guestListType?.description && (
                      <p className="guest-list-signup-ticket-description">
                        {guestListType.description}
                      </p>
                    )}
                  </div>

                  <div className="guest-list-signup-ticket-price">
                    <span className="guest-list-signup-price-amount">{t('card.free')}</span>
                  </div>
                </div>

                {/* Info Widget */}
                <div className="guest-list-signup-info-widget">
                  <Info size={16} />
                  <p>{t('signup.pendingNote')}</p>
                </div>

                {/* User Details Form */}
                <UserDetailsForm
                  quantity={1}
                  ref={formRef}
                  ticketGender={getGenderRestriction()}
                  customTitle={t('signup.title')}
                  sectionNumber={1}
                />

                {/* Companions Selector */}
                <div className="guest-list-signup-quantity-card">
                  <h3 className="guest-list-signup-quantity-title">{t('signup.guestCount')}</h3>
                  <p className="guest-list-signup-quantity-help">{t('signup.guestCountHelp')}</p>

                  <div className="guest-list-signup-quantity-controls">
                    <button
                      onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
                      className="guest-list-signup-quantity-button"
                      disabled={guestCount === 0}
                    >
                      <Minus />
                    </button>

                    <div className="guest-list-signup-quantity-display">
                      <div className="guest-list-signup-quantity-number">{1 + guestCount}</div>
                    </div>

                    <button
                      onClick={() => setGuestCount(Math.min(maxGuests, guestCount + 1))}
                      className="guest-list-signup-quantity-button guest-list-signup-quantity-button-plus"
                      disabled={guestCount >= maxGuests}
                    >
                      <Plus />
                    </button>
                  </div>

                  {availableSpots !== null && availableSpots < 10 && (
                    <div className="guest-list-signup-spots-warning">
                      <AlertCircle size={14} />
                      <span>{t('card.spots', { available: availableSpots })}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="guest-list-signup-right">
                {/* Order Summary */}
                <div className="guest-list-signup-receipt">
                  <div className="guest-list-signup-receipt-card">
                    <div className="guest-list-signup-receipt-header">
                      <h3 className="guest-list-signup-receipt-title">{t('signup.summary')}</h3>
                      <ShoppingCart className="guest-list-signup-receipt-icon" />
                    </div>

                    <div className="guest-list-signup-receipt-items">
                      <div className="guest-list-signup-receipt-item">
                        <div className="guest-list-signup-receipt-item-info">
                          <div className="guest-list-signup-receipt-item-name">
                            {guestListType?.name}
                          </div>
                          <div className="guest-list-signup-receipt-item-quantity">
                            <Users size={14} />
                            {t('signup.responsible')} + {guestCount} {t('signup.companions').toLowerCase()}
                          </div>
                        </div>
                        <div className="guest-list-signup-receipt-item-price">
                          <span className="guest-list-signup-receipt-free">{t('card.free')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="guest-list-signup-receipt-divider" />

                    <div className="guest-list-signup-receipt-totals">
                      <div className="guest-list-signup-receipt-total-row">
                        <span>{t('signup.totalPeople')}</span>
                        <span>{1 + guestCount}</span>
                      </div>
                    </div>

                    <div className="guest-list-signup-receipt-total">
                      <span>{t('signup.price')}</span>
                      <span className="guest-list-signup-receipt-total-amount">{t('card.free')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => !submitting && formRef.current?.submit(handleSubmit)}
                    className="guest-list-signup-receipt-button"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="guest-list-signup-button-loading"></span>
                    ) : (
                      <>
                        {t('signup.submit')}
                        <ArrowRight className="guest-list-signup-button-icon" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
