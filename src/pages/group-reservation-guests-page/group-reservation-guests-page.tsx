import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Ticket, CheckCircle, AlertCircle, Loader, Users, ShoppingCart, ChevronRight, Info } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import { EventInfoCard } from '../../components/event-info-card/event-info-card';
import type { EventDetailedInfo, VIPBottle } from '../../types/types';
import { createGroupReservation } from '../../controller/group-reservation-controller';
import './group-reservation-guests-page.css';
import { SERVICE_FEE_RATE, SERVICE_FEE_MULTIPLIER } from '../../config/fees';

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
  instagram?: string;
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
  reservationName?: string;
  reservationDescription?: string;
}

export const GroupReservationGuestsPage = () => {
  const { eventId, lang } = useParams<{ eventId: string; lang: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { t, i18n } = useTranslation('group');
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const [menGuests, setMenGuests] = useState<GuestFormData[]>([]);
  const [womenGuests, setWomenGuests] = useState<GuestFormData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state || !state.eventInfo) {
      navigate(buildUrl(`/event/${eventId}`));
      return;
    }

    // Initialize men guests
    const menCount = state.menCount;
    const initialMen: GuestFormData[] = [];

    // Service fee multiplier (per-venue, see config/fees.ts)
    const FEE_MULTIPLIER = SERVICE_FEE_MULTIPLIER;

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
    return calculateHostPayment() * SERVICE_FEE_RATE; // service fee on host payment
  };

  const calculateGrandTotal = () => {
    return calculateHostPayment() + calculateServiceFee();
  };

  // Calculate the total amount for the entire reservation (all guests + bottles, all with 11.2% fee)
  const calculateReservationTotal = () => {
    return calculateTotal() * SERVICE_FEE_MULTIPLIER; // All entries + bottles with fee
  };

  const validateForm = () => {
    // Check minimum host pays (at least 4 including organizer)
    const hostPaysCount = getHostPaysCount();
    if (hostPaysCount < 4) {
      setError(t('guests.minGuestsRequired', { count: 4 }));
      return false;
    }

    // Validate men (skip first if organizer is male)
    const menStartIndex = state.organizerData.gender === 'male' ? 1 : 0;
    for (let i = menStartIndex; i < menGuests.length; i++) {
      const guest = menGuests[i];
      if (!guest.name || !guest.last_name) {
        setError(t('guests.completeAllDetails'));
        return false;
      }
    }

    // Validate women (skip first if organizer is female)
    const womenStartIndex = state.organizerData.gender === 'female' ? 1 : 0;
    for (let i = womenStartIndex; i < womenGuests.length; i++) {
      const guest = womenGuests[i];
      if (!guest.name || !guest.last_name) {
        setError(t('guests.completeAllDetails'));
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
      // Combine all guests with amount_due (Instagram passes through as
      // optional metadata).
      const allGuests = [...menGuests, ...womenGuests].map((guest) => ({
        name: guest.name,
        last_name: guest.last_name,
        instagram: (guest.instagram || '').trim() || undefined,
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
        total_amount: calculateReservationTotal(), // Total for entire reservation with all fees
        reservation_name: state.reservationName,
        reservation_description: state.reservationDescription,
      };

      const result = await createGroupReservation(requestData);

      // Navigate to confirmation page
      navigate(buildUrl('/group/confirmation'), {
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
            {/* Event Info Card */}
            <EventInfoCard eventInfo={state?.eventInfo} />

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
                <span dangerouslySetInnerHTML={{ __html: t('guests.youWillPay', { count: hostPaysCount, total: state.guestCount }) }} />
                {hostPaysCount < 4 && (
                  <span className="guests-page-counter-warning">
                    {t('guests.minimum', { count: 4 })}
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
                        {t('setup.men')} ({menGuests.length})
                      </h2>
                      <p className="guests-page-section-subtitle">
                        Q{state.menPrice} {t('setup.perPerson')}
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
                                {isOrganizer ? t('guests.organizer') : t('guests.man', { number: index + 1 })}
                              </h3>
                            </div>
                            <label className="guests-page-host-pays-checkbox">
                              <input
                                type="checkbox"
                                checked={guest.host_pays}
                                onChange={() => handleMenGuestChange(index, 'host_pays', !guest.host_pays)}
                                disabled={isOrganizer}
                              />
                              <span>{t('guests.iPay')}</span>
                            </label>
                          </div>

                          <div className="guests-page-guest-form">
                            <div className="guests-page-form-row">
                              <div className="guests-page-form-field">
                                <label>{t('guests.firstName')} <span className="guests-page-required">*</span></label>
                                <input
                                  type="text"
                                  value={guest.name}
                                  onChange={(e) => handleMenGuestChange(index, 'name', e.target.value)}
                                  placeholder={t('guests.firstName')}
                                  disabled={isOrganizer}
                                  required
                                />
                              </div>
                              <div className="guests-page-form-field">
                                <label>{t('guests.lastName')} <span className="guests-page-required">*</span></label>
                                <input
                                  type="text"
                                  value={guest.last_name}
                                  onChange={(e) => handleMenGuestChange(index, 'last_name', e.target.value)}
                                  placeholder={t('guests.lastName')}
                                  disabled={isOrganizer}
                                  required
                                />
                              </div>
                            </div>
                            <div className="guests-page-form-row">
                              <div className="guests-page-form-field" style={{ flex: 1 }}>
                                <label>Instagram <span style={{ color: '#6b6b7b', fontWeight: 400 }}>(opcional)</span></label>
                                <input
                                  type="text"
                                  value={guest.instagram || ''}
                                  onChange={(e) => handleMenGuestChange(index, 'instagram', e.target.value)}
                                  placeholder="@usuario"
                                />
                              </div>
                            </div>

                            {isOrganizer && (
                              <p className="guests-page-organizer-note">
                                {t('guests.organizerNote')}
                              </p>
                            )}

                            {guest.host_pays && !isOrganizer && (
                              <p className="guests-page-organizer-note">
                                {t('guests.guestPaidNote')}
                              </p>
                            )}

                            {!guest.host_pays && !isOrganizer && (
                              <p className="guests-page-payment-note">
                                {t('guests.guestPaymentNote', { price: `Q${state.menPrice.toFixed(2)}` })}
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
                        {t('setup.women')} ({womenGuests.length})
                      </h2>
                      <p className="guests-page-section-subtitle">
                        Q{state.womenPrice} {t('setup.perPerson')}
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
                                {isOrganizer ? t('guests.organizer') : t('guests.woman', { number: index + 1 })}
                              </h3>
                            </div>
                            <label className="guests-page-host-pays-checkbox">
                              <input
                                type="checkbox"
                                checked={guest.host_pays}
                                onChange={() => handleWomenGuestChange(index, 'host_pays', !guest.host_pays)}
                                disabled={isOrganizer}
                              />
                              <span>{t('guests.iPay')}</span>
                            </label>
                          </div>

                          <div className="guests-page-guest-form">
                            <div className="guests-page-form-row">
                              <div className="guests-page-form-field">
                                <label>{t('guests.firstName')} <span className="guests-page-required">*</span></label>
                                <input
                                  type="text"
                                  value={guest.name}
                                  onChange={(e) => handleWomenGuestChange(index, 'name', e.target.value)}
                                  placeholder={t('guests.firstName')}
                                  disabled={isOrganizer}
                                  required
                                />
                              </div>
                              <div className="guests-page-form-field">
                                <label>{t('guests.lastName')} <span className="guests-page-required">*</span></label>
                                <input
                                  type="text"
                                  value={guest.last_name}
                                  onChange={(e) => handleWomenGuestChange(index, 'last_name', e.target.value)}
                                  placeholder={t('guests.lastName')}
                                  disabled={isOrganizer}
                                  required
                                />
                              </div>
                            </div>
                            <div className="guests-page-form-row">
                              <div className="guests-page-form-field" style={{ flex: 1 }}>
                                <label>Instagram <span style={{ color: '#6b6b7b', fontWeight: 400 }}>(opcional)</span></label>
                                <input
                                  type="text"
                                  value={guest.instagram || ''}
                                  onChange={(e) => handleWomenGuestChange(index, 'instagram', e.target.value)}
                                  placeholder="@usuario"
                                />
                              </div>
                            </div>

                            {isOrganizer && (
                              <p className="guests-page-organizer-note">
                                {t('guests.organizerNote')}
                              </p>
                            )}

                            {guest.host_pays && !isOrganizer && (
                              <p className="guests-page-organizer-note">
                                {t('guests.guestPaidNote')}
                              </p>
                            )}

                            {!guest.host_pays && !isOrganizer && (
                              <p className="guests-page-payment-note">
                                {t('guests.guestPaymentNote', { price: `Q${state.womenPrice.toFixed(2)}` })}
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
                {/* Info Message - Above the card */}
                <div className="guests-page-info-box">
                  <Info size={18} className="guests-page-info-icon" />
                  <p>{t('guests.infoMessage')}</p>
                </div>

                <div className="guests-page-receipt-card">
                  {/* Header */}
                  <div className="guests-page-receipt-header">
                    <h3 className="guests-page-receipt-title">{t('guests.paymentSummary')}</h3>
                    <ShoppingCart size={20} className="guests-page-receipt-icon" />
                  </div>

                  {/* Items */}
                  <div className="guests-page-receipt-items">
                    {menGuests.filter(g => g.host_pays).length > 0 && (
                      <div className="guests-page-receipt-item">
                        <div className="guests-page-receipt-item-info">
                          <div className="guests-page-receipt-item-name">{t('guests.menEntries')}</div>
                          <div className="guests-page-receipt-item-quantity">{menGuests.filter(g => g.host_pays).length}x {t('guests.entry')}</div>
                        </div>
                        <div className="guests-page-receipt-item-price">
                          <div className="guests-page-receipt-item-amount">Q{(menGuests.filter(g => g.host_pays).length * state.menPrice).toFixed(2)}</div>
                        </div>
                      </div>
                    )}

                    {womenGuests.filter(g => g.host_pays).length > 0 && (
                      <div className="guests-page-receipt-item">
                        <div className="guests-page-receipt-item-info">
                          <div className="guests-page-receipt-item-name">{t('guests.womenEntries')}</div>
                          <div className="guests-page-receipt-item-quantity">{womenGuests.filter(g => g.host_pays).length}x {t('guests.entry')}</div>
                        </div>
                        <div className="guests-page-receipt-item-price">
                          <div className="guests-page-receipt-item-amount">Q{(womenGuests.filter(g => g.host_pays).length * state.womenPrice).toFixed(2)}</div>
                        </div>
                      </div>
                    )}

                    {state.totalBottlesCost > 0 && (
                      <div className="guests-page-receipt-item">
                        <div className="guests-page-receipt-item-info">
                          <div className="guests-page-receipt-item-name">{t('guests.bottlesAndMixers')}</div>
                          <div className="guests-page-receipt-item-quantity">{t('guests.vipService')}</div>
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
                      <span>{t('summary.subtotal')}</span>
                      <span>Q{calculateHostPayment().toFixed(2)}</span>
                    </div>
                    <div className="guests-page-receipt-fee">
                      <span>{t('summary.serviceFee')}</span>
                      <span>Q{calculateServiceFee().toFixed(2)}</span>
                    </div>

                    <div className="guests-page-receipt-total">
                      <span>{t('guests.totalToPayNow')}</span>
                      <span className="guests-page-receipt-total-amount">
                        Q{calculateGrandTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button - Outside the card */}
                <button
                  onClick={handleSubmit}
                  className="guests-page-receipt-button"
                  disabled={submitting || hostPaysCount < 4}
                >
                  {submitting ? (
                    <>
                      <Loader size={18} className="guests-page-btn-spinner" />
                      {t('guests.processing')}
                    </>
                  ) : (
                    <>
                      {t('guests.submitReservation')}
                      <ChevronRight size={18} className="guests-page-receipt-button-icon" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
