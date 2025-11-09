// vip-management-page.tsx
import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { 
  Copy, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  Mail
} from 'lucide-react';
import { 
  getVIPReservationByCode, 
  addGuestToReservation, 
  removeGuestFromReservation,
  cancelVIPReservation 
} from '../../controller/vip-controller';
import type { VIPReservationDetails, VIPGuest } from '../../types/types';
import './vip-management-page.css';

export const VIPManagementPage = () => {
  const { managementCode } = useParams<{ managementCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [reservation, setReservation] = useState<VIPReservationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: '', last_name: '', email: '', gender: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isNew = location.state?.isNew || false;
  const paymentLink = location.state?.paymentLink;

  useEffect(() => {
    if (!managementCode) return;

    loadReservation();
    const interval = setInterval(loadReservation, 10000);
    return () => clearInterval(interval);
  }, [managementCode]);

  const loadReservation = async () => {
    try {
      const data = await getVIPReservationByCode(managementCode!);
      setReservation(data.reservation);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading reservation:', err);
      setError(err.response?.data?.error || 'Failed to load reservation');
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (managementCode) {
      navigator.clipboard.writeText(managementCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddGuest = async () => {
    if (!newGuest.name || !newGuest.last_name || !newGuest.email) {
      alert('Please fill all required fields');
      return;
    }

    setActionLoading(true);
    try {
      await addGuestToReservation(managementCode!, newGuest);
      setNewGuest({ name: '', last_name: '', email: '', gender: '' });
      setShowAddGuest(false);
      await loadReservation();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add guest');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveGuest = async (guestId: string) => {
    if (!confirm('Are you sure you want to remove this guest?')) return;

    setActionLoading(true);
    try {
      await removeGuestFromReservation(managementCode!, guestId);
      await loadReservation();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to remove guest');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!confirm('Are you sure you want to cancel this entire reservation? This action cannot be undone.')) return;

    setActionLoading(true);
    try {
      await cancelVIPReservation(managementCode!);
      alert('Reservation cancelled successfully');
      navigate('/venues');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel reservation');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="vip-mgmt-loading">
          <div className="vip-mgmt-loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  if (error || !reservation) {
    return (
      <Layout>
        <div className="vip-mgmt-error">
          <AlertCircle />
          <h2>Error</h2>
          <p>{error || 'Reservation not found'}</p>
          <button onClick={() => navigate('/venues')}>Back to Venues</button>
        </div>
      </Layout>
    );
  }

  const timeLeft = Math.max(0, Math.floor((new Date(reservation.deadline_at).getTime() - Date.now()) / 1000));
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Layout>
      <div className="vip-mgmt-wrapper">
        <div className="vip-mgmt-bg-blur" style={{ backgroundImage: `url(${reservation.event_image})` }} />
        <div className="vip-mgmt-bg-overlay" />

        <div className="vip-mgmt-content">
          <div className="vip-mgmt-container">
            {isNew && (
              <div className="vip-mgmt-success-banner">
                <CheckCircle />
                <div>
                  <h3>Reservation Created Successfully!</h3>
                  <p>Share the payment link with your guests so they can complete their payment.</p>
                </div>
              </div>
            )}

            <header className="vip-mgmt-header">
              <div>
                <h1 className="vip-mgmt-title">{reservation.event_name}</h1>
                <p className="vip-mgmt-subtitle">
                  {reservation.table_number} - {reservation.table_zone}
                </p>
              </div>
              <div className="vip-mgmt-status">
                <span className={`vip-mgmt-status-badge ${reservation.status_name}`}>
                  {reservation.status_name}
                </span>
              </div>
            </header>

            {reservation.status_name === 'pending' && timeLeft > 0 && (
              <div className="vip-mgmt-timer">
                <Clock />
                <div>
                  <h4>Time Remaining</h4>
                  <p className="vip-mgmt-countdown">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            )}

            <div className="vip-mgmt-code-section">
              <div className="vip-mgmt-code-card">
                <h4>Management Code</h4>
                <div className="vip-mgmt-code-display">
                  <code>{managementCode}</code>
                  <button onClick={handleCopyCode} className="vip-mgmt-copy-btn">
                    <Copy />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p>Save this code to manage your reservation later</p>
              </div>

              {paymentLink && (
                <div className="vip-mgmt-code-card">
                  <h4>Payment Link</h4>
                  <div className="vip-mgmt-code-display">
                    <code>{paymentLink}</code>
                    <button onClick={handleCopyLink} className="vip-mgmt-copy-btn">
                      <Copy />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p>Share this link with all guests</p>
                </div>
              )}
            </div>

            <div className="vip-mgmt-grid">
              <div className="vip-mgmt-left">
                <section className="vip-mgmt-card">
                  <div className="vip-mgmt-card-header">
                    <h3>
                      <TrendingUp />
                      Payment Progress
                    </h3>
                  </div>

                  <div className="vip-mgmt-progress-bar">
                    <div 
                      className="vip-mgmt-progress-fill" 
                      style={{ width: `${reservation.payment_progress}%` }}
                    />
                  </div>

                  <div className="vip-mgmt-progress-stats">
                    <div>
                      <span>{reservation.payment_progress.toFixed(0)}%</span>
                      <label>Complete</label>
                    </div>
                    <div>
                      <span>€{reservation.total_paid.toFixed(2)}</span>
                      <label>Paid</label>
                    </div>
                    <div>
                      <span>€{reservation.total_amount.toFixed(2)}</span>
                      <label>Total</label>
                    </div>
                  </div>
                </section>

                {reservation.perks_achieved && reservation.perks_achieved.length > 0 && (
                  <section className="vip-mgmt-card">
                    <div className="vip-mgmt-card-header">
                      <h3>
                        <CheckCircle />
                        Rewards Unlocked
                      </h3>
                    </div>
                    <div className="vip-mgmt-perks">
                      {reservation.perks_achieved.map((perk) => (
                        <div key={perk.id} className="vip-mgmt-perk">
                          {perk.perk_description}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="vip-mgmt-card">
                  <div className="vip-mgmt-card-header">
                    <h3>
                      <Users />
                      Guests ({reservation.guests.length})
                    </h3>
                    {reservation.status_name === 'pending' && reservation.guests.length < reservation.table_capacity && (
                      <button 
                        onClick={() => setShowAddGuest(!showAddGuest)}
                        className="vip-mgmt-add-guest-btn"
                      >
                        <Plus />
                        Add Guest
                      </button>
                    )}
                  </div>

                  {showAddGuest && (
                    <div className="vip-mgmt-add-guest-form">
                      <div className="vip-mgmt-form-row">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={newGuest.name}
                          onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={newGuest.last_name}
                          onChange={(e) => setNewGuest({ ...newGuest, last_name: e.target.value })}
                        />
                      </div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={newGuest.email}
                        onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                      />
                      <select
                        value={newGuest.gender}
                        onChange={(e) => setNewGuest({ ...newGuest, gender: e.target.value })}
                      >
                        <option value="">Gender (Optional)</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="vip-mgmt-form-actions">
                        <button onClick={handleAddGuest} disabled={actionLoading}>
                          Add Guest
                        </button>
                        <button onClick={() => setShowAddGuest(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="vip-mgmt-guests">
                    {reservation.guests.map((guest) => (
                      <div key={guest.id} className="vip-mgmt-guest">
                        <div className="vip-mgmt-guest-status">
                          {guest.status === 'paid' ? (
                            <CheckCircle className="paid" />
                          ) : guest.status === 'cancelled' ? (
                            <XCircle className="cancelled" />
                          ) : (
                            <Clock className="pending" />
                          )}
                        </div>
                        <div className="vip-mgmt-guest-info">
                          <div className="vip-mgmt-guest-name">
                            {guest.name} {guest.last_name}
                            {guest.is_organizer && (
                              <span className="vip-mgmt-organizer-badge">Organizer</span>
                            )}
                          </div>
                          <div className="vip-mgmt-guest-details">
                            <Mail size={14} />
                            {guest.email}
                          </div>
                          <div className="vip-mgmt-guest-amount">
                            €{guest.amount_due.toFixed(2)}
                            <span className={`vip-mgmt-guest-status-text ${guest.status}`}>
                              {guest.status}
                            </span>
                          </div>
                        </div>
                        {!guest.is_organizer && guest.status === 'pending' && reservation.status_name === 'pending' && (
                          <button
                            onClick={() => handleRemoveGuest(guest.id)}
                            disabled={actionLoading}
                            className="vip-mgmt-remove-btn"
                          >
                            <Trash2 />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="vip-mgmt-right">
                <div className="vip-mgmt-summary">
                  <h3>Reservation Details</h3>

                  <div className="vip-mgmt-detail">
                    <span>Event</span>
                    <span>{reservation.event_name}</span>
                  </div>
                  <div className="vip-mgmt-detail">
                    <span>Date</span>
                    <span>{new Date(reservation.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="vip-mgmt-detail">
                    <span>Time</span>
                    <span>{reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}</span>
                  </div>
                  <div className="vip-mgmt-detail">
                    <span>Venue</span>
                    <span>{reservation.venue_name}</span>
                  </div>
                  <div className="vip-mgmt-detail">
                    <span>Table</span>
                    <span>{reservation.table_number} - {reservation.table_zone}</span>
                  </div>
                  <div className="vip-mgmt-detail">
                    <span>Bottle</span>
                    <span>{reservation.bottle_name}</span>
                  </div>

                  <div className="vip-mgmt-divider" />

                  <div className="vip-mgmt-detail">
                    <span>Total Amount</span>
                    <span className="vip-mgmt-amount">€{reservation.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="vip-mgmt-detail">
                    <span>Paid</span>
                    <span className="vip-mgmt-amount paid">€{reservation.total_paid.toFixed(2)}</span>
                  </div>
                  <div className="vip-mgmt-detail">
                    <span>Remaining</span>
                    <span className="vip-mgmt-amount pending">
                      €{(reservation.total_amount - reservation.total_paid).toFixed(2)}
                    </span>
                  </div>

                  {reservation.status_name === 'pending' && (
                    <>
                      <div className="vip-mgmt-divider" />
                      <button
                        onClick={handleCancelReservation}
                        disabled={actionLoading}
                        className="vip-mgmt-cancel-btn"
                      >
                        Cancel Reservation
                      </button>
                    </>
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