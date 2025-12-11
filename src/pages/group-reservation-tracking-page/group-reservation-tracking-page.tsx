import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  name: string;
  description: string;
  icon: React.ReactNode;
}

const PERKS: Perk[] = [
  { threshold: 4, name: 'Reserved Table', description: 'Private table', icon: <Gift size={16} /> },
  { threshold: 6, name: 'Priority Entry', description: 'Skip the line', icon: <Zap size={16} /> },
  { threshold: 8, name: 'Free Bottle', description: 'Complimentary', icon: <Wine size={16} /> },
  { threshold: 10, name: 'VIP Host', description: 'Personal service', icon: <Crown size={16} /> },
  { threshold: 12, name: 'Premium Area', description: 'Exclusive zone', icon: <Star size={16} /> }
];

export const GroupReservationTrackingPage = () => {
  const { paymentLinkCode } = useParams<{ paymentLinkCode: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [reservation, setReservation] = useState<GroupReservation | null>(null);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for success parameter on mount
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'payment') {
      setSuccessMessage('Payment complete! Your ticket has been sent to your email.');
      // Clear the query param
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
      // Auto-dismiss after 8 seconds
      setTimeout(() => setSuccessMessage(null), 8000);
    } else if (success === 'data') {
      setSuccessMessage('Info complete! Your ticket has been sent to your email.');
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setSuccessMessage(null), 8000);
    }
  }, [searchParams, setSearchParams]);

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
        setError('Could not load reservation');
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
  const getReadyCount = () => {
    return reservation?.guests?.filter((g, i) => getGuestStatus(g, i) === 'ready').length || 0;
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
    return date.toLocaleDateString('en-US', {
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
              <h2>{error || 'Reservation not found'}</h2>
              <button onClick={() => navigate('/venues')} className="grtrack-error-btn">
                Back to home
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const readyCount = getReadyCount();
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
                <span>Organized by <strong>{reservation.organizer_name}</strong></span>
              </div>
            </header>

            {/* Success Message Banner */}
            {successMessage && (
              <div className="grtrack-banner grtrack-banner-success">
                <PartyPopper size={22} />
                <div>
                  <h3>All Done!</h3>
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
                  <h3>Awaiting Staff Approval</h3>
                  <p>Your reservation is being reviewed. You'll receive an email when approved.</p>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="grtrack-banner grtrack-banner-approved">
                <CheckCircle size={22} />
                <div>
                  <h3>Reservation Approved</h3>
                  <p>Guests can complete their details and receive their tickets.</p>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="grtrack-banner grtrack-banner-rejected">
                <XCircle size={22} />
                <div>
                  <h3>Reservation Rejected</h3>
                  <p>Your reservation could not be approved. Contact the venue for more info.</p>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grtrack-two-columns">
              {/* Left: Guests List */}
              <section className="grtrack-section grtrack-column-left">
                <div className="grtrack-section-header">
                  <Users size={20} />
                  <h2>Guest List ({reservation.guest_count})</h2>
                </div>

                <div className="grtrack-guests">
                  {(reservation.guests || []).map((guest, index) => {
                    const guestType = getGuestType(guest, index);
                    const status = getGuestStatus(guest, index);

                    const guestName = guest.name && guest.last_name
                      ? `${guest.name} ${guest.last_name}`
                      : guest.name || guest.email || `Guest ${index + 1}`;

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
                                <span className="grtrack-badge grtrack-badge-organizer">Organizer</span>
                              )}
                              {guestType === 'host_paid' && (
                                <span className="grtrack-badge grtrack-badge-hostpaid">Paid by organizer</span>
                              )}
                            </h3>
                            <p className="grtrack-guest-email">{guestEmail || 'Email pending'}</p>
                            {guestType === 'self_pay' && !guest.paid_at && (
                              <span className="grtrack-guest-amount">Q{(guest.amount_due || 0).toFixed(2)}</span>
                            )}
                          </div>
                        </div>

                        <div className="grtrack-guest-right">
                          {status === 'ready' && (
                            <span className="grtrack-status-badge grtrack-status-ready">
                              <CheckCircle size={16} />
                              {guest.ticket_id ? 'Ticket ready' : 'Ready'}
                            </span>
                          )}

                          {status === 'needs_data' && (
                            <button
                              onClick={() => navigate(`/group/guest/${guest.id}/complete`)}
                              className="grtrack-action-btn grtrack-action-data"
                            >
                              <FileText size={16} />
                              Complete info
                            </button>
                          )}

                          {status === 'needs_payment' && (
                            <button
                              onClick={() => navigate(`/group/guest/${guest.id}/complete`)}
                              className="grtrack-action-btn grtrack-action-pay"
                            >
                              <CreditCard size={16} />
                              Pay Q{(guest.amount_due || 0).toFixed(2)}
                            </button>
                          )}

                          {status === 'waiting' && (
                            <span className="grtrack-status-badge grtrack-status-waiting">
                              <Clock size={16} />
                              Awaiting approval
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
                  <h2 className="grtrack-progress-title">Group Progress</h2>
                  <p className="grtrack-progress-subtitle">
                    {readyCount} of {reservation.guest_count} guests ready
                  </p>
                </div>
                <div className="grtrack-progress-amount">
                  <span className="grtrack-progress-paid">Q{paidAmount.toFixed(2)}</span>
                  <span className="grtrack-progress-total">of Q{(reservation.total_amount || 0).toFixed(2)}</span>
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
                    {reservation.guest_count} people
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
                              <span className="grtrack-perk-card-name">{perk.name}</span>
                              <span className="grtrack-perk-card-desc">{perk.description} · {perk.threshold} people</span>
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
                        <span>Next: <strong>{nextPerk.name}</strong> — invite {nextPerk.threshold - guestCount} more {nextPerk.threshold - guestCount !== 1 ? 'people' : 'person'}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

                </div>
              </div>
            </div>

            {/* Bottles Section */}
            {reservation.bottles && reservation.bottles.length > 0 && (
              <section className="grtrack-section">
                <div className="grtrack-section-header">
                  <Wine size={20} />
                  <h2>Bottles Included</h2>
                </div>
                <div className="grtrack-items">
                  {reservation.bottles.map((bottle, index) => (
                    <div key={index} className="grtrack-item">
                      <span className="grtrack-item-qty">{bottle.quantity}x</span>
                      <span className="grtrack-item-name">{bottle.bottle_name}</span>
                      <span className="grtrack-item-price">Q{((bottle.price || 0) * (bottle.quantity || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Mixers Section */}
            {reservation.mixers && reservation.mixers.length > 0 && (
              <section className="grtrack-section">
                <div className="grtrack-section-header">
                  <h2>Mixers Included</h2>
                </div>
                <div className="grtrack-items">
                  {reservation.mixers.map((mixer, index) => (
                    <div key={index} className="grtrack-item">
                      <span className="grtrack-item-qty">{mixer.quantity}x</span>
                      <span className="grtrack-item-name">{mixer.mixer_name}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
};
