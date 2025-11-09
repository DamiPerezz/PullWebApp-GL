import { useState, useEffect, type CSSProperties } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import "./nav-bar.css";

import PullLogo from "../../assets/logo.svg";

export const NavBar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Venues", to: "/venues" },
    { name: "Events", to: "/events" },
    { name: "Wallet", to: "/wallet" },
    { name: "About Us", to: "/aboutUs" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="navbar__container">
        <div className="navbar__content">
          <NavLink to="/venues" className="navbar__logo" aria-label="Pull Home">
            <img src={PullLogo} alt="Pull" />
          </NavLink>

          <div className="navbar__links">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={`navbar__link ${
                  isActive(link.to) ? "navbar__link--active" : ""
                }`}
              >
                <span className="navbar__link-text">{link.name}</span>
                <span className="navbar__link-indicator" />
              </NavLink>
            ))}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="navbar__toggle"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <span className="navbar__toggle-icon">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </span>
          </button>
        </div>
      </div>

      <div className={`navbar__mobile ${mobileMenuOpen ? "navbar__mobile--open" : ""}`}>
        <div
          className="navbar__mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className="navbar__mobile-content">
          <div className="navbar__mobile-header">
            <span className="navbar__mobile-title">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="navbar__mobile-close"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="navbar__mobile-nav">
            {navLinks.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={`navbar__mobile-link ${
                  isActive(link.to) ? "navbar__mobile-link--active" : ""
                }`}
                style={{ "--delay": `${index * 0.05}s` } as CSSProperties}
              >
                <span className="navbar__mobile-link-text">{link.name}</span>
                <span className="navbar__mobile-link-arrow">→</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </nav>
  );
};
