// group-guest-complete-page.tsx
// SECURITY: Using apiClient for consistent cookie-based authentication
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, AlertCircle, Loader2, CreditCard, Ticket, ArrowRight, PartyPopper, Gift, Lock, KeyRound } from 'lucide-react';
import { VenueNavBar } from '../../components/venue-nav-bar/venue-nav-bar';
import { Footer } from '../../components/footer/footer';
import { PHONE_PREFIX_OPTIONS } from '../../types/types';
import { apiClient } from '../../utils/axios';
import './group-guest-complete-page.css';

// Fun messages to remind guests to pay back the host
const HOST_PAYBACK_MESSAGES = [
  "Don't forget to Venmo/Zelle your friend back! Good karma awaits.",
  "Pro tip: Buy your host a drink at the party. It's only fair!",
  "Remember: the host covered you. Time to settle up!",
  "Your ticket is ready! Now go pay back your generous friend.",
  "Free ticket? Not quite - your host is waiting for that payback!",
];

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
  // Support both guestId (new flow) and verificationCode (legacy)
  const { guestId, verificationCode } = useParams<{ guestId?: string; verificationCode?: string }>();
  const navigate = useNavigate();

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
  const [funMessage] = useState(() =>
    HOST_PAYBACK_MESSAGES[Math.floor(Math.random() * HOST_PAYBACK_MESSAGES.length)]
  );

  // Determine which ID to use and which API endpoints
  const useGuestIdFlow = !!guestId;
  const identifier = guestId || verificationCode;

  useEffect(() => {
    if (!identifier) return;

    const fetchGuestData = async () => {
      try {
        // Use different endpoint based on flow
        const endpoint = useGuestIdFlow
          ? `/group-reservations/guest/${identifier}`
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
        setError(err.response?.data?.error || err.message || 'Error loading guest data');
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
        ? `/group-reservations/guest/${identifier}/pay`
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
      setError(err.response?.data?.error || err.message || 'Error processing payment');
      setSubmitting(false);
    }
  };

  const handleVerifyAccessCode = async () => {
    if (!guestId || accessCode.length !== 6) return;

    setVerifyingCode(true);
    setError(null);

    try {
      const response = await apiClient.post(
        `/group-reservations/guest/${guestId}/verify-access-code`,
        { access_code: accessCode }
      );
      const data = response.data;

      if (data.valid) {
        setAccessCodeVerified(true);
      } else {
        setError(data.error || 'Invalid access code');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error verifying access code');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier) return;

    // Validation
    if (!formData.email?.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.birth_date?.trim()) {
      setError('Date of birth is required');
      return;
    }
    if (!formData.phone?.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!/^\d{6,15}$/.test(formData.phone)) {
      setError('Phone must be 6-15 digits');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Use different endpoint based on flow
      const endpoint = useGuestIdFlow
        ? `/group-reservations/guest/${identifier}/complete`
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
            navigate(`/group/track/${paymentLinkCode}?success=data`);
          }, 10000);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error completing data');
      setSubmitting(false);
    }
  };

  const handlePaymentAfterDataComplete = async () => {
    if (!identifier) return;

    try {
      // Use different endpoint based on flow
      const endpoint = useGuestIdFlow
        ? `/group-reservations/guest/${identifier}/pay`
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
      setError(err.response?.data?.error || err.message || 'Error processing payment');
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
            <p>Loading...</p>
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
            <h2>Guest Not Found</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/venues')} className="guest-complete-btn">
              Back to home
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
              <h2>Payment Complete!</h2>
              <p>Your ticket has been generated and sent to your email.</p>
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
                    onClick={() => navigate(`/group/track/${paymentSuccess.payment_link_code}?success=payment`)}
                    className="guest-complete-submit-btn"
                  >
                    View Reservation
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
              <h2>You're All Set!</h2>
              <p>Your ticket has been generated and sent to your email.</p>
              <p className="guest-complete-success-email">{formData.email}</p>

              {/* Fun reminder for host-paid guests */}
              {isHostPaid && guestData && guestData.amount_due > 0 && (
                <div className="guest-complete-payback-reminder">
                  <Gift size={20} />
                  <span>{funMessage}</span>
                </div>
              )}

              <div className="guest-complete-success-actions">
                {paymentLinkCode && (
                  <button
                    onClick={() => navigate(`/group/track/${paymentLinkCode}?success=data`)}
                    className="guest-complete-submit-btn"
                  >
                    View Reservation
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
              <h2>You Already Have Your Ticket!</h2>
              <p>Your ticket was already sent to your email.</p>
              {guestData?.email && (
                <p className="guest-complete-success-email">{guestData.email}</p>
              )}
              <div className="guest-complete-success-actions">
                {paymentLinkCode && (
                  <button
                    onClick={() => navigate(`/group/track/${paymentLinkCode}`)}
                    className="guest-complete-submit-btn"
                  >
                    View Reservation
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
                {nextAction === 'pay' ? 'Pay for Ticket' : 'Complete Your Info'}
              </h1>
              {eventInfo && (
                <p className="guest-complete-event-name">{eventInfo.name}</p>
              )}
              <p className="guest-complete-subtitle">
                {nextAction === 'pay'
                  ? 'Complete your payment to receive your ticket'
                  : nextAction === 'complete_data_then_pay'
                  ? 'Enter your information, then proceed to payment'
                  : 'Enter your information to receive your ticket'
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
                  <p>Pay securely with your credit or debit card.</p>
                </div>
                <button
                  onClick={handlePayment}
                  className="guest-complete-submit-btn"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={20} className="guest-complete-spinner" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Pay Q{guestData?.amount_due.toFixed(2)}
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
                  <h2 className="guest-complete-access-code-title">Access Code Required</h2>
                  <p className="guest-complete-access-code-desc">
                    This ticket was paid for by the organizer. Enter the access code they shared with you to continue.
                  </p>

                  <div className="guest-complete-form-group">
                    <label>
                      <KeyRound size={14} style={{ marginRight: '0.25rem' }} />
                      Access Code <span className="form-field-required">*</span>
                    </label>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="Enter 6-character code"
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
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        Verify Code
                      </>
                    )}
                  </button>

                  <p className="guest-complete-access-code-hint">
                    Don't have the code? Ask your group organizer for it.
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
                      Name <span className="form-field-required">*</span>
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
                      Last Name <span className="form-field-required">*</span>
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
                    Email <span className="form-field-required">*</span>
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
                      Date of Birth <span className="form-field-required">*</span>
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      value={formData.birth_date}
                      onChange={handleInputChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="guest-complete-form-group">
                    <label>
                      <User size={14} style={{ marginRight: '0.25rem' }} />
                      Gender <span className="form-field-required">*</span>
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
                          <label htmlFor="gender-male" className="gender-label">Male</label>
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
                          <label htmlFor="gender-female" className="gender-label">Female</label>
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
                          <label htmlFor="gender-other" className="gender-label">Other</label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="guest-complete-form-group">
                  <label>
                    Phone <span className="form-field-required">*</span>
                  </label>
                  <div className="phone-input-container">
                    <div className="phone-prefix-select">
                      <select
                        name="phone_prefix"
                        value={formData.phone_prefix}
                        onChange={handleInputChange}
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
                      {nextAction === 'complete_data_then_pay' ? 'Processing...' : 'Generating ticket...'}
                    </>
                  ) : nextAction === 'complete_data_then_pay' ? (
                    <>
                      Continue to Pay Q{guestData?.amount_due.toFixed(2)}
                      <ArrowRight size={18} />
                    </>
                  ) : (
                    <>
                      Complete & Get Ticket
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
