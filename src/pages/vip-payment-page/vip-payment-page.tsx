// vip-payment-page.tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { Users, Clock, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { getVIPReservationByPaymentLink, createVIPGuestCheckout } from '../../controller/vip-controller';
import type { VIPReservationDetails, VIPGuest } from '../../types/types';
import './vip-payment-page.css';

export const VIPPaymentPage = () => {
  const { paymentLinkCode } = useParams<{ paymentLinkCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cancelled = searchParams.get('cancelled');

  const [reservation, setReservation] = useState<VIPReservationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<VIPGuest | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!paymentLinkCode) return;

    loadReservation();
    const interval = setInterval(loadReservation, 10000);
    return () => clearInterval(interval);
  }, [paymentLinkCode]);

  const loadReservation = async () => {
    try {
      const data = await getVIPReservationByPaymentLink(paymentLinkCode!);
      setReservation(data.reservation);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading reservation:', err);
      setError(err.response?.data?.error || 'Failed to load reservation');
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedGuest) {
      alert('Please select yourself from the guest list');
      return;
    }

    if (selectedGuest.status === 'paid') {
      alert('You have already paid for this reservation');
      return;
    }

    setProcessing(true);
    try {
      const response = await createVIPGuestCheckout(paymentLinkCode!, selectedGuest.id);
      window.location.href = response.url;
    } catch (err: any) {
      console.error('Error creating checkout:', err);
      alert(err.response?.data?.error || 'Failed to create checkout session');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="vip-payment-loading">
          <div className="vip-payment-loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  if (error || !reservation) {
    return (
      <Layout>
        <div className="vip-payment-error">
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

  const pendingGuests = reservation.guests.filter(g => g.status === 'pending');
  const paidGuests = reservation.guests.filter(g => g.status === 'paid');

  return (
    <Layout>
      <div className="vip-payment-wrapper">
        <div 
          className="vip-payment-bg-blur"
          style={{ backgroundImage: `url(${reservation.event_image})` }}
        />
        <div className="vip-payment-bg-overlay" />

        <div className="vip-payment-content">
          <div className="vip-payment-container">
            {cancelled === 'true' && (
              <div className="vip-payment-cancelled-banner">
                <AlertCircle />
                <div>
                  <h3>Payment Cancelled</h3>
                  <p>You can try again whenever you're ready.</p>
                </div>
              </div>
            )}

            <header className="vip-payment-header">
              <div>
                <h1 className="vip-payment-title">VIP Table Payment</h1>
                <p className="vip-payment-subtitle">{reservation.event_name}</p>
              </div>
            </header>

            {timeLeft > 0 ? (
              <div className="vip-payment-timer">
                <Clock />
                <div>
                  <h4>Time Remaining to Complete Payment</h4>
                  <p className="vip-payment-countdown">
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="vip-payment-expired">
                <AlertCircle />
                <div>
                  <h3>Reservation Expired</h3>
                  <p>The payment deadline has passed. Please contact the organizer for assistance.</p>
                </div>
              </div>
            )}

            <div className="vip-payment-grid">
              <div className="vip-payment-left">
                <section className="vip-payment-card">
                  <h3 className="vip-payment-card-title">
                    <Users />
                    Select Yourself
                  </h3>
                  <p className="vip-payment-card-description">
                    Choose your name from the list to proceed with payment
                  </p>

                  <div className="vip-payment-guests">
                    {pendingGuests.map((guest) => (
                      <button
                        key={guest.id}
                        onClick={() => setSelectedGuest(guest)}
                        className={`vip-payment-guest ${selectedGuest?.id === guest.id ? 'selected' : ''}`}
                        disabled={timeLeft === 0}
                      >
                        <div className="vip-payment-guest-info">
                          <div className="vip-payment-guest-name">
                            {guest.name} {guest.last_name}
                            {guest.is_organizer && (
                              <span className="vip-payment-organizer-badge">Organizer</span>
                            )}
                          </div>
                          <div className="vip-payment-guest-email">{guest.email}</div>
                        </div>
                        <div className="vip-payment-guest-amount">
                          €{guest.amount_due.toFixed(2)}
                        </div>
                        {selectedGuest?.id === guest.id && (
                          <div className="vip-payment-guest-check">
                            <CheckCircle />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {paidGuests.length > 0 && (
                    <>
                      <div className="vip-payment-divider">
                        <span>Already Paid</span>
                      </div>

                      <div className="vip-payment-paid-guests">
                        {paidGuests.map((guest) => (
                          <div key={guest.id} className="vip-payment-paid-guest">
                            <CheckCircle className="paid-icon" />
                            <div className="vip-payment-guest-info">
                              <div className="vip-payment-guest-name">
                                {guest.name} {guest.last_name}
                              </div>
                              <div className="vip-payment-guest-email">{guest.email}</div>
                            </div>
                            <div className="vip-payment-guest-amount paid">
                              €{guest.amount_due.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>

                <section className="vip-payment-card">
                  <h3 className="vip-payment-card-title">Payment Information</h3>
                  
                  <div className="vip-payment-info-box">
                    <CreditCard />
                    <div>
                      <h4>Secure Payment</h4>
                      <p>Your payment will be processed securely through Stripe. All card information is encrypted.</p>
                    </div>
                  </div>

                  <div className="vip-payment-info-box">
                    <Users />
                    <div>
                      <h4>Split Payment</h4>
                      <p>The total cost is split equally among all guests. Each person pays their share.</p>
                    </div>
                  </div>

                  {reservation.perks_achieved && reservation.perks_achieved.length > 0 && (
                    <div className="vip-payment-perks">
                      <h4>
                        <CheckCircle />
                        Rewards Unlocked
                      </h4>
                      {reservation.perks_achieved.map((perk) => (
                        <div key={perk.id} className="vip-payment-perk">
                          {perk.perk_description}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="vip-payment-right">
                <div className="vip-payment-summary">
                  <h3 className="vip-payment-summary-title">Reservation Details</h3>

                  <div className="vip-payment-detail">
                    <span>Event</span>
                    <span>{reservation.event_name}</span>
                  </div>
                  <div className="vip-payment-detail">
                    <span>Date</span>
                    <span>{new Date(reservation.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="vip-payment-detail">
                    <span>Time</span>
                    <span>{reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}</span>
                  </div>
                  <div className="vip-payment-detail">
                    <span>Venue</span>
                    <span>{reservation.venue_name}</span>
                  </div>
                  <div className="vip-payment-detail">
                    <span>Table</span>
                    <span>{reservation.table_number} - {reservation.table_zone}</span>
                  </div>
                  <div className="vip-payment-detail">
                    <span>Bottle</span>
                    <span>{reservation.bottle_name}</span>
                  </div>

                  <div className="vip-payment-divider-line" />

                  <div className="vip-payment-progress">
                    <div className="vip-payment-progress-header">
                      <span>Payment Progress</span>
                      <span>{reservation.payment_progress.toFixed(0)}%</span>
                    </div>
                    <div className="vip-payment-progress-bar">
                      <div 
                        className="vip-payment-progress-fill"
                        style={{ width: `${reservation.payment_progress}%` }}
                      />
                    </div>
                    <div className="vip-payment-progress-stats">
                      <span>{paidGuests.length} / {reservation.guest_count} paid</span>
                    </div>
                  </div>

                  <div className="vip-payment-divider-line" />

                  {selectedGuest && (
                    <div className="vip-payment-your-share">
                      <span>Your Share</span>
                      <span className="vip-payment-amount">
                        €{selectedGuest.amount_due.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleProceedToPayment}
                    disabled={!selectedGuest || processing || timeLeft === 0}
                    className="vip-payment-button"
                  >
                    {processing ? 'Processing...' : 'Proceed to Payment'}
                  </button>

                  <p className="vip-payment-note">
                    You will be redirected to Stripe to complete your payment securely.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {processing && (
          <div className="vip-payment-processing-overlay">
            <div className="vip-payment-processing-card">
              <div className="vip-payment-loading-spinner"></div>
              <p>Preparing checkout...</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};