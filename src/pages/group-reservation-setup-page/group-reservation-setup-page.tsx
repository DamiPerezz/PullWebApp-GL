import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Minus, ShoppingCart, User, AlertCircle, Wine, X, GlassWater, Check } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import { EventInfoCard } from '../../components/event-info-card/event-info-card';
import type { EventDetailedInfo, VIPBottle, VIPMixer, TicketType } from '../../types/types';
import { getEventDetailedInfo, getTicketTypes } from '../../controller/event-controller';
import { getAvailableBottles, getAvailableMixers } from '../../controller/group-reservation-controller';
import { PHONE_PREFIX_OPTIONS } from '../../types/types';
import './group-reservation-setup-page.css';

interface BottleSelection {
  bottle: VIPBottle;
  quantity: number;
  mixer?: VIPMixer; // One mixer per bottle (required when bottle selected)
}

const SERVICE_FEE_PERCENTAGE = 0.112; // 11.2%

export const GroupReservationSetupPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();

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

  // Bottle filters
  const [bottleTypeFilter, setBottleTypeFilter] = useState<string>('all');
  const [bottleSearchFilter, setBottleSearchFilter] = useState<string>('');

  // Organizer data (counts as first entry)
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+502');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState(''); // 'male' or 'female' - organizer's gender

  // Additional guests (beyond the organizer)
  const [additionalMen, setAdditionalMen] = useState(0);
  const [additionalWomen, setAdditionalWomen] = useState(0);
  const [selectedBottles, setSelectedBottles] = useState<BottleSelection[]>([]);

  // Carousel state
  const [bottleCarouselIndex, setBottleCarouselIndex] = useState(0);

  // Mixer selection modal
  const [mixerModalOpen, setMixerModalOpen] = useState(false);
  const [mixerModalBottleId, setMixerModalBottleId] = useState<string | null>(null);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
  const getBottleTypes = () => {
    const types = new Set(bottles.map(b => b.type).filter(Boolean));
    return Array.from(types);
  };

  // Validate organizer form
  const validateOrganizerForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!name?.trim()) {
      errors.name = 'Name is required';
    }

    // Last name validation
    if (!lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Email validation
    if (!email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    // Phone validation
    if (!phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{6,15}$/.test(phone)) {
      errors.phone = 'Phone must be 6-15 digits';
    }

    // Birth date validation
    if (!birthDate?.trim()) {
      errors.birthDate = 'Date of birth is required';
    } else {
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();
      if (birthDateObj > today) {
        errors.birthDate = 'Date cannot be in the future';
      } else if (age < 18) {
        errors.birthDate = 'Must be 18 years or older';
      }
    }

    // Gender validation (already selected in step 1)
    if (!gender) {
      errors.gender = 'Gender is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear error when user types
  const clearError = (field: string) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleContinue = () => {
    const totalGuests = getTotalGuests();
    const totalMen = getTotalMen();
    const totalWomen = getTotalWomen();

    // Validate form
    if (!validateOrganizerForm()) {
      return;
    }

    if (totalGuests < 4) {
      alert('Minimum 4 guests required for group reservation');
      return;
    }

    if (totalGuests > 30) {
      alert('Maximum 30 guests allowed');
      return;
    }

    // Validate all bottles have mixers selected
    if (selectedBottles.length > 0 && mixers.length > 0 && !allBottlesHaveMixers()) {
      const bottlesWithoutMixer = getBottlesWithoutMixer();
      alert(`Please select a mixer for: ${bottlesWithoutMixer.map(b => b.bottle.name).join(', ')}`);
      return;
    }

    navigate(`/event/${eventId}/group/guests`, {
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
          name,
          last_name: lastName,
          email,
          phone,
          phone_prefix: phonePrefix,
          birth_date: birthDate,
          gender
        }
      }
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
  const canContinue = name && lastName && email && gender && totalGuests >= 4 && totalGuests <= 30 && allBottlesHaveMixers();

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
            {/* Timeline - At the Top */}
            <div className="group-setup-steps">
              <div className="group-setup-step group-setup-step-active">
                <div className="group-setup-step-number">1</div>
                <div className="group-setup-step-label">Configuration</div>
              </div>
              <div className="group-setup-step-line"></div>
              <div className="group-setup-step">
                <div className="group-setup-step-number">2</div>
                <div className="group-setup-step-label">Guest Details</div>
              </div>
              <div className="group-setup-step-line"></div>
              <div className="group-setup-step">
                <div className="group-setup-step-number">3</div>
                <div className="group-setup-step-label">Confirmation</div>
              </div>
            </div>

            {/* Event Details */}
            <EventInfoCard eventInfo={eventInfo} />

            <div className="group-setup-grid">
              <div className="group-setup-left">
                {/* Step 1: Organizer Gender Selection (First Entry) */}
                <div className="user-details-form">
                  <h4>
                    <span className="user-details-form-number">1</span>
                    Organizer (Your Entry)
                  </h4>
                  <div className="sep"></div>

                  <div className="form-content-container">
                    <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                      <label>
                        <User size={14} style={{ marginRight: '0.25rem' }} />
                        Select your gender <span className="form-field-required">*</span>
                      </label>
                      <div className="organizer-gender-selection">
                        <div
                          className={`organizer-gender-option ${gender === 'male' ? 'selected' : ''}`}
                          onClick={() => setGender('male')}
                        >
                          <div className="organizer-gender-radio">
                            {gender === 'male' && <div className="organizer-gender-radio-dot" />}
                          </div>
                          <div className="organizer-gender-info">
                            <span className="organizer-gender-label">Men</span>
                            <span className="organizer-gender-price">{currencySymbol}{MEN_PRICE}</span>
                          </div>
                        </div>
                        <div
                          className={`organizer-gender-option ${gender === 'female' ? 'selected' : ''}`}
                          onClick={() => setGender('female')}
                        >
                          <div className="organizer-gender-radio">
                            {gender === 'female' && <div className="organizer-gender-radio-dot" />}
                          </div>
                          <div className="organizer-gender-info">
                            <span className="organizer-gender-label">Women</span>
                            <span className="organizer-gender-price">{currencySymbol}{WOMEN_PRICE}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {gender && (
                    <p className="group-setup-helper-text" style={{ marginTop: '1rem' }}>
                      Your entry as organizer is included ({gender === 'male' ? 'Men' : 'Women'} - {currencySymbol}{gender === 'male' ? MEN_PRICE : WOMEN_PRICE})
                    </p>
                  )}
                </div>

                {/* Step 2: Additional Guests */}
                {gender && (
                  <div className="user-details-form">
                    <h4>
                      <span className="user-details-form-number">2</span>
                      Additional Guests
                    </h4>
                    <div className="sep"></div>

                    <div className="form-content-container">
                      {/* Additional Men */}
                      <div className="form-field">
                        <label>
                          <User size={14} style={{ marginRight: '0.25rem' }} />
                          Men <span style={{ color: '#60a5fa', fontSize: '0.875rem' }}>({currencySymbol}{MEN_PRICE} each)</span>
                        </label>
                        <div className="ticket-counter ticket-counter-men">
                          <button
                            onClick={() => setAdditionalMen(Math.max(0, additionalMen - 1))}
                            className="ticket-counter-btn"
                            disabled={additionalMen === 0}
                          >
                            <Minus size={18} />
                          </button>
                          <span className="ticket-counter-value">{additionalMen}</span>
                          <button
                            onClick={() => setAdditionalMen(additionalMen + 1)}
                            className="ticket-counter-btn"
                            disabled={totalGuests >= 30}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Additional Women */}
                      <div className="form-field">
                        <label>
                          <User size={14} style={{ marginRight: '0.25rem' }} />
                          Women <span style={{ color: '#ec4899', fontSize: '0.875rem' }}>({currencySymbol}{WOMEN_PRICE} each)</span>
                        </label>
                        <div className="ticket-counter ticket-counter-women">
                          <button
                            onClick={() => setAdditionalWomen(Math.max(0, additionalWomen - 1))}
                            className="ticket-counter-btn"
                            disabled={additionalWomen === 0}
                          >
                            <Minus size={18} />
                          </button>
                          <span className="ticket-counter-value">{additionalWomen}</span>
                          <button
                            onClick={() => setAdditionalWomen(additionalWomen + 1)}
                            className="ticket-counter-btn"
                            disabled={totalGuests >= 30}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {totalGuests < 4 && (
                      <div className="group-setup-warning-box">
                        <AlertCircle size={18} />
                        <span>Minimum 4 guests required for group reservation ({4 - totalGuests} more needed)</span>
                      </div>
                    )}
                    {totalGuests > 30 && (
                      <div className="group-setup-error-box">
                        <AlertCircle size={18} />
                        <span>Maximum 30 guests allowed</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottles Selection (Optional) */}
                {gender && (
                  <div className="user-details-form">
                    <h4>
                      <span className="user-details-form-number">3</span>
                      <Wine size={20} style={{ marginLeft: '0.5rem' }} />
                      Select Bottles (Optional)
                    </h4>
                    <div className="sep"></div>

                    {bottles.length === 0 ? (
                      <div className="group-setup-no-results">
                        <Wine size={48} />
                        <p>No bottles available for this event</p>
                      </div>
                    ) : (
                      <>
                        {/* Filters */}
                        <div className="group-setup-beverage-filters">
                          <div className="group-setup-filter-search">
                            <input
                              type="text"
                              placeholder="Search by name or brand..."
                              value={bottleSearchFilter}
                              onChange={(e) => {
                                setBottleSearchFilter(e.target.value);
                                setBottleCarouselIndex(0);
                              }}
                              className="group-setup-search-input"
                            />
                          </div>
                          <div className="group-setup-filter-type">
                            <select
                              value={bottleTypeFilter}
                              onChange={(e) => {
                                setBottleTypeFilter(e.target.value);
                                setBottleCarouselIndex(0);
                              }}
                              className="group-setup-type-select"
                            >
                              <option value="all">All types</option>
                              {getBottleTypes().map(type => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {getFilteredBottles().length === 0 ? (
                          <div className="group-setup-no-results">
                            <Wine size={48} />
                            <p>No bottles found with the applied filters</p>
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
                                            Add
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
                            <h5>Selected Bottles <span className="form-field-required">*</span></h5>
                            {!allBottlesHaveMixers() && (
                              <div className="group-setup-warning-box" style={{ marginBottom: '1rem' }}>
                                <AlertCircle size={18} />
                                <span>Please select a mixer for each bottle to continue</span>
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
                                          Change
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
                                        Select Mixer *
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
                )}

                {/* Organizer Information */}
                {gender && (
                  <div className="user-details-form">
                    <h4>
                      <span className="user-details-form-number">4</span>
                      Organizer Information
                    </h4>
                    <div className="sep"></div>

                    <div className="form-content-container">
                      <div className="form-field">
                        <label>
                          Name <span className="form-field-required">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter name"
                          value={name}
                          onChange={(e) => { setName(e.target.value); clearError('name'); }}
                        />
                        {formErrors.name && <p className="user-form-error">{formErrors.name}</p>}
                      </div>

                      <div className="form-field">
                        <label>
                          Last Name <span className="form-field-required">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter last name"
                          value={lastName}
                          onChange={(e) => { setLastName(e.target.value); clearError('lastName'); }}
                        />
                        {formErrors.lastName && <p className="user-form-error">{formErrors.lastName}</p>}
                      </div>

                      <div className="form-row">
                        <div className="form-field">
                          <label>
                            Phone <span className="form-field-required">*</span>
                          </label>
                          <div className="phone-input-container">
                            <div className="phone-prefix-select">
                              <select
                                value={phonePrefix}
                                onChange={(e) => setPhonePrefix(e.target.value)}
                              >
                                {PHONE_PREFIX_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.flag} {option.value}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="phone-number-input">
                              <input
                                type="tel"
                                placeholder="612345678"
                                value={phone}
                                onChange={(e) => { setPhone(e.target.value); clearError('phone'); }}
                              />
                            </div>
                          </div>
                          {formErrors.phone && <p className="user-form-error">{formErrors.phone}</p>}
                        </div>

                        <div className="form-field">
                          <label>
                            Date of Birth <span className="form-field-required">*</span>
                          </label>
                          <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => { setBirthDate(e.target.value); clearError('birthDate'); }}
                            max={new Date().toISOString().split('T')[0]}
                          />
                          {formErrors.birthDate && <p className="user-form-error">{formErrors.birthDate}</p>}
                        </div>
                      </div>

                      <div className="form-field form-field-full">
                        <label>
                          Email <span className="form-field-required">*</span>
                        </label>
                        <input
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                        />
                        {formErrors.email && <p className="user-form-error">{formErrors.email}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Summary */}
              <div className="group-setup-right">
                <div className="group-receipt">
                  <div className="group-receipt-card">
                    <div className="group-receipt-header">
                      <h3 className="group-receipt-title">Order Summary</h3>
                      <ShoppingCart className="group-receipt-icon" />
                    </div>

                    {gender && (
                      <>
                        <div className="group-receipt-items">
                          {totalMen > 0 && (
                            <div className="group-receipt-item">
                              <div className="group-receipt-item-info">
                                <div className="group-receipt-item-name">Men Entry</div>
                                <div className="group-receipt-item-quantity">{totalMen}x {totalMen > 1 ? 'tickets' : 'ticket'}</div>
                              </div>
                              <div className="group-receipt-item-price">
                                <div className="group-receipt-item-amount">{currencySymbol}{(totalMen * MEN_PRICE).toFixed(2)}</div>
                              </div>
                            </div>
                          )}
                          {totalWomen > 0 && (
                            <div className="group-receipt-item">
                              <div className="group-receipt-item-info">
                                <div className="group-receipt-item-name">Women Entry</div>
                                <div className="group-receipt-item-quantity">{totalWomen}x {totalWomen > 1 ? 'tickets' : 'ticket'}</div>
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
                                  <div className="group-receipt-item-quantity">{b.quantity}x bottle{b.quantity > 1 ? 's' : ''}</div>
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
                            <span>Subtotal</span>
                            <span>{currencySymbol}{calculateSubtotal().toFixed(2)}</span>
                          </div>
                          <div className="group-receipt-fee">
                            <span>Service Fee</span>
                            <span>{currencySymbol}{calculateServiceFee().toFixed(2)}</span>
                          </div>
                          <div className="group-receipt-total">
                            <span>Total</span>
                            <span className="group-receipt-total-amount">{currencySymbol}{calculateGrandTotal().toFixed(2)}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {!gender && (
                      <p className="group-receipt-placeholder">
                        Select your gender to see the summary
                      </p>
                    )}

                    <button
                      onClick={handleContinue}
                      className="group-receipt-button"
                      disabled={!canContinue}
                    >
                      Continue to Guest Details
                      <ChevronRight className="group-receipt-button-icon" />
                    </button>
                  </div>
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
                Select Mixer
              </h3>
              <button onClick={closeMixerModal} className="mixer-modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="mixer-modal-subtitle">
              {mixerModalBottleId && (
                <span>For: {selectedBottles.find(b => b.bottle.id === mixerModalBottleId)?.bottle.name}</span>
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
                      <span className="mixer-modal-item-free">Free</span>
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
