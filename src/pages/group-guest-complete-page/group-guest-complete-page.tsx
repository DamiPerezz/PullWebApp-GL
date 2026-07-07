// group-guest-complete-page.tsx
// SECURITY: Using apiClient for consistent cookie-based authentication
// SECURITY: Validate URL parameters to prevent injection
import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, AlertCircle, Loader2, CreditCard, Ticket, ArrowRight, PartyPopper, Gift, Lock, KeyRound } from 'lucide-react';
import { VenueNavBar } from '../../components/venue-nav-bar/venue-nav-bar';
import { Footer } from '../../components/footer/footer';
import { PhonePrefixSelector } from '../../components/phone-prefix-selector/phone-prefix-selector';
import { BirthDatePicker, parseMinAge } from '../../components/birth-date-picker/birth-date-picker';
import { apiClient } from '../../utils/axios';
import { validateUUID } from '../../utils/security';
import './group-guest-complete-page.css';

// Fun messages to remind guests to pay back the host - moved to translations
// The array will be loaded from t('guestComplete.paybackMessages')

interface GuestData {
  id: string;
  name: string;
  last_name: string;
  email: string;
  gender: string;
  amount_due: number;
  host_pays: boolean;
  paid_at: string | null;
  ticket_id: string | null;
}

interface EventInfo {
  id: string;
  name: string;
  event_date: string;
  start_time: string;
  image: string;
  min_age?: number | string;
}

interface PaymentSuccessData {
  guest_email: string;
  guest_name: string;
  event_name: string;
  event_date: string;
  event_image: string;
  amount_paid: number;
  payment_link_code: string;
}

type NextAction = 'pay' | 'complete_data' | 'complete_data_then_pay' | 'ticket_ready';

export const GroupGuestCompletePage = () => {
  const { t, i18n } = useTranslation('group');

  // Support both guestId (new flow) and verificationCode (legacy)
  const { guestId: rawGuestId, verificationCode: rawVerificationCode, lang } = useParams<{ guestId?: string; verificationCode?: string; lang?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vcFromQuery = searchParams.get('vc');

  // Language handling
  const currentLang = lang || i18n.language || 'es';
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  // SECURITY: Validate URL parameters (both are UUIDs)
  const guestId = useMemo(() => validateUUID(rawGuestId), [rawGuestId]);
  const verificationCode = useMemo(() => validateUUID(rawVerificationCode), [rawVerificationCode]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<PaymentSuccessData | null>(null);
  const [guestData, setGuestData] = useState<GuestData | null>(null);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [nextAction, setNextAction] = useState<NextAction>('complete_data');
  const [paymentLinkCode, setPaymentLinkCode] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    email: '',
    gender: '',
    birth_date: '',
    phone: '',
    phone_prefix: '+502'
  });
  const [isHostPaid, setIsHostPaid] = useState(false);
  const [requiresAccessCode, setRequiresAccessCode] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeVerified, setAccessCodeVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [randomMessageIndex] = useState(() => Math.floor(Math.random() * 5));

  // Get fun message from translations
  const paybackMessages = t('guestComplete.paybackMessages', { returnObjects: true }) as string[];
  const funMessage = Array.isArray(paybackMessages) ? paybackMessages[randomMessageIndex] : '';

  // Determine which ID to use and which API endpoints
  const useGuestIdFlow = !!guestId;
  const identifier = guestId || verificationCode;

  useEffect(() => {
    if (!identifier) return;

    const fetchGuestData = async () => {
      try {
        // Use different endpoint based on flow
        const endpoint = useGuestIdFlow
          ? `/group-reservations/guest/${identifier}?verification_code=${vcFromQuery || ''}`
          : `/group-reservations/guest/verify/${identifier}`;

        const response = await apiClient.get(endpoint);
        const data = response.data;

        setGuestData(data.guest);
        setEventInfo(data.event);
        setNextAction(data.next_action);
        setPaymentLinkCode(data.payment_link_code);
        setIsHostPaid(data.guest?.host_pays || false);
        setRequiresAccessCode(data.requires_access_code || false);

        // Pre-fill form with existing data if available
        if (data.guest) {
          setFormData({
            name: data.guest.name || '',
            last_name: data.guest.last_name || '',
            email: data.guest.email || '',
            gender: data.guest.gender || '',
            birth_date: '',
            phone: '',
            phone_prefix: '+502'
          });
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || t('guestComplete.errors.loadingData'));
        setLoading(false);
      }
    };

    fetchGuestData();
  }, [identifier, useGuestIdFlow]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = async () => {
    if (!identifier) return;

    setSubmitting(true);
    setError(null);

    try {
      // Use different endpoint based on flow
      const endpoint = useGuestIdFlow
        ? `/group-reservations/guest/${identifier}/pay?verification_code=${vcFromQuery || ''}`
        : `/group-reservations/guest/pay/${identifier}`;

      const response = await apiClient.post(endpoint);
      const data = response.data;

      // Show payment success
      setPaymentSuccess({
        guest_email: data.guest_email,
        guest_name: data.guest_name,
        event_name: data.event_name,
        event_date: data.event_date,
        event_image: data.event_image,
        amount_paid: data.amount_paid,
        payment_link_code: data.payment_link_code
      });
      setSubmitting(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || t('guestComplete.errors.processingPayment'));
      setSubmitting(false);
    }
  };

  const handleVerifyAccessCode = async () => {
    if (!guestId || accessCode.length !== 6) return;

    setVerifyingCode(true);
    setError(null);

    try {
      const response = await apiClient.post(
        `/group-reservations/guest/${guestId}/verify-access-code?verification_code=${vcFromQuery || ''}`,
        { access_code: accessCode }
      );
      const data = response.data;

      if (data.valid) {
        setAccessCodeVerified(true);
      } else {
        setError(data.error || t('guestComplete.errors.invalidAccessCode'));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || t('guestComplete.errors.verifyingCode'));
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier) return;

    // Validation
    if (!formData.email?.trim()) {
      setError(t('guestComplete.errors.emailRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('guestComplete.errors.invalidEmail'));
      return;
    }
    if (!formData.birth_date?.trim()) {
      setError(t('guestComplete.errors.birthDateRequired'));
      return;
    }
    // Age validation
    const minAge = parseMinAge(eventInfo?.min_age);
    const birthDate = new Date(formData.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (birthDate > today) {
      setError(t('guestComplete.errors.birthDateFuture'));
      return;
    }
    if (age < minAge) {
      setError(t('guestComplete.errors.minAge', { age: minAge }));
      return;
    }
    if (!formData.phone?.trim()) {
      setError(t('guestComplete.errors.phoneRequired'));
      return;
    }
    if (!/^\d{6,15}$/.test(formData.phone)) {
      setError(t('guestComplete.errors.invalidPhone'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Use different endpoint based on flow
      const endpoint = useGuestIdFlow
        ? `/group-reservations/guest/${identifier}/complete?verification_code=${vcFromQuery || ''}`
        : `/group-reservations/guest/complete/${identifier}`;

      await apiClient.post(endpoint, {
        ...formData,
        access_code: requiresAccessCode ? accessCode : undefined
      });

      // If this was complete_data_then_pay, proceed to payment
      if (nextAction === 'complete_data_then_pay') {
        // Update guest data with form values for payment
        setGuestData(prev => prev ? { ...prev, email: formData.email } : null);
        // Proceed to payment
        await handlePaymentAfterDataComplete();
      } else {
        setSuccess(true);
        // Redirect back to tracking page after 10 seconds
        if (paymentLinkCode) {
          setTimeout(() => {
            navigate(buildUrl(`/group/track/${paymentLinkCode}?success=data`));
          }, 10000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || t('guestComplete.errors.completingData'));
      setSubmitting(false);
    }
  };

  const handlePaymentAfterDataComplete = async () => {
    if (!identifier) return;

    try {
      // Use different endpoint based on flow
      const endpoint = useGuestIdFlow
        ? `/group-reservations/guest/${identifier}/pay?verification_code=${vcFromQuery || ''}`
        : `/group-reservations/guest/pay/${identifier}`;

      const response = await apiClient.post(endpoint);
      const data = response.data;

      // Show payment success
      setPaymentSuccess({
        guest_email: data.guest_email,
        guest_name: data.guest_name,
        event_name: data.event_name,
        event_date: data.event_date,
        event_image: data.event_image,
        amount_paid: data.amount_paid,
        payment_link_code: data.payment_link_code
      });
      setSubmitting(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || t('guestComplete.errors.processingPayment'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <VenueNavBar />
        <div className="guest-complete-wrapper">
          <div className="guest-complete-loading">
            <Loader2 size={48} className="guest-complete-spinner" />
            <p>{t('guestComplete.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !guestData) {
    return (
      <>
        <VenueNavBar />
        <div className="guest-complete-wrapper">
          <div className="guest-complete-error">
            <AlertCircle size={48} />
            <h2>{t('guestComplete.notFound')}</h2>
            <p>{error}</p>
            <button onClick={() => navigate(buildUrl('/venues'))} className="guest-complete-btn">
              {t('guestComplete.backToHome')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // Payment Success View
  if (paymentSuccess) {
    return (
      <>
        <VenueNavBar />
        <div className="guest-complete-wrapper">
          {paymentSuccess.event_image && (
            <>
              <div
                className="guest-complete-bg-blur"
                style={{ backgroundImage: `url(${paymentSuccess.event_image})` }}
              />
              <div className="guest-complete-bg-overlay" />
            </>
          )}
          <div className="guest-complete-content">
            <div className="guest-complete-success">
              <PartyPopper size={64} className="guest-complete-success-icon" />
              <h2>{t('guestComplete.paymentComplete')}</h2>
              <p>{t('guestComplete.ticketSent')}</p>
              <p className="guest-complete-success-email">{paymentSuccess.guest_email}</p>

              <div className="guest-complete-success-details">
                <div className="guest-complete-success-event">
                  <strong>{paymentSuccess.event_name}</strong>
                  <span>{paymentSuccess.event_date}</span>
                </div>
                <div className="guest-complete-success-amount">
                  Q{paymentSuccess.amount_paid.toFixed(2)}
                </div>
              </div>

              <div className="guest-complete-success-actions">
                {paymentSuccess.payment_link_code && (
                  <button
                    onClick={() => navigate(buildUrl(`/group/track/${paymentSuccess.payment_link_code}?success=payment`))}
                    className="guest-complete-submit-btn"
                  >
                    {t('guestComplete.viewReservation')}
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="guest-complete-footer">
            <Footer />
          </div>
        </div>
      </>
    );
  }

  if (success) {
    return (
      <>
        <VenueNavBar />
        <div className="guest-complete-wrapper">
          {eventInfo?.image && (
            <>
              <div
                className="guest-complete-bg-blur"
                style={{ backgroundImage: `url(${eventInfo.image})` }}
              />
              <div className="guest-complete-bg-overlay" />
            </>
          )}
          <div className="guest-complete-content">
            <div className="guest-complete-success">
              <Ticket size={64} className="guest-complete-success-icon" />
              <h2>{t('guestComplete.allSet')}</h2>
              <p>{t('guestComplete.ticketSent')}</p>
              <p className="guest-complete-success-email">{formData.email}</p>

              {/* Fun reminder for host-paid guests */}
              {isHostPaid && guestData && guestData.amount_due > 0 && (
                <div className="guest-complete-payback-reminder">
                  <Gift size={20} />
                  <span>{t('guestComplete.paybackReminder', { message: funMessage })}</span>
                </div>
              )}

              <div className="guest-complete-success-actions">
                {paymentLinkCode && (
                  <button
                    onClick={() => navigate(buildUrl(`/group/track/${paymentLinkCode}?success=data`))}
                    className="guest-complete-submit-btn"
                  >
                    {t('guestComplete.viewReservation')}
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="guest-complete-footer">
            <Footer />
          </div>
        </div>
      </>
    );
  }

  // Ticket already ready
  if (nextAction === 'ticket_ready') {
    return (
      <>
        <VenueNavBar />
        <div className="guest-complete-wrapper">
          {eventInfo?.image && (
            <>
              <div
                className="guest-complete-bg-blur"
                style={{ backgroundImage: `url(${eventInfo.image})` }}
              />
              <div className="guest-complete-bg-overlay" />
            </>
          )}
          <div className="guest-complete-content">
            <div className="guest-complete-success">
              <Ticket size={64} className="guest-complete-success-icon" />
              <h2>{t('guestComplete.alreadyHaveTicket')}</h2>
              <p>{t('guestComplete.ticketAlreadySent')}</p>
              {guestData?.email && (
                <p className="guest-complete-success-email">{guestData.email}</p>
              )}
              <div className="guest-complete-success-actions">
                {paymentLinkCode && (
                  <button
                    onClick={() => navigate(buildUrl(`/group/track/${paymentLinkCode}`))}
                    className="guest-complete-submit-btn"
                  >
                    {t('guestComplete.viewReservation')}
                    <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="guest-complete-footer">
            <Footer />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <VenueNavBar />
      <div className="guest-complete-wrapper">
        {eventInfo?.image && (
          <>
            <div
              className="guest-complete-bg-blur"
              style={{ backgroundImage: `url(${eventInfo.image})` }}
            />
            <div className="guest-complete-bg-overlay" />
          </>
        )}

        <div className="guest-complete-content">
          <div className="guest-complete-container">
            <div className="guest-complete-header">
              <h1>
                {nextAction === 'pay' ? t('guestComplete.titlePay') : t('guestComplete.title')}
              </h1>
              {eventInfo && (
                <p className="guest-complete-event-name">{eventInfo.name}</p>
              )}
              <p className="guest-complete-subtitle">
                {nextAction === 'pay'
                  ? t('guestComplete.completeInfoDesc')
                  : nextAction === 'complete_data_then_pay'
                  ? t('guestComplete.completeAndPayDesc')
                  : t('guestComplete.completeDataDesc')
                }
              </p>
            </div>

            {/* Guest Info Card */}
            {guestData && (guestData.name || guestData.last_name) && (
              <div className="guest-complete-info-card">
                <div className="guest-complete-info-row">
                  <User size={16} />
                  <span>{guestData.name} {guestData.last_name}</span>
                </div>
                {guestData.amount_due > 0 && (
                  <div className="guest-complete-info-amount">
                    Q{guestData.amount_due.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="guest-complete-form-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Payment View */}
            {nextAction === 'pay' && (
              <div className="guest-complete-payment">
                <div className="guest-complete-payment-info">
                  <CreditCard size={32} />
                  <p>{t('guestComplete.paySecurely')}</p>
                </div>
                <button
                  onClick={handlePayment}
                  className="guest-complete-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="guest-complete-spinner" />
                      {t('guestComplete.processing')}
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      {t('guestComplete.pay', { price: `Q${guestData?.amount_due.toFixed(2)}` })}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Access Code Verification for Host-Paid Guests */}
            {(nextAction === 'complete_data' || nextAction === 'complete_data_then_pay') && requiresAccessCode && !accessCodeVerified && (
              <div className="guest-complete-form">
                <div className="guest-complete-access-code-section">
                  <div className="guest-complete-access-code-icon">
                    <Lock size={48} />
                  </div>
                  <h2 className="guest-complete-access-code-title">{t('guestComplete.accessCodeRequired')}</h2>
                  <p className="guest-complete-access-code-desc">
                    {t('guestComplete.accessCodeDesc')}
                  </p>

                  <div className="guest-complete-form-group">
                    <label>
                      <KeyRound size={14} style={{ marginRight: '0.25rem' }} />
                      {t('guestComplete.accessCode')} <span className="form-field-required">*</span>
                    </label>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder={t('guestComplete.enterCode')}
                      maxLength={6}
                      className="guest-complete-access-code-input"
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyAccessCode}
                    className="guest-complete-submit-btn"
                    disabled={accessCode.length !== 6 || verifyingCode}
                  >
                    {verifyingCode ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {t('guestComplete.verifying')}
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        {t('guestComplete.verifyCode')}
                      </>
                    )}
                  </button>

                  <p className="guest-complete-access-code-hint">
                    {t('guestComplete.noCode')}
                  </p>
                </div>
              </div>
            )}

            {/* Complete Data Form */}
            {(nextAction === 'complete_data' || nextAction === 'complete_data_then_pay') && (!requiresAccessCode || accessCodeVerified) && (
              <form onSubmit={handleSubmit} className="guest-complete-form">
                <div className="guest-complete-form-row">
                  <div className="guest-complete-form-group">
                    <label>
                      {t('guestComplete.name')} <span className="form-field-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      readOnly
                      disabled
                      className="guest-complete-input-readonly"
                    />
                  </div>

                  <div className="guest-complete-form-group">
                    <label>
                      {t('guestComplete.lastName')} <span className="form-field-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      readOnly
                      disabled
                      className="guest-complete-input-readonly"
                    />
                  </div>
                </div>

                <div className="guest-complete-form-group">
                  <label>
                    {t('guestComplete.email')} <span className="form-field-required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="guest-complete-form-row">
                  <div className="guest-complete-form-group">
                    <label>
                      {t('guestComplete.dateOfBirth')} <span className="form-field-required">*</span>
                    </label>
                    <BirthDatePicker
                      value={formData.birth_date}
                      onChange={(value) => setFormData(prev => ({ ...prev, birth_date: value }))}
                      minAge={eventInfo?.min_age}
                      placeholder="DD/MM/YYYY"
                    />
                  </div>

                  <div className="guest-complete-form-group">
                    <label>
                      <User size={14} style={{ marginRight: '0.25rem' }} />
                      {t('guestComplete.gender')} <span className="form-field-required">*</span>
                    </label>
                    <div className="gender-selection gender-selection-single">
                      {formData.gender === 'male' && (
                        <div className="gender-option">
                          <input
                            type="radio"
                            id="gender-male"
                            name="gender"
                            value="male"
                            checked
                            disabled
                          />
                          <label htmlFor="gender-male" className="gender-label">{t('guestComplete.male')}</label>
                        </div>
                      )}
                      {formData.gender === 'female' && (
                        <div className="gender-option">
                          <input
                            type="radio"
                            id="gender-female"
                            name="gender"
                            value="female"
                            checked
                            disabled
                          />
                          <label htmlFor="gender-female" className="gender-label">{t('guestComplete.female')}</label>
                        </div>
                      )}
                      {formData.gender === 'other' && (
                        <div className="gender-option">
                          <input
                            type="radio"
                            id="gender-other"
                            name="gender"
                            value="other"
                            checked
                            disabled
                          />
                          <label htmlFor="gender-other" className="gender-label">{t('guestComplete.other')}</label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="guest-complete-form-group">
                  <label>
                    {t('guestComplete.phone')} <span className="form-field-required">*</span>
                  </label>
                  <div className="phone-input-container">
                    <PhonePrefixSelector
                      value={formData.phone_prefix}
                      onChange={(value) => setFormData(prev => ({ ...prev, phone_prefix: value }))}
                    />
                    <div className="phone-number-input">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="12345678"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="guest-complete-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="guest-complete-spinner" />
                      {nextAction === 'complete_data_then_pay' ? t('guestComplete.processing') : t('guestComplete.generatingTicket')}
                    </>
                  ) : nextAction === 'complete_data_then_pay' ? (
                    <>
                      {t('guestComplete.continueToPay', { price: `Q${guestData?.amount_due.toFixed(2)}` })}
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      {t('guestComplete.completeAndGetTicket')}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="guest-complete-footer">
          <Footer />
        </div>
      </div>
    </>
  );
};