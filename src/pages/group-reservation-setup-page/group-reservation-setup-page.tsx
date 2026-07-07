import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart, User, AlertCircle, Wine, X, GlassWater, Check, Search, SlidersHorizontal } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import { EventInfoCard } from '../../components/event-info-card/event-info-card';
import { UserDetailsForm } from '../../components/user-details-form/user-details-form';
import { CustomDropdown } from '../../components/custom-dropdown/custom-dropdown';
import type { EventDetailedInfo, VIPBottle, VIPMixer, TicketType } from '../../types/types';
import { getEventDetailedInfo, getTicketTypes } from '../../controller/event-controller';
import { getAvailableBottles, getAvailableMixers } from '../../controller/group-reservation-controller';
import './group-reservation-setup-page.css';

interface BottleSelection {
  bottle: VIPBottle;
  quantity: number;
  mixer?: VIPMixer; // One mixer per bottle (required when bottle selected)
}

const SERVICE_FEE_PERCENTAGE = 0.112; // 11.2%

export const GroupReservationSetupPage = () => {
  const { eventId, lang } = useParams<{ eventId: string; lang: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('group');
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [bottles, setBottles] = useState<VIPBottle[]>([]);
  const [mixers, setMixers] = useState<VIPMixer[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic prices from group ticket type
  const groupTicket = ticketTypes.find(t => t.is_group);
  const hasGenderPricing = groupTicket?.has_gender_pricing ?? false;
  const MEN_PRICE = hasGenderPricing ? (groupTicket?.male_price ?? 0) : (groupTicket?.ticket_price ?? 0);
  const WOMEN_PRICE = hasGenderPricing ? (groupTicket?.female_price ?? 0) : (groupTicket?.ticket_price ?? 0);
  const currencySymbol = groupTicket?.currency === 'USD' ? '$' : groupTicket?.currency === 'EUR' ? '€' : 'Q';

  // Dynamic min/max guests from ticket type
  const MIN_GUESTS = groupTicket?.min_quantity || 4;
  const MAX_GUESTS = groupTicket?.max_quantity || 30;

  // Bottle filters
  const [bottleTypeFilter, setBottleTypeFilter] = useState<string>('all');
  const [bottleSearchFilter, setBottleSearchFilter] = useState<string>('');

  // Organizer form ref
  const organizerFormRef = useRef<{ submit: (onSubmit: (data: any) => void) => void }>(null);

  // Gender state (separate for pricing display - UserDetailsForm will handle the form value)
  const [gender, setGender] = useState<'male' | 'female' | ''>('');

  // Additional guests (beyond the organizer)
  const [additionalMen, setAdditionalMen] = useState(0);
  const [additionalWomen, setAdditionalWomen] = useState(0);
  const [selectedBottles, setSelectedBottles] = useState<BottleSelection[]>([]);

  // Carousel state
  const [bottleCarouselIndex, setBottleCarouselIndex] = useState(0);

  // Mixer selection modal
  const [mixerModalOpen, setMixerModalOpen] = useState(false);
  const [mixerModalBottleId, setMixerModalBottleId] = useState<string | null>(null);

  // Gender validation error
  const [genderError, setGenderError] = useState<string>('');

  // Reservation metadata (optional — defaults applied on submit if empty)
  const [reservationName, setReservationName] = useState<string>('');
  const [reservationDescription, setReservationDescription] = useState<string>('');

  useEffect(() => {
    if (!eventId) return;

    const loadData = async () => {
      try {
        // First load event info
        const event = await getEventDetailedInfo(eventId);
        setEventInfo(event);

        // Then load ticket types
        const tickets = await getTicketTypes(eventId);
        setTicketTypes(tickets);

        // Load bottles and mixers using venue slug from event
        const venueSlug = event.venue_slug || (event as any).slug_venue;
        if (venueSlug) {
          try {
            const [bottlesData, mixersData] = await Promise.all([
              getAvailableBottles(venueSlug),
              getAvailableMixers(venueSlug)
            ]);
            setBottles(bottlesData || []);
            setMixers(mixersData || []);
          } catch {
            // Continue without bottles/mixers - they're optional
            setBottles([]);
            setMixers([]);
          }
        } else {
          setBottles([]);
          setMixers([]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading group reservation data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [eventId]);

  const getTotalGuests = () => {
    // Organizer (1) + additional guests
    return gender ? 1 + additionalMen + additionalWomen : 0;
  };

  const getTotalMen = () => {
    return (gender === 'male' ? 1 : 0) + additionalMen;
  };

  const getTotalWomen = () => {
    return (gender === 'female' ? 1 : 0) + additionalWomen;
  };

  const calculateEntriesTotal = () => {
    const totalMen = getTotalMen();
    const totalWomen = getTotalWomen();
    return (totalMen * MEN_PRICE) + (totalWomen * WOMEN_PRICE);
  };

  const calculateBottlesTotal = () => {
    return selectedBottles.reduce((sum, b) => sum + (b.bottle.price * b.quantity), 0);
  };

  const calculateSubtotal = () => {
    return calculateEntriesTotal() + calculateBottlesTotal();
  };

  const calculateServiceFee = () => {
    return calculateSubtotal() * SERVICE_FEE_PERCENTAGE;
  };

  const calculateGrandTotal = () => {
    return calculateSubtotal() + calculateServiceFee();
  };

  // Check if all selected bottles have a mixer assigned
  const allBottlesHaveMixers = () => {
    if (selectedBottles.length === 0) return true;
    if (mixers.length === 0) return true; // If no mixers available, skip validation
    return selectedBottles.every(b => b.mixer !== undefined);
  };

  // Get bottles without mixer for display
  const getBottlesWithoutMixer = () => {
    return selectedBottles.filter(b => !b.mixer);
  };

  const handleAddBottle = (bottle: VIPBottle) => {
    const existing = selectedBottles.find(b => b.bottle.id === bottle.id);
    if (existing) {
      setSelectedBottles(selectedBottles.map(b =>
        b.bottle.id === bottle.id ? { ...b, quantity: b.quantity + 1 } : b
      ));
    } else {
      setSelectedBottles([...selectedBottles, { bottle, quantity: 1 }]);
    }
  };

  const handleRemoveBottle = (bottleId: string) => {
    const existing = selectedBottles.find(b => b.bottle.id === bottleId);
    if (existing && existing.quantity > 1) {
      setSelectedBottles(selectedBottles.map(b =>
        b.bottle.id === bottleId ? { ...b, quantity: b.quantity - 1 } : b
      ));
    } else {
      setSelectedBottles(selectedBottles.filter(b => b.bottle.id !== bottleId));
    }
  };

  // Open mixer selection modal for a specific bottle
  const openMixerModal = (bottleId: string) => {
    setMixerModalBottleId(bottleId);
    setMixerModalOpen(true);
  };

  // Close mixer modal
  const closeMixerModal = () => {
    setMixerModalOpen(false);
    setMixerModalBottleId(null);
  };

  // Select a mixer for a bottle
  const handleSelectMixer = (mixer: VIPMixer) => {
    if (!mixerModalBottleId) return;
    setSelectedBottles(selectedBottles.map(b =>
      b.bottle.id === mixerModalBottleId ? { ...b, mixer } : b
    ));
    closeMixerModal();
  };

  // Remove mixer from a bottle
  const handleRemoveMixer = (bottleId: string) => {
    setSelectedBottles(selectedBottles.map(b =>
      b.bottle.id === bottleId ? { ...b, mixer: undefined } : b
    ));
  };

  // Carousel navigation
  const handleBottleCarouselPrev = () => {
    setBottleCarouselIndex(prev => Math.max(0, prev - 1));
  };

  const handleBottleCarouselNext = () => {
    const filtered = getFilteredBottles();
    setBottleCarouselIndex(prev => Math.min(filtered.length - 2, prev + 1));
  };

  // Filter bottles by type and search
  const getFilteredBottles = () => {
    let filtered = bottles;

    // Filter by type
    if (bottleTypeFilter !== 'all') {
      filtered = filtered.filter(b => b.type?.toLowerCase() === bottleTypeFilter.toLowerCase());
    }

    // Filter by search
    if (bottleSearchFilter) {
      const search = bottleSearchFilter.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(search) ||
        b.brand?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  // Get unique bottle types for filter
  const getBottleTypes = (): string[] => {
    const types = new Set(bottles.map(b => b.type).filter((t): t is string => typeof t === 'string' && t.length > 0));
    return Array.from(types);
  };

  const handleContinue = () => {
    const totalGuests = getTotalGuests();
    const totalMen = getTotalMen();
    const totalWomen = getTotalWomen();

    // Validate guest count first
    if (!gender) {
      setGenderError(t('setup.selectGender'));
      return;
    }

    if (totalGuests < MIN_GUESTS) {
      alert(t('setup.minGuests', { count: MIN_GUESTS }));
      return;
    }

    if (totalGuests > MAX_GUESTS) {
      alert(t('setup.maxGuests', { count: MAX_GUESTS }));
      return;
    }

    // Validate all bottles have mixers selected
    if (selectedBottles.length > 0 && mixers.length > 0 && !allBottlesHaveMixers()) {
      const bottlesWithoutMixer = getBottlesWithoutMixer();
      alert(`${t('setup.selectMixerRequired')}: ${bottlesWithoutMixer.map(b => b.bottle.name).join(', ')}`);
      return;
    }

    // Validate and submit organizer form
    organizerFormRef.current?.submit((formData) => {
      const organizer = formData.usuarios[0];

      navigate(buildUrl(`/event/${eventId}/group/guests`), {
        state: {
          eventInfo,
          guestCount: totalGuests,
          menCount: totalMen,
          womenCount: totalWomen,
          menPrice: MEN_PRICE,
          womenPrice: WOMEN_PRICE,
          hasGenderPricing,
          currency: groupTicket?.currency || 'GTQ',
          currencySymbol,
          groupTicketId: groupTicket?.ticket_type_id,
          selectedBottles,
          totalBottlesCost: calculateBottlesTotal(),
          organizerData: {
            name: organizer.owner_name,
            last_name: organizer.owner_last_name,
            email: organizer.owner_email,
            phone: organizer.owner_phone,
            phone_prefix: organizer.owner_phone_prefix,
            birth_date: organizer.owner_birthdate,
            gender: organizer.owner_gender
          },
          // Optional reservation metadata — defaults applied if empty.
          reservationName: reservationName.trim() ||
            `Mesa de ${organizer.owner_name || 'la noche'}`,
          reservationDescription: reservationDescription.trim() ||
            `Reserva grupal para ${eventInfo?.event_name || 'el evento'} — ${totalGuests} personas.`,
        }
      });
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="group-setup-wrapper">
          <div
            className="group-setup-bg-blur"
            style={{ backgroundImage: eventInfo?.event_img ? `url(${eventInfo.event_img})` : undefined }}
          />
          <div className="group-setup-bg-overlay" />
          <div className="group-setup-content">
            <div className="group-setup-loading">
              <div className="group-setup-loading-spinner"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const totalGuests = getTotalGuests();
  const totalMen = getTotalMen();
  const totalWomen = getTotalWomen();
  const canContinue = gender && totalGuests >= MIN_GUESTS && totalGuests <= MAX_GUESTS && allBottlesHaveMixers();

  return (
    <Layout>
      <div className="group-setup-wrapper">
        <div
          className="group-setup-bg-blur"
          style={{ backgroundImage: `url(${eventInfo?.event_img})` }}
        />
        <div className="group-setup-bg-overlay" />

        <div className="group-setup-content">
          <div className="group-setup-container">
            <EventInfoCard eventInfo={eventInfo} />

            <div className="group-setup-grid">
              <div className="group-setup-left">
                {/* Section 1: Organizer Details - Using UserDetailsForm */}
                <div className="organizer-form-wrapper">
                  <UserDetailsForm
                    ref={organizerFormRef}
                    quantity={1}
                    minAge={eventInfo?.min_age}
                    customTitle={t('setup.organizerDetails')}
                    sectionNumber={1}
                    onGenderChange={(g) => { setGender(g as 'male' | 'female'); setGenderError(''); }}
                  />
                  {genderError && <p className="user-form-error" style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>{genderError}</p>}
                </div>

                {/* Section 2: Group Configuration - Guests + Bottles */}
                <div className="user-details-form">
                  <h4>
                    <span className="user-details-form-number">2</span>
                    {t('setup.groupConfiguration')}
                  </h4>
                  <div className="sep"></div>

                  {/* Reservation metadata — optional. Backend applies defaults
                      when blank ("Mesa de {organizador}" + autogenerated
                      description). Lives inside section 2 to inherit its
                      form-field input styling. */}
                  <div
                    className="form-content-container"
                    style={{ gridTemplateColumns: '1fr', marginBottom: '1.25rem' }}
                  >
                    <div className="form-field">
                      <label htmlFor="reservation-name">
                        Nombre de la reserva
                        <span style={{ fontSize: '0.75rem', color: 'rgba(167, 139, 250, 0.8)', marginLeft: '0.25rem', fontWeight: 400 }}>
                          (opcional)
                        </span>
                      </label>
                      <input
                        id="reservation-name"
                        type="text"
                        value={reservationName}
                        maxLength={80}
                        placeholder="Ej: Cumpleaños de María"
                        onChange={(e) => setReservationName(e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="reservation-description">
                        Descripción
                        <span style={{ fontSize: '0.75rem', color: 'rgba(167, 139, 250, 0.8)', marginLeft: '0.25rem', fontWeight: 400 }}>
                          (opcional)
                        </span>
                      </label>
                      <textarea
                        id="reservation-description"
                        rows={3}
                        maxLength={240}
                        placeholder="Cuéntale al venue qué celebran, si quieren mesa cerca de la pista, etc."
                        value={reservationDescription}
                        onChange={(e) => setReservationDescription(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1.5px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '0.625rem',
                          color: 'white',
                          fontSize: '0.9375rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          minHeight: '88px',
                          boxSizing: 'border-box',
                          transition: 'all 0.2s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Guest Counters */}
                  <div className="group-config-guests">
                    <div className="group-config-guests-grid">
                      {/* Additional Men */}
                      <div className="group-config-guest-item group-config-guest-men">
                        <div className="group-config-guest-label">
                          <User size={16} />
                          <span>{t('setup.men')}</span>
                          <span className="group-config-guest-price">{currencySymbol}{MEN_PRICE}</span>
                        </div>
                        <div className="ticket-counter ticket-counter-men">
                          <button
                            onClick={() => setAdditionalMen(Math.max(0, additionalMen - 1))}
                            className="ticket-counter-btn"
                            disabled={additionalMen === 0}
                          >
                            <Minus size={18} />
                          </button>
                          <span className="ticket-counter-value">{gender === 'male' ? additionalMen + 1 : additionalMen}</span>
                          <button
                            onClick={() => setAdditionalMen(additionalMen + 1)}
                            className="ticket-counter-btn"
                            disabled={totalGuests >= MAX_GUESTS}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        {gender === 'male' && <span className="group-config-includes-you">{t('setup.includesYou')}</span>}
                      </div>

                      {/* Additional Women */}
                      <div className="group-config-guest-item group-config-guest-women">
                        <div className="group-config-guest-label">
                          <User size={16} />
                          <span>{t('setup.women')}</span>
                          <span className="group-config-guest-price">{currencySymbol}{WOMEN_PRICE}</span>
                        </div>
                        <div className="ticket-counter ticket-counter-women">
                          <button
                            onClick={() => setAdditionalWomen(Math.max(0, additionalWomen - 1))}
                            className="ticket-counter-btn"
                            disabled={additionalWomen === 0}
                          >
                            <Minus size={18} />
                          </button>
                          <span className="ticket-counter-value">{gender === 'female' ? additionalWomen + 1 : additionalWomen}</span>
                          <button
                            onClick={() => setAdditionalWomen(additionalWomen + 1)}
                            className="ticket-counter-btn"
                            disabled={totalGuests >= MAX_GUESTS}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        {gender === 'female' && <span className="group-config-includes-you">{t('setup.includesYou')}</span>}
                      </div>
                    </div>

                    {totalGuests > 0 && totalGuests < MIN_GUESTS && (
                      <div className="group-setup-warning-box">
                        <AlertCircle size={18} />
                        <span>{t('setup.minGuests', { count: MIN_GUESTS })} {t('setup.moreNeeded', { count: MIN_GUESTS - totalGuests })}</span>
                      </div>
                    )}
                    {totalGuests > MAX_GUESTS && (
                      <div className="group-setup-error-box">
                        <AlertCircle size={18} />
                        <span>{t('setup.maxGuests', { count: MAX_GUESTS })}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottles Section */}
                  {bottles.length > 0 && (
                    <>
                      <div className="group-config-bottles-header">
                        <Wine size={20} />
                        <span>{t('setup.addBottles')}</span>
                        <span className="group-config-bottles-optional">{t('setup.optional')}</span>
                      </div>

                      {/* Filters */}
                      <div className="group-setup-beverage-filters">
                        <div className="group-setup-filter-search">
                          <Search size={18} className="group-setup-filter-icon" />
                          <input
                            type="text"
                            placeholder={t('setup.searchBottles')}
                            value={bottleSearchFilter}
                            onChange={(e) => {
                              setBottleSearchFilter(e.target.value);
                              setBottleCarouselIndex(0);
                            }}
                            className="group-setup-search-input"
                          />
                        </div>
                        <CustomDropdown
                          value={bottleTypeFilter}
                          onChange={(value) => {
                            setBottleTypeFilter(value);
                            setBottleCarouselIndex(0);
                          }}
                          options={[
                            { value: 'all', label: t('setup.allTypes') },
                            ...getBottleTypes().map(type => ({ value: type, label: type }))
                          ]}
                          icon={<SlidersHorizontal size={16} />}
                        />
                      </div>

                      {getFilteredBottles().length === 0 ? (
                        <div className="group-setup-no-results">
                          <Wine size={48} />
                          <p>{t('setup.noBottlesFound')}</p>
                        </div>
                      ) : (
                        <div className="group-setup-carousel">
                          <button
                            onClick={handleBottleCarouselPrev}
                            disabled={bottleCarouselIndex === 0}
                            className="group-setup-carousel-btn prev"
                          >
                            <ChevronLeft size={24} />
                          </button>

                          <div className="group-setup-carousel-content">
                            <div
                              className="group-setup-carousel-track"
                              style={{ transform: `translateX(-${bottleCarouselIndex * (100 / 2)}%)` }}
                            >
                              {getFilteredBottles().map(bottle => {
                                const selected = selectedBottles.find(b => b.bottle.id === bottle.id);
                                return (
                                  <div key={bottle.id} className={`group-setup-bottle-card-small ${selected ? 'selected' : ''}`}>
                                    <div className="group-setup-bottle-top-row">
                                      <div className="group-setup-bottle-image-wrapper-small">
                                        {bottle.image ? (
                                          <img src={bottle.image} alt={bottle.name} className="group-setup-bottle-image-small" />
                                        ) : (
                                          <div className="group-setup-bottle-placeholder-small">
                                            <Wine size={36} />
                                          </div>
                                        )}
                                      </div>
                                      <div className="group-setup-bottle-info-small">
                                        <h4>{bottle.name}</h4>
                                        {bottle.brand && <p className="group-setup-bottle-brand-small">{bottle.brand}</p>}
                                        <p className="group-setup-bottle-price-small">{currencySymbol}{bottle.price.toFixed(2)}</p>
                                      </div>
                                    </div>

                                    <div className="group-setup-bottle-bottom-row">
                                      <span className="group-setup-bottle-type-badge-small">
                                        {bottle.type || '—'}
                                      </span>
                                      {selected ? (
                                        <div className="group-setup-bottle-controls-small">
                                          <button onClick={() => handleRemoveBottle(bottle.id)} className="group-setup-bottle-btn-small minus">
                                            <Minus size={14} />
                                          </button>
                                          <span className="group-setup-bottle-quantity-small">{selected.quantity}</span>
                                          <button onClick={() => handleAddBottle(bottle)} className="group-setup-bottle-btn-small plus">
                                            <Plus size={14} />
                                          </button>
                                        </div>
                                      ) : (
                                        <button onClick={() => handleAddBottle(bottle)} className="group-setup-add-bottle-btn-small">
                                          <Plus size={14} />
                                          {t('setup.add')}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <button
                            onClick={handleBottleCarouselNext}
                            disabled={bottleCarouselIndex >= getFilteredBottles().length - 2}
                            className="group-setup-carousel-btn next"
                          >
                            <ChevronRight size={24} />
                          </button>
                        </div>
                      )}

                      {/* Selected Bottles Summary with Mixer Selection */}
                      {selectedBottles.length > 0 && mixers.length > 0 && (
                        <div className="group-setup-selected-bottles-summary">
                          <h5>{t('setup.selectedBottles')} <span className="form-field-required">*</span></h5>
                          {!allBottlesHaveMixers() && (
                            <div className="group-setup-warning-box" style={{ marginBottom: '1rem' }}>
                              <AlertCircle size={18} />
                              <span>{t('setup.selectMixerRequired')}</span>
                            </div>
                          )}
                          <div className="group-setup-selected-bottles-list">
                            {selectedBottles.map((selection) => (
                              <div key={selection.bottle.id} className="group-setup-selected-bottle-item">
                                <div className="group-setup-selected-bottle-info">
                                  <span className="group-setup-selected-bottle-name">
                                    {selection.bottle.name}
                                  </span>
                                  <span className="group-setup-selected-bottle-qty">
                                    x{selection.quantity}
                                  </span>
                                </div>
                                <div className="group-setup-selected-bottle-mixer">
                                  {selection.mixer ? (
                                    <div className="group-setup-selected-mixer">
                                      <GlassWater size={14} />
                                      <span className="group-setup-selected-mixer-name">{selection.mixer.name}</span>
                                      <button
                                        onClick={() => openMixerModal(selection.bottle.id)}
                                        className="group-setup-change-mixer-btn"
                                      >
                                        {t('setup.change')}
                                      </button>
                                      <button
                                        onClick={() => handleRemoveMixer(selection.bottle.id)}
                                        className="group-setup-remove-mixer-btn"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => openMixerModal(selection.bottle.id)}
                                      className="group-setup-select-mixer-btn group-setup-select-mixer-btn-required"
                                    >
                                      <AlertCircle size={14} />
                                      {t('setup.selectMixer')} *
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Side - Summary */}
              <div className="group-setup-right">
                <div className="group-receipt">
                  <div className="group-receipt-card">
                    <div className="group-receipt-header">
                      <h3 className="group-receipt-title">{t('summary.title')}</h3>
                      <ShoppingCart className="group-receipt-icon" />
                    </div>

                    {gender && (
                      <>
                        <div className="group-receipt-items">
                          {totalMen > 0 && (
                            <div className="group-receipt-item">
                              <div className="group-receipt-item-info">
                                <div className="group-receipt-item-name">{t('summary.menEntry')}</div>
                                <div className="group-receipt-item-quantity">{totalMen}x {totalMen > 1 ? t('summary.tickets') : t('summary.ticket')}</div>
                              </div>
                              <div className="group-receipt-item-price">
                                <div className="group-receipt-item-amount">{currencySymbol}{(totalMen * MEN_PRICE).toFixed(2)}</div>
                              </div>
                            </div>
                          )}
                          {totalWomen > 0 && (
                            <div className="group-receipt-item">
                              <div className="group-receipt-item-info">
                                <div className="group-receipt-item-name">{t('summary.womenEntry')}</div>
                                <div className="group-receipt-item-quantity">{totalWomen}x {totalWomen > 1 ? t('summary.tickets') : t('summary.ticket')}</div>
                              </div>
                              <div className="group-receipt-item-price">
                                <div className="group-receipt-item-amount">{currencySymbol}{(totalWomen * WOMEN_PRICE).toFixed(2)}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedBottles.length > 0 && (
                          <div className="group-receipt-items">
                            {selectedBottles.map(b => (
                              <div key={b.bottle.id} className="group-receipt-item">
                                <div className="group-receipt-item-info">
                                  <div className="group-receipt-item-name">{b.bottle.name}</div>
                                  <div className="group-receipt-item-quantity">{b.quantity}x {b.quantity > 1 ? t('summary.bottles') : t('summary.bottle')}</div>
                                </div>
                                <div className="group-receipt-item-price">
                                  <div className="group-receipt-item-amount">{currencySymbol}{(b.bottle.price * b.quantity).toFixed(2)}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="group-receipt-divider" />

                        <div className="group-receipt-totals">
                          <div className="group-receipt-subtotal">
                            <span>{t('summary.subtotal')}</span>
                            <span>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
                          </div>
                          <div className="group-receipt-fee">
                            <span>{t('summary.serviceFee')}</span>
                            <span>{currencySymbol}{calculateServiceFee().toFixed(2)}</span>
                          </div>
                          <div className="group-receipt-total">
                            <span>{t('summary.total')}</span>
                            <span className="group-receipt-total-amount">{currencySymbol}{calculateGrandTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {!gender && (
                      <p className="group-receipt-placeholder">
                        {t('summary.fillDetails')}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleContinue}
                    className="group-receipt-button"
                    disabled={!canContinue}
                  >
                    {t('summary.continueToGuests')}
                    <ChevronRight className="group-receipt-button-icon" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mixer Selection Modal */}
      {mixerModalOpen && (
        <div className="mixer-modal-overlay" onClick={closeMixerModal}>
          <div className="mixer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mixer-modal-header">
              <h3>
                <GlassWater size={20} />
                {t('setup.selectMixer')}
              </h3>
              <button onClick={closeMixerModal} className="mixer-modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="mixer-modal-subtitle">
              {mixerModalBottleId && (
                <span>{t('setup.for')}: {selectedBottles.find(b => b.bottle.id === mixerModalBottleId)?.bottle.name}</span>
              )}
            </div>

            <div className="mixer-modal-grid">
              {mixers.filter(m => m.is_available).map(mixer => {
                const currentBottle = selectedBottles.find(b => b.bottle.id === mixerModalBottleId);
                const isSelected = currentBottle?.mixer?.id === mixer.id;

                return (
                  <div
                    key={mixer.id}
                    className={`mixer-modal-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectMixer(mixer)}
                  >
                    <div className="mixer-modal-item-image">
                      {mixer.image ? (
                        <img src={mixer.image} alt={mixer.name} />
                      ) : (
                        <div className="mixer-modal-item-placeholder">
                          <GlassWater size={24} />
                        </div>
                      )}
                      {isSelected && (
                        <div className="mixer-modal-item-check">
                          <Check size={16} />
                        </div>
                      )}
                    </div>
                    <div className="mixer-modal-item-info">
                      <span className="mixer-modal-item-name">{mixer.name}</span>
                      <span className="mixer-modal-item-free">{t('setup.free')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
