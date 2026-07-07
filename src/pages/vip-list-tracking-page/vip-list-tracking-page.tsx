import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  MapPin,
  Star,
  Wine,
  CreditCard,
  X,
  AlertCircle,
  Lock,
  ShoppingCart,
  Shirt,
  UserCheck,
  PartyPopper,
  Flame,
  Target,
  TrendingUp
} from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import { PhonePrefixSelector } from '../../components/phone-prefix-selector/phone-prefix-selector';
import { BirthDatePicker } from '../../components/birth-date-picker/birth-date-picker';
import {
  getVIPListByTrackingCode,
  rsvpToVIPList,
  findGuestByEmail,
  type VIPListReservation,
  type VIPListStats,
  type VIPListTrackingGuest
} from '../../controller/vip-list-controller';
import { validateVIPCode } from '../../utils/security';
import './vip-list-tracking-page.css';

export const VIPListTrackingPage = () => {
  const { lang, trackingCode: rawTrackingCode } = useParams<{ lang: string; trackingCode: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation('viplist');

  // SECURITY: Validate tracking code format
  const trackingCode = useMemo(() => validateVIPCode(rawTrackingCode), [rawTrackingCode]);

  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const [reservation, setReservation] = useState<VIPListReservation | null>(null);
  const [stats, setStats] = useState<VIPListStats | null>(null);
  const [guests, setGuests] = useState<VIPListTrackingGuest[]>([]);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // RSVP form state
  const [showRSVPForm, setShowRSVPForm] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpUserName, setRsvpUserName] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    phone: '',
    phone_prefix: '+502',
    birth_date: '',
    gender: ''
  });

  // Find payment form state
  const [findPaymentEmail, setFindPaymentEmail] = useState('');
  const [findPaymentLoading, setFindPaymentLoading] = useState(false);
  const [findPaymentError, setFindPaymentError] = useState<string | null>(null);

  // Check for success parameter on mount
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'rsvp') {
      setSuccessMessage(t('tracking.successBanner.rsvpComplete'));
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setSuccessMessage(null), 8000);
    } else if (success === 'payment') {
      setSuccessMessage(t('tracking.successBanner.paymentComplete'));
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => setSuccessMessage(null), 8000);
    }
  }, [searchParams, setSearchParams, t]);

  useEffect(() => {
    if (!trackingCode) return;

    const fetchReservation = async () => {
      try {
        const data = await getVIPListByTrackingCode(trackingCode);
        setReservation(data.reservation);
        setStats(data.stats);
        setGuests(data.guests || []);
        if (data.reservation?.events?.image) {
          setEventImage(data.reservation.events.image);
        }
        setLoading(false);
      } catch {
        setError(t('tracking.errors.loadFailed'));
        setLoading(false);
      }
    };

    fetchReservation();
    const interval = setInterval(fetchReservation, 15000);
    return () => clearInterval(interval);
  }, [trackingCode, t]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDeadline = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return t('tracking.deadline.expired');

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return t('tracking.deadline.daysRemaining', { days });
    }
    return t('tracking.deadline.hoursRemaining', { hours, minutes });
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      'EUR': '\u20ac',
      'USD': '$',
      'GTQ': 'Q',
      'MXN': '$',
      'GBP': '\u00a3'
    };
    return symbols[currency] || currency || 'Q';
  };

  const handleRSVPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservation) return;

    // Check if email already exists in guests list
    const emailLower = formData.email.toLowerCase().trim();
    const existingGuest = guests.find(g => g.email?.toLowerCase().trim() === emailLower);
    if (existingGuest) {
      setRsvpError(t('tracking.errors.emailAlreadyRegistered'));
      return;
    }

    setRsvpSubmitting(true);
    setRsvpError(null);

    try {
      await rsvpToVIPList(reservation.id, formData);
      setRsvpUserName(formData.name);
      setRsvpSuccess(true);
      setShowRSVPForm(false);
      // Refresh reservation data including guests
      const data = await getVIPListByTrackingCode(trackingCode!);
      setReservation(data.reservation);
      setStats(data.stats);
      setGuests(data.guests || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setRsvpError(error.response?.data?.error || t('tracking.errors.rsvpFailed'));
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const handleFindPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackingCode || !findPaymentEmail) {
      return;
    }

    setFindPaymentLoading(true);
    setFindPaymentError(null);

    try {
      const result = await findGuestByEmail(trackingCode, findPaymentEmail);

      if (result.success && result.guest_id) {
        const targetUrl = buildUrl(`/vip/pay/${result.guest_id}`);
        navigate(targetUrl);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; already_paid?: boolean } } };
      if (error.response?.data?.already_paid) {
        setFindPaymentError(t('tracking.findPayment.alreadyPaid'));
      } else {
        setFindPaymentError(error.response?.data?.error || t('tracking.findPayment.notFound'));
      }
    } finally {
      setFindPaymentLoading(false);
    }
  };

  // Format time to show only hours and minutes (remove seconds)
  const formatTime = (time: string | undefined) => {
    if (!time) return '';
    // Handle formats like "22:00:00" or "22:00"
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return time;
  };

  // Get event data (handle nested structure from API)
  const getEventName = () => reservation?.events?.name || reservation?.event_name || 'Event';
  const getEventDate = () => reservation?.events?.event_date || reservation?.event_date || '';
  const getStartTime = () => formatTime(reservation?.events?.start_time);
  const getEndTime = () => formatTime(reservation?.events?.end_time);
  const getDressCode = () => reservation?.events?.dress_code;
  const getMinAge = () => reservation?.events?.min_age;
  const getVenueName = () => reservation?.events?.venues?.name || reservation?.venue_name || '';
  const getVenueLocation = () => reservation?.events?.venues?.location || '';

  // Get reservation title (with fallback)
  const getReservationTitle = () => {
    if (reservation?.reservation_name) return reservation.reservation_name;
    const tableType = reservation?.table_or_bar === 'table' ? t('tracking.type.table') : t('tracking.type.bar');
    return `${tableType} - ${getEventName()}`;
  };

  // Get reservation description (with fallback)
  const getReservationDescription = () => {
    if (reservation?.description) return reservation.description;
    return t('tracking.defaultDescription');
  };

  const currencySymbol = reservation ? getCurrencySymbol(reservation.currency) : 'Q';

  if (loading) {
    return (
      <Layout>
        <div className="viptrack-wrapper">
          <div className="viptrack-bg-blur" />
          <div className="viptrack-bg-overlay" />
          <div className="viptrack-content">
            <div className="viptrack-loading">
              <div className="viptrack-loading-spinner" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !reservation) {
    return (
      <Layout>
        <div className="viptrack-wrapper">
          <div className="viptrack-bg-blur" />
          <div className="viptrack-bg-overlay" />
          <div className="viptrack-content">
            <div className="viptrack-error">
              <XCircle size={48} />
              <h2>{error || t('tracking.errors.notFound')}</h2>
              <button onClick={() => navigate(buildUrl('/venues'))} className="viptrack-error-btn">
                {t('tracking.backToHome')}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const isOpen = reservation.status === 'open';
  const isClosed = reservation.status === 'closed';
  const isCompleted = reservation.status === 'completed';
  const confirmedCount = stats?.confirmed_total || 0;
  const expectedTotal = (reservation.expected_men || 0) + (reservation.expected_women || 0);
  const confirmedMen = stats?.confirmed_men || 0;
  const confirmedWomen = stats?.confirmed_women || 0;

  // Check if gender quotas are full
  const menQuotaFull = confirmedMen >= (reservation.expected_men || 0);
  const womenQuotaFull = confirmedWomen >= (reservation.expected_women || 0);
  const allQuotasFull = menQuotaFull && womenQuotaFull;

  // Gender-based pricing
  const malePrice = stats?.male_price || 0;
  const femalePrice = stats?.female_price || 0;
  const malePriceWithFee = stats?.male_price_with_fee || 0;
  const femalePriceWithFee = stats?.female_price_with_fee || 0;

  // Get selected price based on gender selection in form
  const getSelectedPrice = () => {
    if (formData.gender === 'male') return malePriceWithFee;
    if (formData.gender === 'female') return femalePriceWithFee;
    return 0;
  };

  const getSelectedBasePrice = () => {
    if (formData.gender === 'male') return malePrice;
    if (formData.gender === 'female') return femalePrice;
    return 0;
  };

  // Calculate consumables total (base prices without fees go to consumables)
  const totalConsumables = (confirmedMen * malePrice) + (confirmedWomen * femalePrice);
  const maxConsumables = ((reservation?.expected_men || 0) * malePrice) + ((reservation?.expected_women || 0) * femalePrice);
  const consumablesProgress = maxConsumables > 0 ? (totalConsumables / maxConsumables) * 100 : 0;

  return (
    <Layout>
      <div className="viptrack-wrapper">
        <div
          className="viptrack-bg-blur"
          style={eventImage ? { backgroundImage: `url(${eventImage})` } : undefined}
        />
        <div className="viptrack-bg-overlay" />

        <div className="viptrack-content">
          <div className="viptrack-container">

            {/* Header */}
            <header className="viptrack-header">
              <div className="viptrack-header-content">
                {eventImage && (
                  <div className="viptrack-event-image">
                    <img src={eventImage} alt={getEventName()} />
                  </div>
                )}
                <div className="viptrack-header-text">
                  <div className="viptrack-header-top">
                    <div className="viptrack-vip-badge">
                      <Star size={12} />
                      <span>VIP LIST</span>
                    </div>
                    <span className="viptrack-type-tag">{t(`tracking.type.${reservation.table_or_bar}`)}</span>
                  </div>
                  <h1 className="viptrack-title">
                    {reservation.reservation_name || t(`tracking.defaultTitle.${reservation.table_or_bar}`, { host: reservation.host_name })}
                  </h1>
                  <p className="viptrack-event-name">{getEventName()}</p>
                  <div className="viptrack-event-details">
                    <span className="viptrack-detail-item">
                      <Calendar size={14} />
                      {formatDate(getEventDate())}
                    </span>
                    {getStartTime() && (
                      <span className="viptrack-detail-item">
                        <Clock size={14} />
                        {getStartTime()}{getEndTime() && ` - ${getEndTime()}`}
                      </span>
                    )}
                    {(getVenueName() || getVenueLocation()) && (
                      <span className="viptrack-detail-item">
                        <MapPin size={14} />
                        {getVenueName()}{getVenueName() && getVenueLocation() && ' · '}{getVenueLocation()}
                      </span>
                    )}
                    {getDressCode() && (
                      <span className="viptrack-detail-item">
                        <Shirt size={14} />
                        {getDressCode()}
                      </span>
                    )}
                    {getMinAge() && (
                      <span className="viptrack-detail-item">
                        <UserCheck size={14} />
                        +{getMinAge()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Success Message Banner */}
            {successMessage && (
              <div className="viptrack-banner viptrack-banner-success">
                <PartyPopper size={22} />
                <div>
                  <h3>{t('tracking.successBanner.allDone')}</h3>
                  <p>{successMessage}</p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="viptrack-banner-close"
                  aria-label="Dismiss"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* RSVP Success Celebration */}
            {rsvpSuccess && (
              <div className="viptrack-celebration">
                <div className="viptrack-confetti">
                  <span className="viptrack-confetti-piece">🎉</span>
                  <span className="viptrack-confetti-piece">🍾</span>
                  <span className="viptrack-confetti-piece">🥂</span>
                  <span className="viptrack-confetti-piece">✨</span>
                  <span className="viptrack-confetti-piece">🎊</span>
                  <span className="viptrack-confetti-piece">🍾</span>
                  <span className="viptrack-confetti-piece">🥂</span>
                  <span className="viptrack-confetti-piece">🎉</span>
                </div>
                <div className="viptrack-celebration-content">
                  <div className="viptrack-celebration-icon">
                    <PartyPopper size={32} />
                  </div>
                  <h3 className="viptrack-celebration-title">
                    {t('tracking.celebration.thanks', { name: rsvpUserName || t('tracking.celebration.guest') })}
                  </h3>
                  <p className="viptrack-celebration-subtitle">{t('tracking.celebration.youAdded')}</p>
                  <div className="viptrack-celebration-amount">
                    <span className="viptrack-celebration-plus">+</span>
                    <span className="viptrack-celebration-value">{currencySymbol}{(formData.gender === 'male' ? malePrice : femalePrice).toFixed(0)}</span>
                  </div>
                  <p className="viptrack-celebration-total">
                    {t('tracking.celebration.nowHave')} <strong>{currencySymbol}{totalConsumables.toFixed(0)}</strong> {t('tracking.celebration.inConsumables')}
                  </p>
                  <button
                    onClick={() => setRsvpSuccess(false)}
                    className="viptrack-celebration-close"
                  >
                    {t('tracking.celebration.awesome')}
                  </button>
                </div>
              </div>
            )}

            {/* Status Banners */}
            {isOpen && (
              <div className="viptrack-banner viptrack-banner-open">
                <CheckCircle size={22} />
                <div>
                  <h3>{t('tracking.statusBanner.open')}</h3>
                  <p>{t('tracking.statusBanner.openDesc')}</p>
                </div>
              </div>
            )}

            {/* Consumables Widget - Eye-catching */}
            {isOpen && (
              <div className="viptrack-consumables-widget">
                <div className="viptrack-consumables-widget-top">
                  <div className="viptrack-consumables-widget-left">
                    <div className="viptrack-consumables-widget-icon">
                      <Wine size={20} />
                    </div>
                    <div className="viptrack-consumables-widget-info">
                      <span className="viptrack-consumables-widget-label">{t('tracking.consumables.title')}</span>
                      <span className="viptrack-consumables-widget-amount">{currencySymbol}{totalConsumables.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="viptrack-consumables-widget-contributions">
                    <div className="viptrack-consumables-contribution-item">
                      <span className="viptrack-contribution-gender">{t('tracking.men')}</span>
                      <span className="viptrack-contribution-value">+{currencySymbol}{malePrice.toFixed(0)}</span>
                    </div>
                    <div className="viptrack-consumables-contribution-item">
                      <span className="viptrack-contribution-gender">{t('tracking.women')}</span>
                      <span className="viptrack-contribution-value">+{currencySymbol}{femalePrice.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
                <div className="viptrack-consumables-widget-progress-section">
                  <div className="viptrack-consumables-widget-progress-bar">
                    <div
                      className="viptrack-consumables-widget-progress-fill"
                      style={{ width: `${Math.min(consumablesProgress, 100)}%` }}
                    >
                      <div className="viptrack-progress-shine" />
                    </div>
                  </div>
                  <div className="viptrack-consumables-widget-progress-info">
                    <div className="viptrack-consumables-widget-progress-left">
                      <Flame size={16} className="viptrack-flame-icon" />
                      <span className="viptrack-consumables-widget-percent">{consumablesProgress.toFixed(0)}%</span>
                    </div>
                    <div className="viptrack-consumables-widget-progress-right">
                      <Target size={14} />
                      <span>{t('tracking.consumables.goal')}: {currencySymbol}{maxConsumables.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
                <div className="viptrack-consumables-cta">
                  <TrendingUp size={14} />
                  <span>{t('tracking.consumables.joinCta')}</span>
                </div>
              </div>
            )}

            {isClosed && reservation.payment_deadline && (
              <div className="viptrack-banner viptrack-banner-closed">
                <AlertCircle size={22} />
                <div>
                  <h3>{t('tracking.statusBanner.closed')}</h3>
                  <p>{t('tracking.statusBanner.closedDesc', { deadline: formatDeadline(reservation.payment_deadline) })}</p>
                  <span className="viptrack-deadline-remaining">{getTimeRemaining(reservation.payment_deadline)}</span>
                </div>
              </div>
            )}

            {/* Payment Progress Widget - When list is closed */}
            {isClosed && (
              <motion.div
                className="viptrack-payment-progress-widget"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <div className="viptrack-payment-progress-header">
                  <Wine size={18} />
                  <div className="viptrack-payment-progress-titles">
                    <h3>{t('tracking.paymentProgress.title')}</h3>
                    <span className="viptrack-payment-progress-subtitle">{t('tracking.paymentProgress.subtitle')}</span>
                  </div>
                  <motion.span
                    className="viptrack-payment-progress-badge"
                    key={stats?.paid_count}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {stats?.paid_count || 0}/{confirmedCount}
                  </motion.span>
                </div>

                {/* Money Transfer Animation */}
                <div className="viptrack-money-flow">
                  {/* Source Wallet (Goal) */}
                  <motion.div
                    className="viptrack-wallet viptrack-wallet-source"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <div className="viptrack-wallet-icon">
                      <span style={{ fontSize: '20px' }}>🍾</span>
                    </div>
                    <div className="viptrack-wallet-info">
                      <span className="viptrack-wallet-label">{t('tracking.paymentProgress.expected')}</span>
                      <span className="viptrack-wallet-amount">{currencySymbol}{totalConsumables.toFixed(0)}</span>
                    </div>
                  </motion.div>

                  {/* Animated Money Bags */}
                  <div className="viptrack-money-stream">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="viptrack-money-particle"
                        initial={{ x: -18, opacity: 0, scale: 0.6 }}
                        animate={{
                          x: [-18, -5, 5, 18],
                          opacity: [0, 1, 1, 0],
                          scale: [0.6, 1, 1, 0.6],
                        }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          repeatDelay: 5.6,
                          delay: i * 2.8,
                          ease: 'linear',
                          times: [0, 0.3, 0.7, 1],
                        }}
                      >
                        💰
                      </motion.div>
                    ))}
                  </div>

                  {/* Destination Wallet (Pot) */}
                  <motion.div
                    className="viptrack-wallet viptrack-wallet-dest"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <motion.div
                      className="viptrack-wallet-icon viptrack-wallet-icon-active"
                      animate={{
                        boxShadow: ['0 0 0 0 rgba(139, 92, 246, 0.4)', '0 0 0 8px rgba(139, 92, 246, 0)', '0 0 0 0 rgba(139, 92, 246, 0)']
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span style={{ fontSize: '20px' }}>🍾</span>
                    </motion.div>
                    <div className="viptrack-wallet-info">
                      <span className="viptrack-wallet-label">{t('tracking.paymentProgress.collected')}</span>
                      <motion.span
                        className="viptrack-wallet-amount viptrack-amount-green"
                        key={(stats?.paid_count || 0)}
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        {currencySymbol}{((stats?.paid_count || 0) > 0
                          ? guests.filter(g => g.paid_at).reduce((sum, g) => sum + (g.gender === 'male' ? malePrice : femalePrice), 0)
                          : 0).toFixed(0)}
                      </motion.span>
                    </div>
                  </motion.div>
                </div>

                {/* Progress Bar with Animation */}
                <div className="viptrack-payment-progress-bar-section">
                  <div className="viptrack-payment-progress-bar">
                    <motion.div
                      className="viptrack-payment-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${confirmedCount > 0 ? ((stats?.paid_count || 0) / confirmedCount) * 100 : 0}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    >
                      <div className="viptrack-payment-progress-shine" />
                    </motion.div>
                  </div>
                  <div className="viptrack-payment-progress-info">
                    <span className="viptrack-payment-progress-text">
                      {t('tracking.paymentProgress.paidOf', { paid: stats?.paid_count || 0, total: confirmedCount })}
                    </span>
                    <motion.span
                      className="viptrack-payment-progress-percent"
                      key={stats?.paid_count}
                      initial={{ scale: 1.2, color: '#c4b5fd' }}
                      animate={{ scale: 1, color: '#a78bfa' }}
                      transition={{ duration: 0.3 }}
                    >
                      {confirmedCount > 0 ? Math.round(((stats?.paid_count || 0) / confirmedCount) * 100) : 0}%
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            )}

            {isCompleted && (
              <div className="viptrack-banner viptrack-banner-completed">
                <Lock size={22} />
                <div>
                  <h3>{t('tracking.statusBanner.completed')}</h3>
                  <p>{t('tracking.statusBanner.completedDesc')}</p>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="viptrack-two-columns">
              {/* Left: Info & RSVP Form */}
              <section className="viptrack-section viptrack-column-left">

                {/* Reservation Info Card */}
                <div className="viptrack-info-card">
                  <div className="viptrack-info-header">
                    <Wine size={20} />
                    <span className="viptrack-type-label">
                      {reservation.table_or_bar === 'table' ? t('tracking.type.table') : t('tracking.type.bar')}
                    </span>
                  </div>
                  <h2 className="viptrack-info-title">{getReservationTitle()}</h2>
                  <p className="viptrack-info-desc">{getReservationDescription()}</p>
                </div>

                {/* Guest List Card */}
                <div className="viptrack-guests-card">
                  <div className="viptrack-guests-header">
                    <Users size={18} />
                    <h3>{t('tracking.guestList')}</h3>
                    <span className="viptrack-guests-count-badge">{guests.length}</span>
                  </div>

                  <div className="viptrack-guests-list">
                    {guests.map((guest) => {
                      const guestContribution = guest.gender === 'male' ? malePrice : femalePrice;
                      return (
                        <div key={guest.id} className="viptrack-guest-item">
                          <div className="viptrack-guest-avatar">
                            {guest.added_by === 'host' ? (
                              <Star size={14} />
                            ) : (
                              <UserCheck size={14} />
                            )}
                          </div>
                          <span className="viptrack-guest-name">
                            {guest.name} {guest.last_name}
                            {guest.added_by === 'host' && (
                              <span className="viptrack-host-badge">{t('tracking.hostBadge')}</span>
                            )}
                          </span>
                          <span className="viptrack-guest-contribution">
                            +{currencySymbol}{guestContribution.toFixed(0)}
                          </span>
                          {isClosed && (
                            <span className={`viptrack-payment-badge ${guest.paid_at ? 'paid' : 'unpaid'}`}>
                              {guest.paid_at ? (
                                <>
                                  <CheckCircle size={12} />
                                  {t('tracking.paid')}
                                </>
                              ) : (
                                <>
                                  <Clock size={12} />
                                  {t('tracking.pending')}
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isClosed && (
                    <div className="viptrack-paid-count">
                      <span className="viptrack-paid-icon">
                        <CreditCard size={16} />
                      </span>
                      <span>{t('tracking.peoplePaid', { count: stats?.paid_count || 0 })}</span>
                    </div>
                  )}
                </div>

                {/* Find My Payment Section - Only when list is closed */}
                {isClosed && (
                  <div className="viptrack-find-payment">
                    <div className="viptrack-find-payment-header">
                      <CreditCard size={20} />
                      <h3>{t('tracking.findPayment.title')}</h3>
                    </div>
                    <p className="viptrack-find-payment-desc">{t('tracking.findPayment.description')}</p>

                    <form onSubmit={handleFindPayment} className="viptrack-find-payment-form">
                      {findPaymentError && (
                        <div className="viptrack-rsvp-error">
                          <AlertCircle size={16} />
                          {findPaymentError}
                        </div>
                      )}
                      <div className="viptrack-find-payment-row">
                        <input
                          type="email"
                          value={findPaymentEmail}
                          onChange={(e) => setFindPaymentEmail(e.target.value)}
                          placeholder={t('tracking.findPayment.emailPlaceholder')}
                          required
                        />
                        <button type="submit" className="viptrack-find-payment-btn" disabled={findPaymentLoading || !findPaymentEmail}>
                          {findPaymentLoading ? (
                            <div className="viptrack-btn-spinner" />
                          ) : (
                            t('tracking.findPayment.button')
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* RSVP Section */}
                {isOpen && !rsvpSuccess && (
                  <div className="viptrack-rsvp-section">
                    {allQuotasFull ? (
                      <div className="viptrack-quota-full-message">
                        <Lock size={24} />
                        <h3>{t('tracking.rsvp.listFull')}</h3>
                        <p>{t('tracking.rsvp.listFullDesc')}</p>
                      </div>
                    ) : !showRSVPForm ? (
                      <button
                        onClick={() => setShowRSVPForm(true)}
                        className="viptrack-rsvp-btn"
                      >
                        <Users size={20} />
                        {t('tracking.rsvp.joinButton')}
                      </button>
                    ) : (
                      <form onSubmit={handleRSVPSubmit} className="viptrack-rsvp-form">
                        <div className="viptrack-rsvp-header">
                          <Users size={20} />
                          <h3 className="viptrack-rsvp-title">{t('tracking.rsvp.title')}</h3>
                        </div>

                        {rsvpError && (
                          <div className="viptrack-rsvp-error">
                            <AlertCircle size={16} />
                            {rsvpError}
                          </div>
                        )}

                        <div className="viptrack-form-row">
                          <div className="viptrack-form-group">
                            <label>{t('tracking.rsvp.name')} <span className="viptrack-required">*</span></label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                              placeholder={t('tracking.rsvp.namePlaceholder')}
                            />
                          </div>
                          <div className="viptrack-form-group">
                            <label>{t('tracking.rsvp.lastName')} <span className="viptrack-required">*</span></label>
                            <input
                              type="text"
                              value={formData.last_name}
                              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                              required
                              placeholder={t('tracking.rsvp.lastNamePlaceholder')}
                            />
                          </div>
                        </div>

                        <div className="viptrack-form-group">
                          <label>{t('tracking.rsvp.email')} <span className="viptrack-required">*</span></label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder={t('tracking.rsvp.emailPlaceholder')}
                          />
                        </div>

                        <div className="viptrack-form-group">
                          <label>{t('tracking.rsvp.phone')} <span className="viptrack-required">*</span></label>
                          <div className="viptrack-phone-input">
                            <PhonePrefixSelector
                              value={formData.phone_prefix}
                              onChange={(prefix) => setFormData({ ...formData, phone_prefix: prefix })}
                            />
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder={t('tracking.rsvp.phonePlaceholder')}
                              required
                            />
                          </div>
                        </div>

                        <div className="viptrack-form-row">
                          <div className="viptrack-form-group">
                            <label>{t('tracking.rsvp.birthDate')} <span className="viptrack-required">*</span></label>
                            <BirthDatePicker
                              value={formData.birth_date}
                              onChange={(value) => setFormData({ ...formData, birth_date: value })}
                              placeholder={t('tracking.rsvp.birthDatePlaceholder')}
                            />
                          </div>

                          <div className="viptrack-form-group">
                            <label>{t('tracking.rsvp.gender')} <span className="viptrack-required">*</span></label>
                            <div className="viptrack-gender-options">
                              <button
                                type="button"
                                className={`viptrack-gender-btn ${formData.gender === 'male' ? 'active' : ''} ${menQuotaFull ? 'disabled' : ''}`}
                                onClick={() => !menQuotaFull && setFormData({ ...formData, gender: 'male' })}
                                disabled={menQuotaFull}
                              >
                                {t('tracking.rsvp.male')}
                              </button>
                              <button
                                type="button"
                                className={`viptrack-gender-btn ${formData.gender === 'female' ? 'active' : ''} ${womenQuotaFull ? 'disabled' : ''}`}
                                onClick={() => !womenQuotaFull && setFormData({ ...formData, gender: 'female' })}
                                disabled={womenQuotaFull}
                              >
                                {t('tracking.rsvp.female')}
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={rsvpSubmitting || !formData.gender || !formData.phone || !formData.birth_date}
                          className="viptrack-rsvp-submit"
                        >
                          {rsvpSubmitting ? (
                            <div className="viptrack-btn-spinner" />
                          ) : (
                            t('tracking.rsvp.confirm')
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Already RSVP'd message */}
                {rsvpSuccess && isOpen && (
                  <div className="viptrack-rsvp-done">
                    <CheckCircle size={24} />
                    <h3>{t('tracking.rsvp.doneTitle')}</h3>
                    <p>{t('tracking.rsvp.doneMessage')}</p>
                  </div>
                )}
              </section>

              {/* Right: Order Summary & Progress */}
              <div className="viptrack-column-right">
                {/* Order Summary Card */}
                <div className="viptrack-order-summary">
                  <div className="viptrack-order-header">
                    <ShoppingCart size={20} />
                    <h2>{t('tracking.orderSummary.title')}</h2>
                  </div>

                  {/* Price per Gender with Fee Breakdown */}
                  <div className="viptrack-pricing-section">
                    <div className="viptrack-pricing-breakdown">
                      {/* Men Price Breakdown */}
                      <div className="viptrack-pricing-column">
                        <span className="viptrack-pricing-gender-label">{t('tracking.orderSummary.menPrice')}</span>
                        <div className="viptrack-pricing-detail">
                          <span className="viptrack-pricing-detail-label">
                            <Wine size={12} />
                            {t('tracking.orderSummary.consumables')}
                          </span>
                          <span className="viptrack-pricing-detail-value">{currencySymbol}{malePrice.toFixed(0)}</span>
                        </div>
                        <div className="viptrack-pricing-detail viptrack-pricing-fee">
                          <span className="viptrack-pricing-detail-label">{t('tracking.orderSummary.managementFee')}</span>
                          <span className="viptrack-pricing-detail-value">+{currencySymbol}{(malePriceWithFee - malePrice).toFixed(0)}</span>
                        </div>
                        <div className="viptrack-pricing-total">
                          <span>{t('tracking.orderSummary.total')}</span>
                          <span>{currencySymbol}{malePriceWithFee.toFixed(0)}</span>
                        </div>
                      </div>

                      {/* Women Price Breakdown */}
                      <div className="viptrack-pricing-column">
                        <span className="viptrack-pricing-gender-label">{t('tracking.orderSummary.womenPrice')}</span>
                        <div className="viptrack-pricing-detail">
                          <span className="viptrack-pricing-detail-label">
                            <Wine size={12} />
                            {t('tracking.orderSummary.consumables')}
                          </span>
                          <span className="viptrack-pricing-detail-value">{currencySymbol}{femalePrice.toFixed(0)}</span>
                        </div>
                        <div className="viptrack-pricing-detail viptrack-pricing-fee">
                          <span className="viptrack-pricing-detail-label">{t('tracking.orderSummary.managementFee')}</span>
                          <span className="viptrack-pricing-detail-value">+{currencySymbol}{(femalePriceWithFee - femalePrice).toFixed(0)}</span>
                        </div>
                        <div className="viptrack-pricing-total">
                          <span>{t('tracking.orderSummary.total')}</span>
                          <span>{currencySymbol}{femalePriceWithFee.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Selected Price (when gender selected) */}
                  {formData.gender && showRSVPForm && (
                    <div className="viptrack-selected-price">
                      <div className="viptrack-selected-row">
                        <span>{t('tracking.orderSummary.basePrice')}</span>
                        <span>{currencySymbol}{getSelectedBasePrice().toFixed(2)}</span>
                      </div>
                      <div className="viptrack-selected-row viptrack-fee-row">
                        <span>{t('tracking.orderSummary.serviceFee')}</span>
                        <span>{currencySymbol}{(getSelectedPrice() - getSelectedBasePrice()).toFixed(2)}</span>
                      </div>
                      <div className="viptrack-selected-row viptrack-total-row">
                        <span>{t('tracking.orderSummary.total')}</span>
                        <span>{currencySymbol}{getSelectedPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Card */}
                <div className="viptrack-progress-card">
                  <div className="viptrack-progress-header">
                    <div className="viptrack-progress-info">
                      <h2 className="viptrack-progress-title">
                        {isClosed ? t('tracking.paidTitle') : t('tracking.confirmed')}
                      </h2>
                      <p className="viptrack-progress-subtitle">
                        {isClosed
                          ? t('tracking.guestsPaid', { paid: stats?.paid_count || 0, total: confirmedCount })
                          : t('tracking.guestsConfirmed', { confirmed: confirmedCount, total: expectedTotal })}
                      </p>
                    </div>
                    <div className="viptrack-progress-count">
                      <span className="viptrack-count-big">{isClosed ? (stats?.paid_count || 0) : confirmedCount}</span>
                      <span className="viptrack-count-total">/ {isClosed ? confirmedCount : expectedTotal}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="viptrack-progressbar">
                    <div className="viptrack-progressbar-track">
                      <div
                        className="viptrack-progressbar-fill"
                        style={{ width: `${isClosed
                          ? Math.min(((stats?.paid_count || 0) / confirmedCount) * 100, 100)
                          : Math.min((confirmedCount / expectedTotal) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Gender Breakdown */}
                  <div className="viptrack-gender-stats">
                    <div className="viptrack-gender-stat">
                      <div className="viptrack-gender-stat-header">
                        {isClosed && <CreditCard size={14} className="viptrack-gender-pay-icon" />}
                        <span className="viptrack-gender-label">{t('tracking.men')}</span>
                      </div>
                      <span className="viptrack-gender-value">
                        {isClosed
                          ? `${guests.filter(g => g.gender === 'male' && g.paid_at).length} / ${confirmedMen}`
                          : `${confirmedMen} / ${reservation.expected_men}`}
                      </span>
                    </div>
                    <div className="viptrack-gender-stat">
                      <div className="viptrack-gender-stat-header">
                        {isClosed && <CreditCard size={14} className="viptrack-gender-pay-icon" />}
                        <span className="viptrack-gender-label">{t('tracking.women')}</span>
                      </div>
                      <span className="viptrack-gender-value">
                        {isClosed
                          ? `${guests.filter(g => g.gender === 'female' && g.paid_at).length} / ${confirmedWomen}`
                          : `${confirmedWomen} / ${reservation.expected_women}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};
