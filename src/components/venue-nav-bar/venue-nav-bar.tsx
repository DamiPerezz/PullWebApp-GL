import { useState, useEffect } from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import { Menu, X, Calendar, Wallet, LogIn, User, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import "./venue-nav-bar.css";

import PullLogo from "../../assets/logo.svg";

export const VenueNavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { venueSlug } = useParams();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };

  // Verificar si tenemos venueSlug
  const hasVenueContext = !!venueSlug;
  const eventsLink = hasVenueContext ? `/venues/${venueSlug}/events` : '#';

  return (
    <nav className={`venue-navbar ${scrolled ? "venue-navbar--scrolled" : ""}`}>
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
                <LogIn size={18} />
                <span>Login</span>
              </NavLink>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="venue-navbar__toggle"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`venue-navbar__mobile ${mobileMenuOpen ? "venue-navbar__mobile--open" : ""}`}>
        <div className="venue-navbar__mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
        <div className="venue-navbar__mobile-content">
          <div className="venue-navbar__mobile-header">
            <span>Menu</span>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <nav className="venue-navbar__mobile-nav">
            {hasVenueContext && (
              <NavLink to={eventsLink} className="venue-navbar__mobile-link">
                <Calendar size={20} />
                <span>Events</span>
              </NavLink>
            )}

            {isAuthenticated ? (
              <>
                <NavLink to="/wallet" className="venue-navbar__mobile-link">
                  <Wallet size={20} />
                  <span>Wallet</span>
                </NavLink>

                <div className="venue-navbar__mobile-user">
                  <div className="venue-navbar__mobile-user-info">
                    <p>{user?.name} {user?.surname}</p>
                    <span className={`venue-navbar__tier--${user?.tier}`}>
                      {user?.tier.toUpperCase()}
                    </span>
                  </div>
                  <button onClick={handleLogout} className="venue-navbar__mobile-logout">
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <NavLink to="/login" className="venue-navbar__mobile-link venue-navbar__mobile-link--primary">
                <LogIn size={20} />
                <span>Login</span>
              </NavLink>
            )}
          </nav>
        </div>
      </div>
    </nav>
  );
};