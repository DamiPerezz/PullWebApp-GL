import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Ticket, CheckCircle, AlertCircle, Loader, Users, ShoppingCart, ChevronRight } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import type { EventDetailedInfo, VIPBottle } from '../../types/types';
import { createGroupReservation } from '../../controller/group-reservation-controller';
import './group-reservation-guests-page.css';

interface BottleSelection {
  bottle: VIPBottle;
  quantity: number;
  mixers?: any[];
}

interface OrganizerData {
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  phone_prefix?: string;
  birth_date?: string;
  gender: string;
}

interface GuestFormData {
  name: string;
  last_name: string;
  gender: 'male' | 'female';
  host_pays: boolean;
  amount_due: number;
}

interface LocationState {
  eventInfo: EventDetailedInfo;
  guestCount: number;
  menCount: number;
  womenCount: number;
  menPrice: number;
  womenPrice: number;
  selectedBottles: BottleSelection[];
  totalBottlesCost: number;
  organizerData: OrganizerData;
}

export const GroupReservationGuestsPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [menGuests, setMenGuests] = useState<GuestFormData[]>([]);
  const [womenGuests, setWomenGuests] = useState<GuestFormData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state || !state.eventInfo) {
      navigate(`/event/${eventId}`);
      return;
    }

    // Initialize men guests
    const menCount = state.menCount;
    const initialMen: GuestFormData[] = [];

    // Service fee multiplier (11.2%)
    const FEE_MULTIPLIER = 1.112;

    // If organizer is male, add them first
    if (state.organizerData.gender === 'male') {
      initialMen.push({
        name: state.organizerData.name,
        last_name: state.organizerData.last_name,
        gender: 'male',
        host_pays: true, // Organizer always pays for themselves
        amount_due: state.menPrice * FEE_MULTIPLIER // Include 11.2% fee
      });
    }

    // Add remaining men
    for (let i = initialMen.length; i < menCount; i++) {
      initialMen.push({
        name: '',
        last_name: '',
        gender: 'male',
        host_pays: false,
        amount_due: state.menPrice * FEE_MULTIPLIER // Include 11.2% fee
      });
    }

    // Initialize women guests
    const womenCount = state.womenCount;
    const initialWomen: GuestFormData[] = [];

    // If organizer is female, add them first
    if (state.organizerData.gender === 'female') {
      initialWomen.push({
        name: state.organizerData.name,
        last_name: state.organizerData.last_name,
        gender: 'female',
        host_pays: true, // Organizer always pays for themselves
        amount_due: state.womenPrice * FEE_MULTIPLIER // Include 11.2% fee
      });
    }

    // Add remaining women
    for (let i = initialWomen.length; i < womenCount; i++) {
      initialWomen.push({
        name: '',
        last_name: '',
        gender: 'female',
        host_pays: false,
        amount_due: state.womenPrice * FEE_MULTIPLIER // Include 11.2% fee
      });
    }

    setMenGuests(initialMen);
    setWomenGuests(initialWomen);
  }, [state, eventId, navigate]);

  const handleMenGuestChange = (index: number, field: keyof GuestFormData, value: any) => {
    const updatedGuests = [...menGuests];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setMenGuests(updatedGuests);
  };

  const handleWomenGuestChange = (index: number, field: keyof GuestFormData, value: any) => {
    const updatedGuests = [...womenGuests];
    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setWomenGuests(updatedGuests);
  };

  const getHostPaysCount = () => {
    const menHostPays = menGuests.filter(g => g.host_pays).length;
    const womenHostPays = womenGuests.filter(g => g.host_pays).length;
    return menHostPays + womenHostPays;
  };

  const calculateHostPayment = () => {
    const menHostPays = menGuests.filter(g => g.host_pays).length;
    const womenHostPays = womenGuests.filter(g => g.host_pays).length;
    const entriesCost = (menHostPays * state.menPrice) + (womenHostPays * state.womenPrice);
    return entriesCost + (state.totalBottlesCost || 0);
  };

  const calculateTotal = () => {
    const menTotal = state.menCount * state.menPrice;
    const womenTotal = state.womenCount * state.womenPrice;
    const bottlesTotal = state.totalBottlesCost || 0;
    return menTotal + womenTotal + bottlesTotal;
  };

  const calculateServiceFee = () => {
    return calculateHostPayment() * 0.112; // 11.2% service fee on host payment
  };

  const calculateGrandTotal = () => {
    return calculateHostPayment() + calculateServiceFee();
  };

  // Calculate the total amount for the entire reservation (all guests + bottles, all with 11.2% fee)
  const calculateReservationTotal = () => {
    return calculateTotal() * 1.112; // All entries + bottles with 11.2% fee
  };

  const validateForm = () => {
    // Check minimum host pays (at least 4 including organizer)
    const hostPaysCount = getHostPaysCount();
    if (hostPaysCount < 4) {
      setError('You must pay for at least 4 people (including yourself)');
      return false;
    }

    // Validate men (skip first if organizer is male)
    const menStartIndex = state.organizerData.gender === 'male' ? 1 : 0;
    for (let i = menStartIndex; i < menGuests.length; i++) {
      const guest = menGuests[i];
      if (!guest.name || !guest.last_name) {
        setError(`Please complete the details for Man ${i + 1}`);
        return false;
      }
    }

    // Validate women (skip first if organizer is female)
    const womenStartIndex = state.organizerData.gender === 'female' ? 1 : 0;
    for (let i = womenStartIndex; i < womenGuests.length; i++) {
      const guest = womenGuests[i];
      if (!guest.name || !guest.last_name) {
        setError(`Please complete the details for Woman ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Combine all guests with amount_due
      const allGuests = [...menGuests, ...womenGuests].map((guest) => ({
        name: guest.name,
        last_name: guest.last_name,
        gender: guest.gender,
        host_pays: guest.host_pays,
        amount_due: guest.amount_due
      }));

      // Prepare bottles data
      const bottles = state.selectedBottles.map(b => ({
        bottle_id: b.bottle.id,
        quantity: b.quantity
      }));

      // Prepare mixers data (flatten all mixers from all bottles)
      const mixers: any[] = [];
      state.selectedBottles.forEach(b => {
        if (b.mixers && b.mixers.length > 0) {
          b.mixers.forEach(m => {
            mixers.push({
              mixer_id: m.mixer.id,
              quantity: m.quantity
            });
          });
        }
      });

      const requestData = {
        event_slug: state.eventInfo.event_slug || (state.eventInfo as any).slug_id,
        guest_count: state.guestCount,
        organizer_data: state.organizerData,
        guests: allGuests,
        bottles: bottles.length > 0 ? bottles : undefined,
        mixers: mixers.length > 0 ? mixers : undefined,
        total_amount: calculateReservationTotal() // Total for entire reservation with all fees
      };

      const result = await createGroupReservation(requestData);

      // Navigate to confirmation page
      navigate('/group/confirmation', {
        state: {
          success: result.success,
          reservation_id: result.reservation_id,
          management_code: result.management_code,
          payment_link_code: result.payment_link_code,
          total_amount: result.total_amount,
          message: result.message,
          eventInfo: state.eventInfo,
          guestCount: state.guestCount,
          hostPaysCount: getHostPaysCount()
        }
      });

    } catch (error: any) {
      console.error('Error creating reservation:', error);
      setError(error.response?.data?.error || 'Error al crear la reserva. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!state) {
    return null;
  }

  const hostPaysCount = getHostPaysCount();

  return (
    <Layout>
      <div className="guests-page-wrapper">
        <div
          className="guests-page-bg-blur"
          style={{ backgroundImage: `url(${state?.eventInfo?.event_img})` }}
        />
        <div className="guests-page-bg-overlay" />

        <div className="guests-page-content-wrapper">
          <div className="guests-page-container">
            {/* Header */}
            <div className="guests-page-header">
              <div className="guests-page-event-info">
                <h1 className="guests-page-event-title">{state?.eventInfo?.event_name}</h1>
                <p className="guests-page-event-subtitle">
                  Guest Information
                </p>
              </div>
            </div>

            <div className="guests-page-content">
              {/* Error Message */}
              {error && (
                <div className="guests-page-error-box">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {/* Host Pays Counter */}
              <div className="guests-page-counter-box">
                <Users size={20} />
                <span>
                  You will pay for <strong>{hostPaysCount}</strong> of {state.guestCount} people
                </span>
                {hostPaysCount < 4 && (
                  <span className="guests-page-counter-warning">
                    (Minimum 4)
                  </span>
                )}
                {hostPaysCount >= 4 && (
                  <CheckCircle size={16} className="guests-page-counter-check" />
                )}
              </div>

              {/* Men Section */}
              {menGuests.length > 0 && (
                <div className="guests-page-section">
                  <div className="guests-page-section-header guests-page-section-header-men">
                    <Ticket size={24} className="guests-page-section-icon" />
                    <div>
                      <h2 className="guests-page-section-title">
                        Men ({menGuests.length})
                      </h2>
                      <p className="guests-page-section-subtitle">
                        Q{state.menPrice} per person
                      </p>
                    </div>
                  </div>

                  <div className="guests-page-forms">
                    {menGuests.map((guest, index) => {
                      const isOrganizer = index === 0 && state.organizerData.gender === 'male';
                      return (
                        <div key={`man-${index}`} className="guests-page-guest-card">
                          <div className="guests-page-guest-header">
                            <div className="guests-page-guest-title-group">
                              <Ticket size={18} className="guests-page-ticket-icon guests-page-ticket-icon-men" />
                              <h3 className="guests-page-guest-title">
                                {isOrganizer ? 'Organizer (You)' : `Man ${index + 1}`}
                              </h3>
                            </div>
                            <label className="guests-page-host-pays-checkbox">
                              <input
                                type="checkbox"
                                checked={guest.host_pays}
                                onChange={() => handleMenGuestChange(index, 'host_pays', !guest.host_pays)}
                                disabled={isOrganizer}
                              />
                              <span>I pay</span>
                            </label>
                          </div>

                          <div className="guests-page-guest-form">
                            <div className="guests-page-form-row">
                              <div className="guests-page-form-field">
                                <label>First Name <span className="guests-page-required">*</span></label>
                                <input
                                  type="text"
                                  value={guest.name}
                                  onChange={(e) => handleMenGuestChange(index, 'name', e.target.value)}
                                  placeholder="First name"
                                  disabled={isOrganizer}
                                  required
                                />
                              </div>
                              <div className="guests-page-form-field">
                                <label>Last Name <span className="guests-page-required">*</span></label>
                                <input
                                  type="text"
                                  value={guest.last_name}
                                  onChange={(e) => handleMenGuestChange(index, 'last_name', e.target.value)}
                                  placeholder="Last name"
                                  disabled={isOrganizer}
                                  required
                                />
                              </div>
                            </div>

                            {isOrganizer && (
                              <p className="guests-page-organizer-note">
                                You'll receive your entry upon meeting the minimum payment
                              </p>
                            )}

                            {guest.host_pays && !isOrganizer && (
                              <p className="guests-page-organizer-note">
                                This guest only needs to fill in their details to receive their entry
                              </p>
                            )}

                            {!guest.host_pays && !isOrganizer && (
                              <p className="guests-page-payment-note">
                                You'll receive a link to share with this guest to pay their entry (Q{state.menPrice.toFixed(2)})
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Women Section */}
              {womenGuests.length > 0 && (
                <div className="guests-page-section">
                  <div className="guests-page-section-header guests-page-section-header-women">
                    <Ticket size={24} className="guests-page-section-icon" />
                    <div>
                      <h2 className="guests-page-section-title">
                        Women ({womenGuests.length})
                      </h2>
                      <p className="guests-page-section-subtitle">
                        Q{state.womenPrice} per person
                      </p>
                    </div>
                  </div>

                  <div className="guests-page-forms">
                    {womenGuests.map((guest, index) => {
                      const isOrganizer = index === 0 && state.organizerData.gender === 'female';
                      return (
                        <div key={`woman-${index}`} className="guests-page-guest-card">
                          <div className="guests-page-guest-header">
                            <div className="guests-page-guest-title-group">
                              <Ticket size={18} className="guests-page-ticket-icon guests-page-ticket-icon-women" />
                              <h3 className="guests-page-guest-title">
                                {isOrganizer ? 'Organizer (You)' : `Woman ${index + 1}`}
                              </h3>
                            </div>
                            <label className="guests-page-host-pays-checkbox">
                              <input
                                type="checkbox"
                                checked={guest.host_pays}
                                onChange={() => handleWomenGuestChange(index, 'host_pays', !guest.host_pays)}
                                disabled={isOrganizer}
                              />
                              <span>I pay</span>
                            </label>
                          </div>

                          <div className="guests-page-guest-form">
                            <div className="guests-page-form-row">
                              <div className="guests-page-form-field">
                                <label>First Name <span className="guests-page-required">*</span></label>
                                <input
                                  type="text"
                                  value={guest.name}
                                  onChange={(e) => handleWomenGuestChange(index, 'name', e.target.value)}
                                  placeholder="First name"
                                  disabled={isOrganizer}
                                  required
                                />
                              </div>
                              <div className="guests-page-form-field">
                                <label>Last Name <span className="guests-page-required">*</span></label>
                                <input
                                  type="text"
                                  value={guest.last_name}
                                  onChange={(e) => handleWomenGuestChange(index, 'last_name', e.target.value)}
                                  placeholder="Last name"
                                  disabled={isOrganizer}
                                  required
                                />
                              </div>
                            </div>

                            {isOrganizer && (
                              <p className="guests-page-organizer-note">
                                You'll receive your entry upon meeting the minimum payment
                              </p>
                            )}

                            {guest.host_pays && !isOrganizer && (
                              <p className="guests-page-organizer-note">
                                This guest only needs to fill in their details to receive their entry
                              </p>
                            )}

                            {!guest.host_pays && !isOrganizer && (
                              <p className="guests-page-payment-note">
                                You'll receive a link to share with this guest to pay their entry (Q{state.womenPrice.toFixed(2)})
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary Section - Order Summary Style */}
              <div className="guests-page-receipt">
                <div className="guests-page-receipt-card">
                  {/* Header */}
                  <div className="guests-page-receipt-header">
                    <h3 className="guests-page-receipt-title">Payment Summary</h3>
                    <ShoppingCart size={20} className="guests-page-receipt-icon" />
                  </div>

                  {/* Items */}
                  <div className="guests-page-receipt-items">
                    {menGuests.filter(g => g.host_pays).length > 0 && (
                      <div className="guests-page-receipt-item">
                        <div className="guests-page-receipt-item-info">
                          <div className="guests-page-receipt-item-name">Men Entries</div>
                          <div className="guests-page-receipt-item-quantity">{menGuests.filter(g => g.host_pays).length}x entry</div>
                        </div>
                        <div className="guests-page-receipt-item-price">
                          <div className="guests-page-receipt-item-amount">Q{(menGuests.filter(g => g.host_pays).length * state.menPrice).toFixed(2)}</div>
                        </div>
                      </div>
                    )}

                    {womenGuests.filter(g => g.host_pays).length > 0 && (
                      <div className="guests-page-receipt-item">
                        <div className="guests-page-receipt-item-info">
                          <div className="guests-page-receipt-item-name">Women Entries</div>
                          <div className="guests-page-receipt-item-quantity">{womenGuests.filter(g => g.host_pays).length}x entry</div>
                        </div>
                        <div className="guests-page-receipt-item-price">
                          <div className="guests-page-receipt-item-amount">Q{(womenGuests.filter(g => g.host_pays).length * state.womenPrice).toFixed(2)}</div>
                        </div>
                      </div>
                    )}

                    {state.totalBottlesCost > 0 && (
                      <div className="guests-page-receipt-item">
                        <div className="guests-page-receipt-item-info">
                          <div className="guests-page-receipt-item-name">Bottles & Mixers</div>
                          <div className="guests-page-receipt-item-quantity">VIP service</div>
                        </div>
                        <div className="guests-page-receipt-item-price">
                          <div className="guests-page-receipt-item-amount">Q{state.totalBottlesCost.toFixed(2)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="guests-page-receipt-divider" />

                  {/* Totals */}
                  <div className="guests-page-receipt-totals">
                    <div className="guests-page-receipt-subtotal">
                      <span>Subtotal</span>
                      <span>Q{calculateHostPayment().toFixed(2)}</span>
                    </div>
                    <div className="guests-page-receipt-fee">
                      <span>Service Fee</span>
                      <span>Q{calculateServiceFee().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="guests-page-receipt-total">
                    <span>Total to pay now</span>
                    <span className="guests-page-receipt-total-amount">
                      Q{calculateGrandTotal().toFixed(2)}
                    </span>
                  </div>

                  {/* Warning Messages */}
                  <div className="guests-page-notices">
                    {state.guestCount > hostPaysCount && (
                      <p className="guests-page-notice guests-page-notice-warning">
                        <AlertCircle size={16} />
                        <span>You'll receive a link to share with the remaining {state.guestCount - hostPaysCount} guests so they can pay their entry after staff approval</span>
                      </p>
                    )}

                    <p className="guests-page-notice guests-page-notice-success">
                      <CheckCircle size={16} />
                      <span>Your reservation will be sent to staff for approval. You'll receive a confirmation email.</span>
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    className="guests-page-receipt-button"
                    disabled={submitting || hostPaysCount < 4}
                  >
                    {submitting ? (
                      <>
                        <Loader size={18} className="guests-page-btn-spinner" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Submit Reservation
                        <ChevronRight size={18} className="guests-page-receipt-button-icon" />
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
