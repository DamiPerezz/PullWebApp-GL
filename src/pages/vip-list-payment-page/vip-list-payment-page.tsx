import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  Clock,
  CreditCard,
  AlertCircle,
  Wine,
  Star,
  Ticket,
  Lock,
  Shield,
  PartyPopper
} from 'lucide-react';
// NOTE: Layout is provided by VenueLayout in App.tsx, no need to import here
import {
  getVIPListGuestForPayment,
  processVIPListPayment,
  type VIPListGuest,
  type VIPListReservation
} from '../../controller/vip-list-controller';
import { validateUUID } from '../../utils/security';
import './vip-list-payment-page.css';

export const VIPListPaymentPage = () => {
  const { lang, guestId: rawGuestId } = useParams<{ lang: string; guestId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('viplist');

  // SECURITY: Validate UUID to prevent injection
  const guestId = useMemo(() => validateUUID(rawGuestId), [rawGuestId]);

  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  const [guest, setGuest] = useState<VIPListGuest | null>(null);
  const [reservation, setReservation] = useState<VIPListReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [ticketCode, setTicketCode] = useState<string | null>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'amex' | 'unknown'>('unknown');

  useEffect(() => {
    if (!guestId) return;

    const fetchData = async () => {
      try {
        const data = await getVIPListGuestForPayment(guestId);
        setGuest(data.guest);
        setReservation(data.reservation);
        setLoading(false);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || t('payment.errors.loadFailed'));
        setLoading(false);
      }
    };

    fetchData();
  }, [guestId, t]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
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

    if (diff <= 0) return null; // Expired

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return { text: t('payment.deadline.daysRemaining', { days }), expired: false };
    }
    return { text: t('payment.deadline.hoursRemaining', { hours, minutes }), expired: false };
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

  // Detect card type from number
  const detectCardType = useCallback((number: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    return 'unknown';
  }, []);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format expiry date MM/YY
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  // Card input handlers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    setCardType(detectCardType(formatted));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setCardExpiry(formatExpiry(value));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, '').substring(0, cardType === 'amex' ? 4 : 3);
    setCardCvv(value);
  };

  // Validate form
  const isFormValid = () => {
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    return (
      cleanCardNumber.length >= 15 &&
      cardExpiry.length === 5 &&
      cardCvv.length >= 3 &&
      cardholderName.trim().length >= 2 &&
      acceptTerms
    );
  };

  const handlePayment = async () => {
    if (!guestId || !isFormValid()) return;

    setError(null);
    setProcessing(true);

    try {
      // Prepare payment data
      const paymentData = {
        guest_email: guest?.email || '', // SECURITY: Required for IDOR prevention
        card_number: cardNumber.replace(/\s/g, ''),
        card_expiry_date: cardExpiry.replace('/', ''),
        card_cvv: cardCvv,
        cardholder_name: cardholderName,
        billing_country: 'GT',
        accept_terms: acceptTerms
      };

      const result = await processVIPListPayment(guestId, paymentData);
      if (result.success) {
        setPaymentSuccess(true);
        setTicketCode(result.ticket_code || result.qr_token || null);
      } else {
        setError(result.error_message || t('payment.errors.paymentFailed'));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; error_message?: string } } };
      setError(error.response?.data?.error_message || error.response?.data?.error || t('payment.errors.paymentFailed'));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="vippay-wrapper">
          <div className="vippay-bg-blur" />
          <div className="vippay-bg-overlay" />
          <div className="vippay-content">
            <div className="vippay-loading">
              <div className="vippay-loading-spinner" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error && !reservation) {
    return (
      <>
        <div className="vippay-wrapper">
          <div className="vippay-bg-blur" />
          <div className="vippay-bg-overlay" />
          <div className="vippay-content">
            <div className="vippay-error">
              <XCircle size={48} />
              <h2>{error}</h2>
              <button onClick={() => navigate(buildUrl('/venues'))} className="vippay-error-btn">
                {t('payment.backToHome')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!guest || !reservation) {
    return (
      <>
        <div className="vippay-wrapper">
          <div className="vippay-bg-blur" />
          <div className="vippay-bg-overlay" />
          <div className="vippay-content">
            <div className="vippay-error">
              <XCircle size={48} />
              <h2>{t('payment.errors.notFound')}</h2>
              <button onClick={() => navigate(buildUrl('/venues'))} className="vippay-error-btn">
                {t('payment.backToHome')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const currencySymbol = getCurrencySymbol(reservation.currency);
  const totalPrice = guest.amount_due;

  const deadlineInfo = reservation.payment_deadline ? getTimeRemaining(reservation.payment_deadline) : null;
  const isExpired = !deadlineInfo || deadlineInfo === null;
  const alreadyPaid = !!guest.paid_at;

  // Payment Success View
  if (paymentSuccess) {
    return (
      <>
        <div className="vippay-wrapper">
          <div
            className="vippay-bg-blur"
            style={{ backgroundImage: reservation.event_image ? `url(${reservation.event_image})` : undefined }}
          />
          <div className="vippay-bg-overlay" />

          {/* Confetti particles */}
          <div className="vippay-confetti">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="vippay-confetti-piece" style={{ '--delay': `${i * 0.1}s`, '--x': `${Math.random() * 100}%` } as React.CSSProperties} />
            ))}
          </div>

          <div className="vippay-content">
            <div className="vippay-success">
              {/* Animated checkmark */}
              <div className="vippay-success-check">
                <div className="vippay-check-circle">
                  <svg viewBox="0 0 52 52" className="vippay-check-svg">
                    <circle className="vippay-check-circle-bg" cx="26" cy="26" r="25" fill="none"/>
                    <path className="vippay-check-path" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                  </svg>
                </div>
              </div>

              <h1 className="vippay-success-title">{t('payment.success.title')}</h1>
              <p className="vippay-success-subtitle">{t('payment.success.message')}</p>

              {/* Ticket Card */}
              <div className="vippay-ticket-card">
                <div className="vippay-ticket-header">
                  <div className="vippay-ticket-badge">
                    <Star size={12} />
                    <span>VIP ENTRY</span>
                  </div>
                </div>

                {ticketCode && (
                  <div className="vippay-ticket-qr-section">
                    <div className="vippay-qr-placeholder">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${ticketCode}&bgcolor=0a0a0f&color=ffffff`}
                        alt="QR Code"
                        className="vippay-qr-image"
                      />
                    </div>
                    <div className="vippay-ticket-code-display">
                      <span className="vippay-code-label">Código de entrada</span>
                      <span className="vippay-code-value">{ticketCode}</span>
                    </div>
                  </div>
                )}

                <div className="vippay-ticket-divider">
                  <div className="vippay-ticket-notch vippay-notch-left" />
                  <div className="vippay-ticket-line" />
                  <div className="vippay-ticket-notch vippay-notch-right" />
                </div>

                <div className="vippay-ticket-details">
                  <h3 className="vippay-ticket-event">{reservation.event_name}</h3>
                  <div className="vippay-ticket-meta">
                    <div className="vippay-ticket-meta-item">
                      <Calendar size={14} />
                      <span>{formatDate(reservation.event_date)}</span>
                    </div>
                    <div className="vippay-ticket-meta-item">
                      <MapPin size={14} />
                      <span>{reservation.venue_name}</span>
                    </div>
                  </div>
                  <div className="vippay-ticket-guest">
                    <span>{guest.name} {guest.last_name}</span>
                  </div>
                </div>
              </div>

              <div className="vippay-email-notice">
                <CheckCircle size={16} />
                <span>{t('payment.success.emailSent')}</span>
              </div>

              <button
                onClick={() => navigate(buildUrl(`/vip/track/${reservation.tracking_link_code}?success=payment`))}
                className="vippay-success-btn"
              >
                {t('payment.success.viewList')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Already Paid View
  if (alreadyPaid) {
    return (
      <>
        <div className="vippay-wrapper">
          <div
            className="vippay-bg-blur"
            style={{ backgroundImage: reservation.event_image ? `url(${reservation.event_image})` : undefined }}
          />
          <div className="vippay-bg-overlay" />
          <div className="vippay-content">
            <div className="vippay-already-paid">
              <CheckCircle size={64} />
              <h1>{t('payment.alreadyPaid.title')}</h1>
              <p>{t('payment.alreadyPaid.message')}</p>
              <button
                onClick={() => navigate(buildUrl(`/vip/track/${reservation.tracking_link_code}`))}
                className="vippay-success-btn"
              >
                {t('payment.alreadyPaid.viewList')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Expired View
  if (isExpired) {
    return (
      <>
        <div className="vippay-wrapper">
          <div
            className="vippay-bg-blur"
            style={{ backgroundImage: reservation.event_image ? `url(${reservation.event_image})` : undefined }}
          />
          <div className="vippay-bg-overlay" />
          <div className="vippay-content">
            <div className="vippay-expired">
              <Clock size={64} />
              <h1>{t('payment.expired.title')}</h1>
              <p>{t('payment.expired.message')}</p>
              <button
                onClick={() => navigate(buildUrl('/venues'))}
                className="vippay-error-btn"
              >
                {t('payment.backToHome')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="vippay-wrapper">
        <div
          className="vippay-bg-blur"
          style={{ backgroundImage: reservation.event_image ? `url(${reservation.event_image})` : undefined }}
        />
        <div className="vippay-bg-overlay" />

        <div className="vippay-content">
          <div className="vippay-container">

            {/* Hero Section - Whose reservation this is */}
            <div className="vippay-hero">
              <div className="vippay-hero-icon">
                <PartyPopper size={32} />
              </div>
              <div className="vippay-hero-content">
                <span className="vippay-hero-label">{t('payment.hero.joiningList')}</span>
                <h1 className="vippay-hero-host">
                  {reservation.host_name} {reservation.host_last_name}
                </h1>
                <div className="vippay-hero-type">
                  <Wine size={16} />
                  <span>
                    {reservation.table_or_bar === 'table'
                      ? t('payment.hero.tableReservation')
                      : t('payment.hero.barReservation')}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="vippay-error-banner">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Event Info Card */}
            <div className="vippay-event-card">
              <h2 className="vippay-event-name">{reservation.event_name}</h2>
              <div className="vippay-event-meta">
                <span className="vippay-meta-item">
                  <Calendar size={16} />
                  {formatDate(reservation.event_date)}
                </span>
                <span className="vippay-meta-item">
                  <MapPin size={16} />
                  {reservation.venue_name}
                </span>
              </div>
            </div>

            {/* Deadline Warning */}
            <div className="vippay-deadline-card">
              <div className="vippay-deadline-header">
                <AlertCircle size={18} />
                <h3>{t('payment.deadline.title')}</h3>
              </div>
              <p className="vippay-deadline-date">{formatDeadline(reservation.payment_deadline!)}</p>
              <span className="vippay-deadline-remaining">
                <Clock size={16} />
                {deadlineInfo?.text}
              </span>
            </div>

            {/* Price Card */}
            <div className="vippay-price-card">
              <p className="vippay-price-label">{t('payment.total')}</p>
              <div className="vippay-price-amount">
                <span className="vippay-price-currency">{currencySymbol}</span>
                <span className="vippay-price-value">{totalPrice.toFixed(2)}</span>
              </div>
              <div className="vippay-price-badge">
                <Ticket size={14} />
                <span>Entrada VIP + Costes de gestión</span>
              </div>
            </div>

            {/* Card Payment Form */}
            <div className="vippay-card-form">
              <div className="vippay-form-header">
                <CreditCard size={20} />
                <span>Datos de pago</span>
                <div className="vippay-card-brands">
                  {/* Visa Logo - Official wordmark */}
                  <svg className={cardType === 'visa' ? 'active' : ''} viewBox="0 0 780 500" xmlns="http://www.w3.org/2000/svg">
                    <path d="M293.2 348.73l33.359-195.76h53.358l-33.384 195.76H293.2zm246.11-191.54c-10.569-3.966-27.135-8.222-47.821-8.222-52.726 0-89.863 26.551-90.181 64.604-.297 28.129 26.515 43.822 46.754 53.185 20.771 9.598 27.752 15.716 27.652 24.283-.133 13.123-16.586 19.115-31.924 19.115-21.355 0-32.701-2.967-50.225-10.273l-6.878-3.111-7.487 43.822c12.463 5.467 35.508 10.199 59.438 10.445 56.09 0 92.502-26.248 92.916-66.885.199-22.27-14.016-39.215-44.801-53.188-18.65-9.056-30.072-15.099-29.951-24.269 0-8.137 9.668-16.838 30.56-16.838 17.446-.271 30.089 3.534 39.936 7.5l4.781 2.259 7.231-42.427m137.31-4.223h-41.23c-12.773 0-22.332 3.486-27.941 16.234l-79.244 179.4h56.031s9.16-24.121 11.232-29.418c6.123 0 60.555.084 68.336.084 1.596 6.854 6.492 29.334 6.492 29.334h49.512l-43.188-195.64zm-65.417 126.41c4.414-11.279 21.26-54.724 21.26-54.724-.314.521 4.381-11.334 7.074-18.684l3.607 16.878s10.217 46.729 12.352 56.527h-44.293v.003zM231.91 153.19l-52.24 133.5-5.567-27.129c-9.726-31.274-40.025-65.157-73.898-82.12l47.767 171.2 56.456-.063 84.004-195.39h-56.522" fill="#1a1f71"/>
                  </svg>
                  {/* Mastercard Logo */}
                  <svg className={cardType === 'mastercard' ? 'active' : ''} viewBox="0 0 50 30" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="15" r="12" fill="#EB001B"/>
                    <circle cx="32" cy="15" r="12" fill="#F79E1B"/>
                    <path d="M25 5.5C27.5 7.5 29 10.5 29 15C29 19.5 27.5 22.5 25 24.5C22.5 22.5 21 19.5 21 15C21 10.5 22.5 7.5 25 5.5Z" fill="#FF5F00"/>
                  </svg>
                </div>
              </div>

              {/* Cardholder Name */}
              <div className="vippay-input-group">
                <label htmlFor="cardholder">Nombre del titular</label>
                <input
                  type="text"
                  id="cardholder"
                  placeholder="Como aparece en la tarjeta"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  autoComplete="cc-name"
                  disabled={processing}
                />
              </div>

              {/* Card Number */}
              <div className="vippay-input-group">
                <label htmlFor="cardnumber">Número de tarjeta</label>
                <div className="vippay-card-input-wrapper">
                  <input
                    type="text"
                    id="cardnumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    autoComplete="cc-number"
                    inputMode="numeric"
                    disabled={processing}
                  />
                  {cardType !== 'unknown' && (
                    <span className={`vippay-card-type-badge ${cardType}`}>
                      {cardType.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Expiry and CVV Row */}
              <div className="vippay-input-row">
                <div className="vippay-input-group">
                  <label htmlFor="expiry">Vencimiento</label>
                  <input
                    type="text"
                    id="expiry"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    autoComplete="cc-exp"
                    inputMode="numeric"
                    disabled={processing}
                  />
                </div>
                <div className="vippay-input-group">
                  <label htmlFor="cvv">CVV</label>
                  <input
                    type="text"
                    id="cvv"
                    placeholder={cardType === 'amex' ? '4 dígitos' : '3 dígitos'}
                    value={cardCvv}
                    onChange={handleCvvChange}
                    maxLength={cardType === 'amex' ? 4 : 3}
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    disabled={processing}
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="vippay-terms-checkbox">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  disabled={processing}
                />
                <span>Acepto los <a href="/terms" target="_blank" rel="noopener">términos y condiciones</a> y la <a href="/privacy" target="_blank" rel="noopener">política de privacidad</a></span>
              </label>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing || !isFormValid()}
              className="vippay-pay-btn"
            >
              {processing ? (
                <>
                  <div className="vippay-btn-spinner" />
                  <span>Procesando pago...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Pagar {currencySymbol}{totalPrice.toFixed(2)}
                </>
              )}
            </button>

            <div className="vippay-secure-note">
              <Shield size={14} />
              <span>Pago seguro encriptado • Procesado por NeoNet/Cybersource</span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
