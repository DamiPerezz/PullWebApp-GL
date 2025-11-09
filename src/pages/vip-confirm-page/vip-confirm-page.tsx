// vip-confirm-page.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../../components/layout/layout';
import { useState } from 'react';
import { ChevronLeft, Users, Wine, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { createVIPReservation } from '../../controller/vip-controller';
import './vip-confirm-page.css';

export const VIPConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { table, bottle, organizer, guests, perks } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!table || !bottle || !organizer || !guests) {
    navigate('/venues');
    return null;
  }

  const totalGuests = guests.length + 1;
  const amountPerPerson = table.min_spend / totalGuests;
  const achievedPerks = perks?.filter((p: any) => totalGuests >= p.threshold) || [];

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await createVIPReservation({
        event_id: table.event_id,
        table_id: table.id,
        bottle_id: bottle.id,
        organizer,
        guests,
      });

      navigate(`/vip/manage/${response.management_code}`, {
        state: {
          isNew: true,
          paymentLink: response.payment_link,
          deadlineMinutes: response.deadline_minutes,
        },
      });
    } catch (err: any) {
      console.error('Error creating reservation:', err);
      setError(err.response?.data?.error || 'Failed to create reservation. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className="vip-confirm-wrapper">
        <div className="vip-confirm-bg-blur" />
        <div className="vip-confirm-bg-overlay" />

        <div className="vip-confirm-content">
          <div className="vip-confirm-container">
            <button onClick={handleBack} className="vip-confirm-back-button" disabled={loading}>
              <ChevronLeft />
              Back
            </button>

            <header className="vip-confirm-header">
              <h1 className="vip-confirm-title">Confirm Reservation</h1>
              <p className="vip-confirm-subtitle">Review your VIP table reservation details</p>
            </header>

            {error && (
              <div className="vip-confirm-error">
                <AlertCircle />
                <div>
                  <h4>Error</h4>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <div className="vip-confirm-grid">
              <div className="vip-confirm-left">
                <section className="vip-confirm-card">
                  <h3 className="vip-confirm-card-title">
                    <Wine />
                    Table & Bottle
                  </h3>

                  <div className="vip-confirm-details">
                    <div className="vip-confirm-detail-item">
                      <span className="label">Table</span>
                      <span className="value">{table.table_number} - {table.zone}</span>
                    </div>
                    <div className="vip-confirm-detail-item">
                      <span className="label">Capacity</span>
                      <span className="value">{table.capacity} people</span>
                    </div>
                    <div className="vip-confirm-detail-item">
                      <span className="label">Bottle</span>
                      <span className="value">{bottle.name}</span>
                    </div>
                    {bottle.brand && (
                      <div className="vip-confirm-detail-item">
                        <span className="label">Brand</span>
                        <span className="value">{bottle.brand}</span>
                      </div>
                    )}
                  </div>
                </section>

                <section className="vip-confirm-card">
                  <h3 className="vip-confirm-card-title">
                    <Users />
                    Organizer
                  </h3>

                  <div className="vip-confirm-details">
                    <div className="vip-confirm-detail-item">
                      <span className="label">Name</span>
                      <span className="value">{organizer.name} {organizer.last_name}</span>
                    </div>
                    <div className="vip-confirm-detail-item">
                      <span className="label">Email</span>
                      <span className="value">{organizer.email}</span>
                    </div>
                    <div className="vip-confirm-detail-item">
                      <span className="label">Phone</span>
                      <span className="value">{organizer.phone}</span>
                    </div>
                  </div>
                </section>

                <section className="vip-confirm-card">
                  <h3 className="vip-confirm-card-title">
                    <Users />
                    Guests ({guests.length})
                  </h3>

                  <div className="vip-confirm-guests">
                    {guests.map((guest: any, index: number) => (
                      <div key={index} className="vip-confirm-guest">
                        <span className="vip-confirm-guest-number">{index + 1}</span>
                        <div className="vip-confirm-guest-info">
                          <span className="vip-confirm-guest-name">
                            {guest.name} {guest.last_name}
                          </span>
                          <span className="vip-confirm-guest-email">{guest.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="vip-confirm-right">
                <div className="vip-confirm-summary">
                  <h3 className="vip-confirm-summary-title">Payment Summary</h3>

                  <div className="vip-confirm-summary-item">
                    <span>Minimum Spend</span>
                    <span>€{table.min_spend.toFixed(2)}</span>
                  </div>

                  <div className="vip-confirm-summary-item">
                    <span>Total Guests</span>
                    <span>{totalGuests} people</span>
                  </div>

                  <div className="vip-confirm-summary-divider" />

                  <div className="vip-confirm-summary-item vip-confirm-summary-total">
                    <span>Per Person</span>
                    <span>€{amountPerPerson.toFixed(2)}</span>
                  </div>

                  {achievedPerks.length > 0 && (
                    <>
                      <div className="vip-confirm-summary-divider" />
                      <div className="vip-confirm-perks">
                        <h4>
                          <CheckCircle />
                          Rewards Unlocked
                        </h4>
                        {achievedPerks.map((perk: any) => (
                          <div key={perk.id} className="vip-confirm-perk">
                            {perk.perk_description}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="vip-confirm-summary-divider" />

                  <div className="vip-confirm-info-box">
                    <Clock />
                    <div>
                      <h4>Payment Deadline</h4>
                      <p>All guests have 30 minutes to complete payment after reservation.</p>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirm}
                    disabled={loading}
                    className="vip-confirm-button"
                  >
                    {loading ? 'Creating Reservation...' : 'Confirm & Create Reservation'}
                  </button>

                  <p className="vip-confirm-note">
                    Each guest will receive a payment link via email. The organizer will receive a management code to track payments and manage guests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="vip-confirm-loading-overlay">
            <div className="vip-confirm-loading-card">
              <div className="vip-confirm-loading-spinner"></div>
              <p>Creating your reservation...</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};