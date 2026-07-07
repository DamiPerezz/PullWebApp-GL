import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  CheckCircle,
  Clock,
  CreditCard,
  XCircle,
  Calendar,
  MapPin,
  User,
  FileText,
  Wine,
  Gift,
  Zap,
  Star,
  Crown,
  PartyPopper,
  X
} from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import { getGroupReservationByPaymentLink } from '../../controller/group-reservation-controller';
import './group-reservation-tracking-page.css';

interface Guest {
  id: string;
  name: string;
  last_name: string;
  email: string;
  gender: string;
  paid_at: string | null;
  ticket_id: string | null;
  amount_due: number;
  host_pays: boolean;
  verification_code: string | null;
}

interface Bottle {
  bottle_id: string;
  bottle_name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Mixer {
  mixer_id: string;
  mixer_name: string;
  quantity: number;
}

interface GroupReservation {
  id: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  event_date: string;
  venue_name: string;
  organizer_id: string;
  organizer_name: string;
  organizer_email: string;
  guest_count: number;
  status_id: number;
  status_name: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  management_code: string;
  payment_link_code: string;
  created_at: string;
  guests: Guest[];
  bottles: Bottle[];
  mixers: Mixer[];
}

interface Perk {
  threshold: number;
  nameKey: string;
  descKey: string;
  icon: React.ReactNode;
}

const PERKS: Perk[] = [
  { threshold: 4, nameKey: 'tracking.perks.reservedTable', descKey: 'tracking.perks.reservedTableDesc', icon: <Gift size={16} /> },
  { threshold: 6, nameKey: 'tracking.perks.priorityEntry', descKey: 'tracking.perks.priorityEntryDesc', icon: <Zap size={16} /> },
  { threshold: 8, nameKey: 'tracking.perks.freeBottle', descKey: 'tracking.perks.freeBottleDesc', icon: <Wine size={16} /> },
  { threshold: 10, nameKey: 'tracking.perks.vipHost', descKey: 'tracking.perks.vipHostDesc', icon: <Crown size={16} /> },
  { threshold: 12, nameKey: 'tracking.perks.premiumArea', descKey: 'tracking.perks.premiumAreaDesc', icon: <Star size={16} /> }
];

export const GroupReservationTrackingPage = () => {
  const { lang, paymentLinkCode } = useParams<{ lang: string; paymentLinkCode: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation('group');

  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const [reservation, setReservation] = useState<GroupReservation | null>(null);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success parameter on mount
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'payment') {
      setSuccessMessage(t('tracking.successBanner.paymentComplete'));
      // Clear the query param
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
      // Auto-dismiss after 8 seconds
      setTimeout(() => setSuccessMessage(null), 8000);
    } else if (success === 'data') {
      setSuccessMessage(t('tracking.successBanner.dataComplete'));
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setSuccessMessage(null), 8000);
    }
  }, [searchParams, setSearchParams, t]);

  useEffect(() => {
    if (!paymentLinkCode) return;

    const fetchReservation = async () => {
      try {
        const data = await getGroupReservationByPaymentLink(paymentLinkCode);
        const reservationWithData = {
          ...data.reservation,
          guests: data.guests || [],
          bottles: data.bottles || [],
          mixers: data.mixers || []
        };
        setReservation(reservationWithData);
        if (data.event_image) {
          setEventImage(data.event_image);
        }
        setLoading(false);
      } catch {
        setError(t('tracking.errors.loadFailed'));
        setLoading(false);
      }
    };

    fetchReservation();
    const interval = setInterval(fetchReservation, 10000);
    return () => clearInterval(interval);
  }, [paymentLinkCode]);

  // =========================================
  // GUEST STATUS LOGIC
  // =========================================

  // Check if guest is the organizer (always the first guest in the list)
  const isOrganizer = (_guest: Guest, index: number) => {
    // Organizer is always the first guest (index 0)
    return index === 0;
  };

  // Determine guest type for display
  type GuestType = 'organizer' | 'host_paid' | 'self_pay';

  const getGuestType = (guest: Guest, index: number): GuestType => {
    if (isOrganizer(guest, index)) return 'organizer';
    if (guest.host_pays) return 'host_paid';
    return 'self_pay';
  };

  // Get guest status for actions
  type GuestStatus = 'ready' | 'needs_data' | 'needs_payment' | 'waiting';

  const getGuestStatus = (guest: Guest, index: number): GuestStatus => {
    const guestType = getGuestType(guest, index);
    const statusId = reservation?.status_id || 0;
    const isApproved = statusId === 7 || statusId === 8;

    // Organizer is always ready (already paid, has all data)
    if (guestType === 'organizer') {
      return 'ready';
    }

    // If not approved yet, everyone is waiting
    if (!isApproved) {
      return 'waiting';
    }

    // Has ticket = ready
    if (guest.ticket_id) {
      return 'ready';
    }

    // Host paid guest - needs to complete data
    if (guestType === 'host_paid') {
      const hasCompleteData = !!(guest.name && guest.last_name && guest.email && guest.gender);
      return hasCompleteData ? 'ready' : 'needs_data';
    }

    // Self-pay guest
    if (guest.paid_at) {
      // Already paid - check if data complete
      const hasCompleteData = !!(guest.name && guest.last_name && guest.email && guest.gender);
      return hasCompleteData ? 'ready' : 'needs_data';
    }

    // Needs to pay
    return 'needs_payment';
  };

  // Get counts
  const getPaidCount = () => {
    if (!reservation?.guests) return 0;
    return reservation.guests.filter((guest, index) => {
      // Organizer always counts as paid (index 0)
      if (index === 0) return true;
      // Host pays for this guest
      if (guest.host_pays) return true;
      // Guest paid themselves
      if (guest.paid_at) return true;
      return false;
    }).length;
  };

  const getPaidAmount = () => {
    // Calculate paid amount as total_amount - pending_amount
    // This correctly reflects what has been paid vs what guests still owe
    const totalAmount = reservation?.total_amount || 0;
    const pendingAmount = reservation?.pending_amount || 0;
    return totalAmount - pendingAmount;
  };

  const getPaymentProgress = () => {
    if (!reservation || !reservation.total_amount || reservation.total_amount === 0) return 0;
    return (getPaidAmount() / reservation.total_amount) * 100;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // =========================================
  // RENDER
  // =========================================

  if (loading) {
    return (
      <Layout>
        <div className="grtrack-wrapper">
          <div className="grtrack-bg-blur" style={{ backgroundImage: eventImage ? `url(${eventImage})` : undefined }} />
          <div className="grtrack-bg-overlay" />
          <div className="grtrack-content">
            <div className="grtrack-loading">
              <div className="grtrack-loading-spinner" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !reservation) {
    return (
      <Layout>
        <div className="grtrack-wrapper">
          <div className="grtrack-bg-blur" />
          <div className="grtrack-bg-overlay" />
          <div className="grtrack-content">
            <div className="grtrack-error">
              <XCircle size={48} />
              <h2>{error || t('tracking.errors.notFound')}</h2>
              <button onClick={() => navigate(buildUrl('/venues'))} className="grtrack-error-btn">
                {t('tracking.backToHome')}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const paidCount = getPaidCount();
  const paidAmount = getPaidAmount();
  const progress = getPaymentProgress();
  const statusId = reservation.status_id;
  const isApproved = statusId === 7 || statusId === 8;
  const isPending = statusId === 6;
  const isRejected = statusId === 10;

  return (
    <Layout>
      <div className="grtrack-wrapper">
        <div className="grtrack-bg-blur" style={{ backgroundImage: eventImage ? `url(${eventImage})` : undefined }} />
        <div className="grtrack-bg-overlay" />

        <div className="grtrack-content">
          <div className="grtrack-container">

            {/* Header */}
            <header className="grtrack-header">
              <h1 className="grtrack-title">{reservation.event_name}</h1>
              <div className="grtrack-meta">
                <span className="grtrack-meta-item">
                  <Calendar size={16} />
                  {formatDate(reservation.event_date)}
                </span>
                {reservation.venue_name && (
                  <span className="grtrack-meta-item">
                    <MapPin size={16} />
                    {reservation.venue_name}
                  </span>
                )}
              </div>
              <div className="grtrack-organizer">
                <User size={16} />
                <span>{t('tracking.organizedBy')} <strong>{reservation.organizer_name}</strong></span>
              </div>
            </header>

            {/* Success Message Banner */}
            {successMessage && (
              <div className="grtrack-banner grtrack-banner-success">
                <PartyPopper size={22} />
                <div>
                  <h3>{t('tracking.successBanner.allDone')}</h3>
                  <p>{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="grtrack-banner-close"
                  aria-label="Dismiss"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Status Banners */}
            {isPending && (
              <div className="grtrack-banner grtrack-banner-pending">
                <Clock size={22} />
                <div>
                  <h3>{t('tracking.statusBanner.pending')}</h3>
                  <p>{t('tracking.statusBanner.pendingDesc')}</p>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="grtrack-banner grtrack-banner-approved">
                <CheckCircle size={22} />
                <div>
                  <h3>{t('tracking.statusBanner.approved')}</h3>
                  <p>{t('tracking.statusBanner.approvedDesc')}</p>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="grtrack-banner grtrack-banner-rejected">
                <XCircle size={22} />
                <div>
                  <h3>{t('tracking.statusBanner.rejected')}</h3>
                  <p>{t('tracking.statusBanner.rejectedDesc')}</p>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grtrack-two-columns">
              {/* Left: Guests List */}
              <section className="grtrack-section grtrack-column-left">
                <div className="grtrack-section-header">
                  <Users size={20} />
                  <h2>{t('tracking.guestList', { count: reservation.guest_count })}</h2>
                </div>

                <div className="grtrack-guests">
                  {(reservation.guests || []).map((guest, index) => {
                    const guestType = getGuestType(guest, index);
                    const status = getGuestStatus(guest, index);

                    const guestName = guest.name && guest.last_name
                      ? `${guest.name} ${guest.last_name}`
                      : guest.name || guest.email || t('tracking.guestFallback', { number: index + 1 });

                    const guestEmail = guestType === 'organizer'
                      ? reservation.organizer_email
                      : guest.email;

                    return (
                      <div
                        key={guest.id}
                        className={`grtrack-guest grtrack-guest-${status}`}
                      >
                        <div className="grtrack-guest-left">
                          <div className={`grtrack-guest-avatar grtrack-guest-avatar-${status}`}>
                            {status === 'ready' && <CheckCircle size={20} />}
                            {status === 'needs_data' && <FileText size={20} />}
                            {status === 'needs_payment' && <CreditCard size={20} />}
                            {status === 'waiting' && <Clock size={20} />}
                          </div>
                          <div className="grtrack-guest-info">
                            <h3 className="grtrack-guest-name">
                              {guestType === 'organizer' ? reservation.organizer_name : guestName}
                              {guestType === 'organizer' && (
                                <span className="grtrack-badge grtrack-badge-organizer">{t('tracking.badges.organizer')}</span>
                              )}
                              {guestType === 'host_paid' && (
                                <span className="grtrack-badge grtrack-badge-hostpaid">{t('tracking.badges.hostPaid')}</span>
                              )}
                            </h3>
                            <p className="grtrack-guest-email">{guestEmail || t('tracking.emailPending')}</p>
                            {guestType === 'self_pay' && !guest.paid_at && (
                              <span className="grtrack-guest-amount">Q{(guest.amount_due || 0).toFixed(2)}</span>
                            )}
                          </div>
                        </div>

                        <div className="grtrack-guest-right">
                          {status === 'ready' && (
                            <span className="grtrack-status-badge grtrack-status-ready">
                              <CheckCircle size={16} />
                              {guest.ticket_id ? t('tracking.status.ticketReady') : t('tracking.status.ready')}
                            </span>
                          )}

                          {status === 'needs_data' && (
                            <button
                              onClick={() => navigate(buildUrl(`/group/guest/${guest.id}/complete?vc=${guest.verification_code}`))}
                              className="grtrack-action-btn grtrack-action-data"
                            >
                              <FileText size={16} />
                              {t('tracking.status.needsData')}
                            </button>
                          )}

                          {status === 'needs_payment' && (
                            <button
                              onClick={() => navigate(buildUrl(`/group/guest/${guest.id}/complete?vc=${guest.verification_code}`))}
                              className="grtrack-action-btn grtrack-action-pay"
                            >
                              <CreditCard size={16} />
                              {t('tracking.status.needsPayment', { price: `Q${(guest.amount_due || 0).toFixed(2)}` })}
                            </button>
                          )}

                          {status === 'waiting' && (
                            <span className="grtrack-status-badge grtrack-status-waiting">
                              <Clock size={16} />
                              {t('tracking.status.waiting')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Right: Progress Card */}
              <div className="grtrack-column-right">
                <div className="grtrack-progress-card">
              <div className="grtrack-progress-header">
                <div className="grtrack-progress-info">
                  <h2 className="grtrack-progress-title">{t('tracking.groupProgress')}</h2>
                  <p className="grtrack-progress-subtitle">
                    {t('tracking.guestsPaid', { paid: paidCount, total: reservation.guest_count })}
                  </p>
                </div>
                <div className="grtrack-progress-amount">
                  <span className="grtrack-progress-paid">Q{paidAmount.toFixed(2)}</span>
                  <span className="grtrack-progress-total">{t('tracking.ofAmount', { amount: (reservation.total_amount || 0).toFixed(2) })}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="grtrack-progressbar">
                <div className="grtrack-progressbar-track">
                  <div
                    className="grtrack-progressbar-fill"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                  <div className="grtrack-progressbar-glow" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <div className="grtrack-progressbar-labels">
                  <span className="grtrack-progressbar-percent">{Math.round(progress)}%</span>
                  <span className="grtrack-progressbar-count">
                    <Users size={14} />
                    {reservation.guest_count} {t('tracking.people')}
                  </span>
                </div>
              </div>

              {/* Perks inline */}
              {(() => {
                const guestCount = reservation.guest_count;
                const nextPerkIndex = PERKS.findIndex(p => guestCount < p.threshold);
                const nextPerk = nextPerkIndex !== -1 ? PERKS[nextPerkIndex] : null;

                return (
                  <div className="grtrack-perks-section">
                    <div className="grtrack-perks-inline">
                      {PERKS.map((perk, index) => {
                        const unlocked = guestCount >= perk.threshold;
                        const isNext = nextPerkIndex === index;
                        const remaining = perk.threshold - guestCount;

                        return (
                          <div
                            key={perk.threshold}
                            className={`grtrack-perk-card ${unlocked ? 'grtrack-perk-card-unlocked' : ''} ${isNext ? 'grtrack-perk-card-next' : ''}`}
                          >
                            <div className="grtrack-perk-card-icon">{perk.icon}</div>
                            <div className="grtrack-perk-card-content">
                              <span className="grtrack-perk-card-name">{t(perk.nameKey)}</span>
                              <span className="grtrack-perk-card-desc">{t(perk.descKey)} · {perk.threshold} {t('tracking.people')}</span>
                            </div>
                            <div className="grtrack-perk-card-status">
                              {unlocked ? (
                                <CheckCircle size={16} className="grtrack-perk-card-check" />
                              ) : (
                                <span className="grtrack-perk-card-remaining">+{remaining}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {nextPerk && (
                      <div className="grtrack-next-perk-hint">
                        <Zap size={14} />
                        <span dangerouslySetInnerHTML={{ __html: t('tracking.perks.nextPerk', {
                          perk: t(nextPerk.nameKey),
                          count: nextPerk.threshold - guestCount,
                          pluralPerson: (nextPerk.threshold - guestCount) !== 1 ? t('tracking.perks.people') : t('tracking.perks.person')
                        }) }} />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Bottles Section - Inside Progress Card */}
              {reservation.bottles && reservation.bottles.length > 0 && (
                <div className="grtrack-bottles-section">
                  <div className="grtrack-bottles-header">
                    <Wine size={18} />
                    <h3>{t('tracking.bottlesIncluded')}</h3>
                  </div>
                  <div className="grtrack-bottles-list">
                    {reservation.bottles.map((bottle, index) => (
                      <div key={index} className="grtrack-bottle-item">
                        <div className="grtrack-bottle-img-container">
                          {bottle.image ? (
                            <img
                              src={bottle.image}
                              alt={bottle.bottle_name}
                              className="grtrack-bottle-img"
                              loading="lazy"
                            />
                          ) : (
                            <div className="grtrack-bottle-placeholder">
                              <Wine size={24} />
                            </div>
                          )}
                        </div>
                        <div className="grtrack-bottle-details">
                          <span className="grtrack-bottle-qty-badge">{bottle.quantity}x</span>
                          <span className="grtrack-bottle-name">{bottle.bottle_name}</span>
                        </div>
                        <div className="grtrack-bottle-price">
                          Q{((bottle.price || 0) * (bottle.quantity || 1)).toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};
