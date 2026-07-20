import { useState, useEffect } from "react";
import { NavLink, useParams, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Wallet, User, LogOut, ArrowLeft, HelpCircle, X, Send, Clock, Loader } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiClient } from "../../utils/axios";
import "./venue-nav-bar.css";
import { DEFAULT_VENUE_SLUG } from '../../config/venue';

const PullLogo = "/logo.svg";

// VenueNavBar component with support modal
export const VenueNavBar = () => {
  const { t } = useTranslation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [supportError, setSupportError] = useState("");
  const { venueSlug, lang } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Get current language for URL construction
  const currentLang = lang || 'es';

  // Helper function to build language-prefixed URLs
  const buildUrl = (path: string) => `/${currentLang}${path}`;

  // Detectar si estamos en la página de detalle de evento, wallet, group guest, calendar o all-events
  const isEventDetailPage = location.pathname.match(/^\/(en|es)\/event\//);
  const isWalletPage = location.pathname.match(/^\/(en|es)\/wallet$/);
  const isGroupGuestPage = location.pathname.match(/^\/(en|es)\/group\/guest\//);
  const isCalendarPage = location.pathname.includes('/calendar');
  const isAllEventsPage = location.pathname.includes('/all-events');

  // Guardar el venue slug cuando estamos en venue page
  useEffect(() => {
    if (venueSlug) {
      sessionStorage.setItem('lastVenueSlug', venueSlug);
    }
  }, [venueSlug]);

  const handleBackToVenue = () => {
    const lastVenue = sessionStorage.getItem('lastVenueSlug');
    if (lastVenue) {
      navigate(buildUrl(`/venues/${lastVenue}/events`));
    } else {
      navigate(-1);
    }
  };

  const handleBackFromWallet = () => {
    navigate(buildUrl(`/venues/${DEFAULT_VENUE_SLUG}/events`));
  };

  const handleBackFromGroupGuest = () => {
    navigate(-1);
  };

  // Scroll effect for navbar background
  // Uses wheel event + scan approach since scroll events aren't firing
  useEffect(() => {
    // Find the actual scrolling element by scanning all elements
    const findScrollTop = (): number => {
      let maxScroll = 0;

      // Check standard sources first
      maxScroll = Math.max(
        maxScroll,
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement?.scrollTop || 0,
        document.body?.scrollTop || 0,
        document.scrollingElement?.scrollTop || 0
      );

      // If still 0, scan page-specific containers
      if (maxScroll === 0) {
        const containers = [
          '.layout-container',
          '.layout-content',
          '.venue-page-wrapper',
          '.event-detailed-wrapper',
          '.all-events-page-wrapper',
          '.venue-page-inner',
          'main'
        ];

        containers.forEach(selector => {
          const el = document.querySelector(selector) as HTMLElement;
          if (el && el.scrollTop > maxScroll) {
            maxScroll = el.scrollTop;
          }
        });
      }

      return maxScroll;
    };

    const handleScroll = () => {
      const scrollTop = findScrollTop();
      setIsScrolled(scrollTop > 20);
    };

    // Use wheel event as it fires regardless of which element scrolls
    const handleWheel = () => {
      // Small delay to let the scroll position update
      requestAnimationFrame(() => {
        handleScroll();
      });
    };

    // Also use touch events for mobile
    const handleTouchMove = () => {
      requestAnimationFrame(() => {
        handleScroll();
      });
    };

    // Listen to wheel and touch events on the entire document
    document.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    handleScroll(); // Check initial position

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
    };
  }, []);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setProfileMenuOpen(false);
  };

  // Pre-fill email when modal opens and user is authenticated
  useEffect(() => {
    if (supportModalOpen && user?.email && !supportEmail) {
      setSupportEmail(user.email);
    }
  }, [supportModalOpen, user?.email, supportEmail]);

  const handleSupportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supportEmail.trim() || !supportSubject.trim() || !supportMessage.trim()) return;

    setSupportSending(true);
    setSupportError("");

    // Get honeypot fields from form
    const formData = new FormData(e.currentTarget);
    const website = formData.get('website') as string || '';
    const company = formData.get('company') as string || '';
    const fax = formData.get('fax') as string || '';

    try {
      await apiClient.post('/support/submit', {
        email: supportEmail.trim(),
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
        name: user?.name ? `${user.name} ${user.surname || ''}`.trim() : undefined,
        // Honeypot fields - should be empty for real users
        website,
        company,
        fax
      });

      setSupportSent(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setSupportModalOpen(false);
        setSupportSent(false);
        setSupportEmail("");
        setSupportSubject("");
        setSupportMessage("");
      }, 3000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      setSupportError(err.response?.data?.error || t('errors.tryAgainLater'));
    } finally {
      setSupportSending(false);
    }
  };

  const closeSupportModal = () => {
    setSupportModalOpen(false);
    setSupportSent(false);
    setSupportError("");
    setSupportEmail("");
    setSupportSubject("");
    setSupportMessage("");
  };

  // Verificar si tenemos venueSlug
  const hasVenueContext = !!venueSlug;
  const eventsLink = hasVenueContext ? buildUrl(`/venues/${venueSlug}/events`) : '#';

  // Get venue name for simplified navbar - use state to track changes
  const [lastVenueName, setLastVenueName] = useState<string | null>(() =>
    sessionStorage.getItem('lastVenueName')
  );

  useEffect(() => {
    // Read from sessionStorage on mount
    const storedName = sessionStorage.getItem('lastVenueName');
    if (storedName) {
      setLastVenueName(storedName);
      return;
    }

    // If no name yet, poll briefly for async data loading
    const checkInterval = setInterval(() => {
      const name = sessionStorage.getItem('lastVenueName');
      if (name) {
        setLastVenueName(name);
        clearInterval(checkInterval);
      }
    }, 200);

    // Clean up after 3 seconds
    const timeout = setTimeout(() => clearInterval(checkInterval), 3000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [location.pathname]);

  // Si estamos en la página de detalle de evento, wallet, group guest, calendar o all-events, mostrar navbar simplificado
  if (isEventDetailPage || isWalletPage || isGroupGuestPage || isCalendarPage || isAllEventsPage) {
    const handleBack = isWalletPage
      ? handleBackFromWallet
      : isGroupGuestPage
        ? handleBackFromGroupGuest
        : handleBackToVenue;

    return (
      <>
      <nav className={`venue-navbar venue-navbar--centered ${isScrolled ? 'venue-navbar--scrolled' : ''}`}>
        <div className="venue-navbar__container">
          <div className="venue-navbar__content venue-navbar__content--centered">
            <div className="venue-navbar__back-section">
              <button
                onClick={handleBack}
                className="venue-navbar__back-button"
                aria-label={t('nav.back')}
              >
                <ArrowLeft size={22} />
              </button>
              {lastVenueName && (
                <span className="venue-navbar__venue-name">{lastVenueName.toUpperCase()}</span>
              )}
            </div>

            <div className="venue-navbar__logo venue-navbar__logo--centered">
              <img src={PullLogo} alt="Pull" />
            </div>

            <div className="venue-navbar__links">
              <button
                onClick={() => setSupportModalOpen(true)}
                className="venue-navbar__link venue-navbar__support-btn"
                aria-label={t('nav.help')}
              >
                <HelpCircle size={18} />
              </button>

              <NavLink
                to={isAuthenticated ? buildUrl("/wallet") : buildUrl("/login")}
                className="venue-navbar__link venue-navbar__link--mobile-hidden"
              >
                <Wallet size={18} />
              </NavLink>

              {isAuthenticated ? (
                <div className="venue-navbar__profile">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="venue-navbar__profile-button"
                  >
                    <div className="venue-navbar__profile-icon">
                      {user?.profile_image && !imageError ? (
                        <img
                          src={user.profile_image}
                          alt={user.name}
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <span>{user?.name}</span>
                  </button>

                  {profileMenuOpen && (
                    <>
                      <div
                        className="venue-navbar__profile-overlay"
                        onClick={() => setProfileMenuOpen(false)}
                      />
                      <div className="venue-navbar__profile-menu">
                        <div className="venue-navbar__profile-info">
                          <div className="venue-navbar__profile-header">
                            <div className="venue-navbar__profile-avatar">
                              {user?.profile_image && !imageError ? (
                                <img
                                  src={user.profile_image}
                                  alt={user.name}
                                  onError={() => setImageError(true)}
                                />
                              ) : (
                                <User size={20} />
                              )}
                            </div>
                            <div className="venue-navbar__profile-details">
                              <p className="venue-navbar__profile-name">
                                {user?.name} {user?.surname}
                              </p>
                              <p className="venue-navbar__profile-email">{user?.email}</p>
                            </div>
                          </div>
                          <span className={`venue-navbar__profile-tier venue-navbar__profile-tier--${user?.tier}`}>
                            {user?.tier?.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="venue-navbar__profile-logout"
                        >
                          <LogOut size={16} />
                          <span>{t('nav.logout')}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <NavLink
                  to={buildUrl("/login")}
                  className="venue-navbar__link venue-navbar__link--primary venue-navbar__link--mobile-hidden"
                >
                  <User size={18} />
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Support Modal */}
      {supportModalOpen && (
        <div className="support-modal-overlay" onClick={closeSupportModal}>
          <div className="support-modal" onClick={(e) => e.stopPropagation()}>
            <button className="support-modal__close" onClick={closeSupportModal}>
              <X size={20} />
            </button>

            {supportSent ? (
              <div className="support-modal__success">
                <div className="support-modal__success-icon">
                  <Send size={32} />
                </div>
                <h3>{t('support.messageSent')}</h3>
                <p>{t('support.responseTime')}</p>
              </div>
            ) : (
              <>
                <div className="support-modal__header">
                  <HelpCircle size={24} className="support-modal__icon" />
                  <h3>{t('support.needHelp')}</h3>
                </div>

                <p className="support-modal__subtitle">
                  {t('support.sendMessage')}
                </p>

                {supportError && (
                  <div className="support-modal__error">
                    {supportError}
                  </div>
                )}

                <form onSubmit={handleSupportSubmit} className="support-modal__form">
                  {/* Honeypot fields - hidden from users, bots fill these */}
                  <div className="support-modal__hp" aria-hidden="true">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                    <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                    <input type="text" name="fax" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="support-modal__field">
                    <label htmlFor="support-email">{t('support.yourEmail')}</label>
                    <input
                      id="support-email"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder={t('support.placeholder.email')}
                      maxLength={254}
                      required
                    />
                  </div>

                  <div className="support-modal__field">
                    <label htmlFor="support-subject">{t('support.subject')}</label>
                    <input
                      id="support-subject"
                      type="text"
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder={t('support.placeholder.subject')}
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="support-modal__field">
                    <label htmlFor="support-message">{t('support.message')}</label>
                    <textarea
                      id="support-message"
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder={t('support.placeholder.message')}
                      rows={4}
                      maxLength={2000}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="support-modal__submit"
                    disabled={supportSending || !supportEmail.trim() || !supportSubject.trim() || !supportMessage.trim()}
                  >
                    {supportSending ? (
                      <>
                        <Loader size={18} className="support-modal__spinner" />
                        {t('support.sending')}
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        {t('support.sendButton')}
                      </>
                    )}
                  </button>
                </form>

                <div className="support-modal__response-time">
                  <Clock size={14} />
                  <span>{t('support.estimatedTime')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
    );
  }

  return (
    <>
    <nav className={`venue-navbar ${isScrolled ? 'venue-navbar--scrolled' : ''}`}>
      <div className="venue-navbar__container">
        <div className="venue-navbar__content">
          {/* Logo no clickeable */}
          <div className="venue-navbar__logo">
            <img src={PullLogo} alt="Pull" />
          </div>

          <div className="venue-navbar__links">
            {hasVenueContext && (
              <NavLink
                to={eventsLink}
                className="venue-navbar__link"
              >
                <Calendar size={18} />
                <span>{t('nav.events')}</span>
              </NavLink>
            )}

            <button
              onClick={() => setSupportModalOpen(true)}
              className="venue-navbar__link venue-navbar__support-btn"
              aria-label={t('nav.help')}
            >
              <HelpCircle size={18} />
              <span>{t('nav.help')}</span>
            </button>

            <NavLink
              to={isAuthenticated ? buildUrl("/wallet") : buildUrl("/login")}
              className="venue-navbar__link venue-navbar__link--mobile-hidden"
            >
              <Wallet size={18} />
              <span>{t('nav.wallet')}</span>
            </NavLink>

            {isAuthenticated ? (
              <div className="venue-navbar__profile">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="venue-navbar__profile-button"
                >
                  <div className="venue-navbar__profile-icon">
                    {user?.profile_image && !imageError ? (
                      <img
                        src={user.profile_image}
                        alt={user.name}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <span>{user?.name}</span>
                </button>

                {profileMenuOpen && (
                  <>
                    <div
                      className="venue-navbar__profile-overlay"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <div className="venue-navbar__profile-menu">
                      <div className="venue-navbar__profile-info">
                        <div className="venue-navbar__profile-header">
                          <div className="venue-navbar__profile-avatar">
                            {user?.profile_image && !imageError ? (
                              <img
                                src={user.profile_image}
                                alt={user.name}
                                onError={() => setImageError(true)}
                              />
                            ) : (
                              <User size={20} />
                            )}
                          </div>
                          <div className="venue-navbar__profile-details">
                            <p className="venue-navbar__profile-name">
                              {user?.name} {user?.surname}
                            </p>
                            <p className="venue-navbar__profile-email">{user?.email}</p>
                          </div>
                        </div>
                        <span className={`venue-navbar__profile-tier venue-navbar__profile-tier--${user?.tier}`}>
                          {user?.tier?.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="venue-navbar__profile-logout"
                      >
                        <LogOut size={16} />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <NavLink
                to={buildUrl("/login")}
                className="venue-navbar__link venue-navbar__link--primary venue-navbar__link--mobile-hidden"
              >
                <User size={18} />
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>

    {/* Support Modal */}
    {supportModalOpen && (
      <div className="support-modal-overlay" onClick={closeSupportModal}>
        <div className="support-modal" onClick={(e) => e.stopPropagation()}>
          <button className="support-modal__close" onClick={closeSupportModal}>
            <X size={20} />
          </button>

          {supportSent ? (
            <div className="support-modal__success">
              <div className="support-modal__success-icon">
                <Send size={32} />
              </div>
              <h3>{t('support.messageSent')}</h3>
              <p>{t('support.responseTime')}</p>
            </div>
          ) : (
            <>
              <div className="support-modal__header">
                <HelpCircle size={24} className="support-modal__icon" />
                <h3>{t('support.needHelp')}</h3>
              </div>

              <p className="support-modal__subtitle">
                {t('support.sendMessage')}
              </p>

              {supportError && (
                <div className="support-modal__error">
                  {supportError}
                </div>
              )}

              <form onSubmit={handleSupportSubmit} className="support-modal__form">
                {/* Honeypot fields - hidden from users, bots fill these */}
                <div className="support-modal__hp" aria-hidden="true">
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  <input type="text" name="company" tabIndex={-1} autoComplete="off" />
                  <input type="text" name="fax" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="support-modal__field">
                  <label htmlFor="support-email-main">{t('support.yourEmail')}</label>
                  <input
                    id="support-email-main"
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder={t('support.placeholder.email')}
                    maxLength={254}
                    required
                  />
                </div>

                <div className="support-modal__field">
                  <label htmlFor="support-subject-main">{t('support.subject')}</label>
                  <input
                    id="support-subject-main"
                    type="text"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder={t('support.placeholder.subject')}
                    maxLength={200}
                    required
                  />
                </div>

                <div className="support-modal__field">
                  <label htmlFor="support-message-main">{t('support.message')}</label>
                  <textarea
                    id="support-message-main"
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder={t('support.placeholder.message')}
                    rows={4}
                    maxLength={2000}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="support-modal__submit"
                  disabled={supportSending || !supportEmail.trim() || !supportSubject.trim() || !supportMessage.trim()}
                >
                  {supportSending ? (
                    <>
                      <Loader size={18} className="support-modal__spinner" />
                      {t('support.sending')}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t('support.sendButton')}
                    </>
                  )}
                </button>
              </form>

              <div className="support-modal__response-time">
                <Clock size={14} />
                <span>{t('support.estimatedTime')}</span>
              </div>
            </>
          )}
        </div>
      </div>
    )}
    </>
  );
};
