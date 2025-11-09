import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Phone, Mail } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import { TableMapSelector } from '../../components/table-map-selector/table-map-selector';
import { BottleSelector } from '../../components/bottle-selector/bottle-selector';
import type { EventDetailedInfo, VIPTable, VIPBottle } from '../../types/types';
import { getEventDetailedInfo } from '../../controller/vip-controller';
import { getAvailableVIPTables, getVenueBottles } from '../../controller/vip-controller';
import './vip-table-setup-page.css';

export const VIPTableSetupPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);
  const [tables, setTables] = useState<VIPTable[]>([]);
  const [bottles, setBottles] = useState<VIPBottle[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTable, setSelectedTable] = useState<VIPTable | null>(null);
  const [selectedBottle, setSelectedBottle] = useState<VIPBottle | null>(null);
  const [guestCount, setGuestCount] = useState(4);
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');

  useEffect(() => {
    if (!eventId) return;

    getEventDetailedInfo(eventId)
      .then(event => {
        setEventInfo(event);
        
        const venueId = event.custome_location?.id;
        
        if (!venueId) {
          throw new Error('Venue ID not found in event data');
        }
        
        return Promise.all([
          getAvailableVIPTables(eventId),
          getVenueBottles(venueId)
        ]);
      })
      .then(([tablesResponse, bottlesResponse]) => {
        setTables(tablesResponse.tables);
        setBottles(bottlesResponse.bottles);
        if (bottlesResponse.bottles.length > 0) {
          setSelectedBottle(bottlesResponse.bottles[0]);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading VIP data:', error);
        setLoading(false);
      });
  }, [eventId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleConfirm = () => {
    if (!selectedTable || !selectedBottle) return;

    const pricePerPerson = selectedTable.min_spend / guestCount;
    
    navigate(`/event/${eventId}/vip/payment`, {
      state: {
        table: selectedTable,
        bottle: selectedBottle,
        guestCount,
        organizerName,
        organizerEmail,
        organizerPhone,
        pricePerPerson,
        totalPrice: selectedTable.min_spend
      }
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="vip-setup-wrapper">
          <div className="vip-setup-loading">
            <div className="vip-setup-loading-spinner"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const perks = [
    { threshold: 4, description: '1 premium bottle + 6 mixers included', active: guestCount >= 4 },
    { threshold: 6, description: 'Complimentary round of shots', active: guestCount >= 6 },
    { threshold: 8, description: 'Priority table location upgrade', active: guestCount >= 8 },
    { threshold: 10, description: 'Second bottle at 50% off', active: guestCount >= 10 }
  ];

  return (
    <Layout>
      <div className="vip-setup-wrapper">
        <div 
          className="vip-setup-bg-blur"
          style={{ backgroundImage: `url(${eventInfo?.event_img})` }}
        />
        <div className="vip-setup-bg-overlay" />

        <div className="vip-setup-content">
          <div className="vip-setup-container">
            <button onClick={handleBack} className="vip-setup-back-button">
              <ChevronLeft />
              Back to Event
            </button>

            <div className="vip-setup-header">
              <h1 className="vip-setup-title">VIP Table Setup</h1>
              <p className="vip-setup-subtitle">{eventInfo?.event_name}</p>
            </div>

            <div className="vip-setup-grid">
              <div className="vip-setup-left">
                <section className="vip-setup-section">
                  <TableMapSelector
                    tables={tables}
                    selectedTable={selectedTable}
                    onSelect={setSelectedTable}
                  />
                </section>

                <section className="vip-setup-section">
                  <BottleSelector
                    bottles={bottles}
                    selectedBottle={selectedBottle}
                    onSelect={setSelectedBottle}
                  />
                </section>

                <section className="vip-setup-section">
                  <div className="vip-setup-card">
                    <h3 className="vip-setup-card-title">
                      <Users />
                      Organizer Information
                    </h3>
                    
                    <div className="vip-setup-form">
                      <div className="vip-setup-form-group">
                        <label>
                          <Users />
                          Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={organizerName}
                          onChange={(e) => setOrganizerName(e.target.value)}
                        />
                      </div>

                      <div className="vip-setup-form-row">
                        <div className="vip-setup-form-group">
                          <label>
                            <Mail />
                            Email
                          </label>
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={organizerEmail}
                            onChange={(e) => setOrganizerEmail(e.target.value)}
                          />
                        </div>

                        <div className="vip-setup-form-group">
                          <label>
                            <Phone />
                            Phone
                          </label>
                          <input
                            type="tel"
                            placeholder="+34 600 000 000"
                            value={organizerPhone}
                            onChange={(e) => setOrganizerPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="vip-setup-form-group">
                        <label>
                          <Users />
                          Number of Guests
                        </label>
                        <div className="vip-setup-quantity-controls">
                          <button
                            onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                            disabled={guestCount <= 1}
                          >
                            −
                          </button>
                          <span>{guestCount}</span>
                          <button
                            onClick={() => setGuestCount(Math.min(selectedTable?.capacity || 12, guestCount + 1))}
                            disabled={guestCount >= (selectedTable?.capacity || 12)}
                          >
                            +
                          </button>
                        </div>
                        <p className="vip-setup-form-helper">
                          Each person will receive their own payment link
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="vip-setup-right">
                <div className="vip-setup-summary">
                  <h3 className="vip-setup-summary-title">Your Selection</h3>

                  <div className="vip-setup-summary-item">
                    <span>Table</span>
                    <span>
                      {selectedTable 
                        ? `${selectedTable.table_number} · ${selectedTable.zone}`
                        : 'Not selected'
                      }
                    </span>
                  </div>

                  {selectedTable && (
                    <div className="vip-setup-summary-item">
                      <span>Capacity</span>
                      <span>{selectedTable.capacity} people</span>
                    </div>
                  )}

                  <div className="vip-setup-summary-divider" />

                  <div className="vip-setup-summary-item">
                    <span>Bottle</span>
                    <span>{selectedBottle?.name || 'Not selected'}</span>
                  </div>

                  <div className="vip-setup-summary-item">
                    <span>Guests</span>
                    <span>{guestCount} people</span>
                  </div>

                  <div className="vip-setup-summary-divider" />

                  <div className="vip-setup-summary-item vip-setup-summary-total">
                    <span>Total</span>
                    <span>€{selectedTable?.min_spend.toFixed(2) || '0.00'}</span>
                  </div>

                  <div className="vip-setup-summary-item">
                    <span>Per person</span>
                    <span>
                      €{selectedTable 
                        ? (selectedTable.min_spend / guestCount).toFixed(2)
                        : '0.00'
                      }
                    </span>
                  </div>

                  <div className="vip-setup-perks">
                    <h4>Unlock Perks</h4>
                    {perks.map((perk, index) => (
                      <div 
                        key={index}
                        className={`vip-setup-perk ${perk.active ? 'active' : ''}`}
                      >
                        <div className="vip-setup-perk-threshold">
                          {perk.threshold}+ people
                        </div>
                        <div className="vip-setup-perk-description">
                          {perk.description}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleConfirm}
                    disabled={!selectedTable || !selectedBottle || !organizerName || !organizerEmail}
                    className="vip-setup-confirm-button"
                  >
                    Continue to Payment
                  </button>

                  <p className="vip-setup-summary-note">
                    No payment required yet. You'll split the cost with your group.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};