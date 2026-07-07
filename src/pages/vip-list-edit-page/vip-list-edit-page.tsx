// pages/vip-list-edit-page/vip-list-edit-page.tsx
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../components/layout/layout';
import {
  getVIPListByEditCode,
  updateVIPListReservation,
  updateExpectedCounts,
} from '../../controller/vip-list-controller';
import type {
  VIPListReservation,
  VIPListTrackingGuest,
} from '../../controller/vip-list-controller';
import { validateVIPEditCode } from '../../utils/security';
import './vip-list-edit-page.css';

interface EditPageData {
  reservation: VIPListReservation;
  guests: VIPListTrackingGuest[];
  tracking_url: string;
  can_edit: boolean;
}

export const VIPListEditPage = () => {
  const { editCode: rawEditCode } = useParams<{ editCode: string }>();
  const { t, i18n } = useTranslation('viplist');
  const lang = i18n.language || 'es';

  // SECURITY: Validate edit code format
  const editCode = useMemo(() => validateVIPEditCode(rawEditCode), [rawEditCode]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EditPageData | null>(null);

  // Edit form states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Expected counts states
  const [expectedMen, setExpectedMen] = useState(0);
  const [expectedWomen, setExpectedWomen] = useState(0);
  const [updatingCounts, setUpdatingCounts] = useState(false);

  useEffect(() => {
    if (editCode) {
      fetchData();
    }
  }, [editCode]);

  const fetchData = async () => {
    if (!editCode) return;

    try {
      setLoading(true);
      setError(null);
      const response = await getVIPListByEditCode(editCode);

      if (response.success) {
        setData(response as unknown as EditPageData);
        setEditedName(response.reservation?.reservation_name || '');
        setEditedDescription(response.reservation?.description || '');
        setExpectedMen(response.reservation?.expected_men || 0);
        setExpectedWomen(response.reservation?.expected_women || 0);
      } else {
        setError(t('edit.notFound'));
      }
    } catch (err) {
      console.error('Error fetching VIP list:', err);
      setError(t('edit.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!editCode || !data) return;

    try {
      setSavingInfo(true);
      const response = await updateVIPListReservation(editCode, {
        reservation_name: editedName,
        description: editedDescription,
      });

      if (response.success) {
        setData({
          ...data,
          reservation: {
            ...data.reservation,
            reservation_name: editedName,
            description: editedDescription,
          },
        });
        setIsEditingInfo(false);
      }
    } catch (err) {
      console.error('Error updating reservation:', err);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleUpdateExpectedCount = async (gender: 'male' | 'female', delta: number) => {
    if (!editCode || !data) return;

    // Get confirmed counts
    const allGuests = (data as EditPageData).guests || [];
    const confirmedGuests = allGuests.filter(g => g.rsvp_status === 'confirmed');
    const currentConfirmedMen = confirmedGuests.filter(g => g.gender === 'male').length;
    const currentConfirmedWomen = confirmedGuests.filter(g => g.gender === 'female').length;

    // Minimum is the confirmed count
    const newMen = gender === 'male' ? Math.max(currentConfirmedMen, expectedMen + delta) : expectedMen;
    const newWomen = gender === 'female' ? Math.max(currentConfirmedWomen, expectedWomen + delta) : expectedWomen;

    // Optimistic update
    if (gender === 'male') setExpectedMen(newMen);
    else setExpectedWomen(newWomen);

    try {
      setUpdatingCounts(true);
      const response = await updateExpectedCounts(editCode, {
        expected_men: newMen,
        expected_women: newWomen,
      });

      if (response.success) {
        setData({
          ...data,
          reservation: {
            ...data.reservation,
            expected_men: newMen,
            expected_women: newWomen,
          },
        });
      } else {
        // Revert on error
        if (gender === 'male') setExpectedMen(data.reservation.expected_men || 0);
        else setExpectedWomen(data.reservation.expected_women || 0);
      }
    } catch (err) {
      console.error('Error updating expected counts:', err);
      // Revert on error
      if (gender === 'male') setExpectedMen(data.reservation.expected_men || 0);
      else setExpectedWomen(data.reservation.expected_women || 0);
    } finally {
      setUpdatingCounts(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  // Check if a guest is the host (by comparing email)
  const isHost = (guestEmail?: string) => {
    if (!guestEmail) return false;
    return data?.reservation?.host_email?.toLowerCase() === guestEmail.toLowerCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="vipedit-wrapper">
          <div className="vipedit-bg-blur" />
          <div className="vipedit-bg-overlay" />
          <div className="vipedit-content">
            <div className="vipedit-loading">
              <div className="vipedit-spinner" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="vipedit-wrapper">
          <div className="vipedit-bg-blur" />
          <div className="vipedit-bg-overlay" />
          <div className="vipedit-content">
            <div className="vipedit-error">
              <div className="vipedit-error-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </div>
              <h2>{t('edit.notFound')}</h2>
              <p>{t('edit.checkCode')}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const { reservation, guests, tracking_url, can_edit } = data;
  const event = reservation.events;
  const eventImage = event?.image;

  // All guests (confirmed + declined for display)
  const allGuests = guests || [];
  const confirmedGuests = allGuests.filter(g => g.rsvp_status === 'confirmed');

  const isOpen = reservation.status === 'open';

  // Count confirmed by gender
  const confirmedMen = confirmedGuests.filter(g => g.gender === 'male').length;
  const confirmedWomen = confirmedGuests.filter(g => g.gender === 'female').length;

  return (
    <Layout>
      <div className="vipedit-wrapper">
        <div
          className="vipedit-bg-blur"
          style={eventImage ? { backgroundImage: `url(${eventImage})` } : undefined}
        />
        <div className="vipedit-bg-overlay" />
        <div className="vipedit-content">
          <div className="vipedit-container">
            {/* Header */}
            <div className="vipedit-header">
              <div className="vipedit-host-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
                </svg>
                <span>{t('edit.hostMode')}</span>
              </div>
              <h1 className="vipedit-title">{t('edit.title')}</h1>
              <p className="vipedit-subtitle">{t('edit.subtitle')}</p>
            </div>

            {/* Status Badge */}
            {!isOpen && (
              <div className="vipedit-status-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{t('edit.listClosed')}</span>
              </div>
            )}

            {/* Event Info Card */}
            <div className="vipedit-event-card">
              {event?.image && (
                <div className="vipedit-event-image">
                  <img src={event.image} alt={event?.name} />
                </div>
              )}
              <div className="vipedit-event-info">
                <h2 className="vipedit-event-name">{event?.name}</h2>
                <div className="vipedit-event-meta">
                  <span className="vipedit-event-date">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    {event?.event_date && formatDate(event.event_date)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reservation Info Card */}
            <div className="vipedit-info-card">
              <div className="vipedit-info-header">
                <h3>{t('edit.reservationInfo')}</h3>
                {isOpen && can_edit && !isEditingInfo && (
                  <button
                    className="vipedit-edit-btn"
                    onClick={() => setIsEditingInfo(true)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {t('edit.edit')}
                  </button>
                )}
              </div>

              {isEditingInfo ? (
                <div className="vipedit-edit-form">
                  <div className="vipedit-form-group">
                    <label>{t('edit.listName')}</label>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder={t('edit.listNamePlaceholder')}
                    />
                  </div>
                  <div className="vipedit-form-group">
                    <label>{t('edit.description')}</label>
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder={t('edit.descriptionPlaceholder')}
                      rows={3}
                    />
                  </div>
                  <div className="vipedit-edit-actions">
                    <button
                      className="vipedit-cancel-btn"
                      onClick={() => {
                        setIsEditingInfo(false);
                        setEditedName(reservation.reservation_name || '');
                        setEditedDescription(reservation.description || '');
                      }}
                    >
                      {t('edit.cancel')}
                    </button>
                    <button
                      className="vipedit-save-btn"
                      onClick={handleSaveInfo}
                      disabled={savingInfo}
                    >
                      {savingInfo ? t('edit.saving') : t('edit.save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="vipedit-info-content">
                  <div className="vipedit-info-row">
                    <span className="vipedit-info-label">{t('edit.listName')}</span>
                    <span className="vipedit-info-value">{reservation.reservation_name || '-'}</span>
                  </div>
                  <div className="vipedit-info-row">
                    <span className="vipedit-info-label">{t('edit.description')}</span>
                    <span className="vipedit-info-value">{reservation.description || '-'}</span>
                  </div>
                  <div className="vipedit-info-row">
                    <span className="vipedit-info-label">{t('edit.type')}</span>
                    <span className="vipedit-info-value">
                      {reservation.table_or_bar === 'table' ? t('edit.table') : t('edit.bar')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Expected Counts Card */}
            <div className="vipedit-expected-card">
              <h3>{t('edit.expectedGuests')}</h3>
              <div className="vipedit-expected-grid">
                {/* Men Counter */}
                <div className="vipedit-counter">
                  <span className="vipedit-counter-label">{t('edit.men')}</span>
                  <div className="vipedit-counter-controls">
                    <button
                      className="vipedit-counter-btn minus"
                      onClick={() => handleUpdateExpectedCount('male', -1)}
                      disabled={!isOpen || !can_edit || updatingCounts || expectedMen <= confirmedMen}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="vipedit-counter-value">
                      <span className="vipedit-counter-confirmed">{confirmedMen}</span>
                      <span className="vipedit-counter-separator">/</span>
                      <span className="vipedit-counter-expected">{expectedMen}</span>
                    </span>
                    <button
                      className="vipedit-counter-btn plus"
                      onClick={() => handleUpdateExpectedCount('male', 1)}
                      disabled={!isOpen || !can_edit || updatingCounts}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Women Counter */}
                <div className="vipedit-counter">
                  <span className="vipedit-counter-label">{t('edit.women')}</span>
                  <div className="vipedit-counter-controls">
                    <button
                      className="vipedit-counter-btn minus"
                      onClick={() => handleUpdateExpectedCount('female', -1)}
                      disabled={!isOpen || !can_edit || updatingCounts || expectedWomen <= confirmedWomen}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="vipedit-counter-value">
                      <span className="vipedit-counter-confirmed">{confirmedWomen}</span>
                      <span className="vipedit-counter-separator">/</span>
                      <span className="vipedit-counter-expected">{expectedWomen}</span>
                    </span>
                    <button
                      className="vipedit-counter-btn plus"
                      onClick={() => handleUpdateExpectedCount('female', 1)}
                      disabled={!isOpen || !can_edit || updatingCounts}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest List Card */}
            <div className="vipedit-guests-card">
              <div className="vipedit-guests-header">
                <h3>
                  {t('edit.guestList')}
                  <span className="vipedit-guest-count">({confirmedGuests.length})</span>
                </h3>
              </div>

              {/* Guest List */}
              <div className="vipedit-guest-list">
                {confirmedGuests.length === 0 ? (
                  <div className="vipedit-no-guests">
                    <p>{t('edit.noGuests')}</p>
                  </div>
                ) : (
                  <>
                    {/* Confirmed Guests */}
                    {confirmedGuests.map((guest) => {
                      const guestIsHost = isHost(guest.email);
                      const isPaid = !!guest.paid_at;

                      return (
                        <div key={guest.id} className="vipedit-guest-item">
                          <div className="vipedit-guest-avatar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="7" r="4" />
                              <path d="M5.5 21v-2a7 7 0 0114 0v2" />
                            </svg>
                          </div>
                          <span className="vipedit-guest-name">
                            {guest.name} {guest.last_name}
                            {guestIsHost && (
                              <span className="vipedit-host-tag">{t('edit.hostBadge')}</span>
                            )}
                          </span>
                          {isPaid && (
                            <span className="vipedit-paid-tag">{t('edit.paid')}</span>
                          )}
                        </div>
                      );
                    })}

                  </>
                )}
              </div>
            </div>

            {/* Tracking Link */}
            <div className="vipedit-tracking-link">
              <p>{t('edit.shareTrackingLink')}</p>
              <a
                href={tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="vipedit-link-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <path d="M15 3h6v6M10 14L21 3" />
                </svg>
                {t('edit.viewTrackingPage')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VIPListEditPage;
