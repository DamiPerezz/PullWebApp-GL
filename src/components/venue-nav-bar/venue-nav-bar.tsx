import { useState, useEffect } from "react";
import { NavLink, useParams, useLocation, useNavigate } from "react-router-dom";
import { Calendar, Wallet, User, LogOut, ChevronLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./venue-nav-bar.css";

const PullLogo = "/logo.svg";


export const VenueNavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { venueSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Detectar si estamos en la página de detalle de evento, wallet, group guest, calendar o all-events
  const isEventDetailPage = location.pathname.startsWith('/event/');
  const isWalletPage = location.pathname === '/wallet';
  const isGroupGuestPage = location.pathname.startsWith('/group/guest/');
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
      navigate(`/venues/${lastVenue}/events`);
    } else {
      navigate(-1);
    }
  };

  const handleBackFromWallet = () => {
    navigate('/venues/plus-club/events');
  };

  const handleBackFromGroupGuest = () => {
    navigate(-1);
  };

  useEffect(() => {
    // Crear elemento sentinel invisible en la parte superior
    const sentinel = document.createElement('div');
    sentinel.id = 'navbar-scroll-sentinel';
    sentinel.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 1px; pointer-events: none;';
    document.body.prepend(sentinel);

    // IntersectionObserver para detectar cuando el sentinel sale de vista
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Si el sentinel NO es visible, el usuario ha scrolleado
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-30px 0px 0px 0px' }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    setProfileMenuOpen(false);
  };

  // Verificar si tenemos venueSlug
  const hasVenueContext = !!venueSlug;
  const eventsLink = hasVenueContext ? `/venues/${venueSlug}/events` : '#';

  // Si estamos en la página de detalle de evento, wallet, group guest, calendar o all-events, mostrar navbar simplificado
  if (isEventDetailPage || isWalletPage || isGroupGuestPage || isCalendarPage || isAllEventsPage) {
    const handleBack = isWalletPage
      ? handleBackFromWallet
      : isGroupGuestPage
        ? handleBackFromGroupGuest
        : handleBackToVenue;

    return (
      <nav className={`venue-navbar venue-navbar--centered ${scrolled ? 'venue-navbar--scrolled' : ''}`}>
        <div className="venue-navbar__container">
          <div className="venue-navbar__content venue-navbar__content--centered">
            <button
              onClick={handleBack}
              className="venue-navbar__back-button"
              aria-label="Back"
            >
              <ChevronLeft size={24} />
            </button>

            <div className="venue-navbar__logo venue-navbar__logo--centered">
              <img src={PullLogo} alt="Pull" />
            </div>

            {isAuthenticated ? (
              <div className="venue-navbar__profile">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="venue-navbar__profile-button"
                >
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} />
                  ) : (
                    <User size={18} />
                  )}
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
                        <p className="venue-navbar__profile-name">
                          {user?.name} {user?.surname}
                        </p>
                        <p className="venue-navbar__profile-email">{user?.email}</p>
                        <span className={`venue-navbar__profile-tier venue-navbar__profile-tier--${user?.tier}`}>
                          {user?.tier.toUpperCase()}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="venue-navbar__profile-logout"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="venue-navbar__link venue-navbar__link--primary"
              >
                <User size={18} />
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`venue-navbar ${scrolled ? 'venue-navbar--scrolled' : ''}`}>
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
                <span>Events</span>
              </NavLink>
            )}

            {isAuthenticated ? (
              <>
                <NavLink
                  to="/wallet"
                  className="venue-navbar__link"
                >
                  <Wallet size={18} />
                  <span>Wallet</span>
                </NavLink>

                <div className="venue-navbar__profile">
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="venue-navbar__profile-button"
                  >
                    {user?.profile_image ? (
                      <img src={user.profile_image} alt={user.name} />
                    ) : (
                      <User size={18} />
                    )}
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
                          <p className="venue-navbar__profile-name">
                            {user?.name} {user?.surname}
                          </p>
                          <p className="venue-navbar__profile-email">{user?.email}</p>
                          <span className={`venue-navbar__profile-tier venue-navbar__profile-tier--${user?.tier}`}>
                            {user?.tier.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="venue-navbar__profile-logout"
                        >
                          <LogOut size={16} />
                          <span>Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <NavLink
                to="/login"
                className="venue-navbar__link venue-navbar__link--primary"
              >
                <User size={18} />
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};