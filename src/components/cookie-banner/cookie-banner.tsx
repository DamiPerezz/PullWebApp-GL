// components/cookie-banner/cookie-banner.tsx
// Cookie Consent Banner for Pull
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCookieConsent, type CookiePreferences } from '../../context/CookieConsentContext';
import {
  Cookie,
  X,
  Shield,
  BarChart3,
  Megaphone,
  ChevronRight,
  Settings,
  Check
} from 'lucide-react';
import './cookie-banner.css';

export const CookieBanner = () => {
  const {
    preferences,
    showBanner,
    showConfigModal,
    acceptAll,
    rejectNonEssential,
    savePreferences,
    openConfigModal,
    closeConfigModal,
  } = useCookieConsent();

  // Local state for config modal
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
  });

  // Reset local prefs when modal opens
  const handleOpenConfig = () => {
    setLocalPrefs({
      necessary: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    });
    openConfigModal();
  };

  // Save custom preferences
  const handleSavePreferences = () => {
    savePreferences(localPrefs);
  };

  // Don't render if banner shouldn't show and modal is closed
  if (!showBanner && !showConfigModal) {
    return null;
  }

  return (
    <>
      {/* ========================================
          MINIMAL BANNER
      ======================================== */}
      {showBanner && !showConfigModal && (
        <div className="cookie-banner">
          <div className="cookie-banner__container">
            <div className="cookie-banner__content">
              <div className="cookie-banner__icon">
                <Cookie size={24} />
              </div>
              <div className="cookie-banner__text">
                <p className="cookie-banner__message">
                  We use cookies to enhance your experience. By continuing to browse, you accept our{' '}
                  <Link to="/cookie-policy" className="cookie-banner__link">
                    cookie policy
                  </Link>.
                </p>
              </div>
            </div>
            <div className="cookie-banner__actions">
              <button
                className="cookie-banner__btn cookie-banner__btn--secondary"
                onClick={rejectNonEssential}
              >
                Necessary only
              </button>
              <button
                className="cookie-banner__btn cookie-banner__btn--tertiary"
                onClick={handleOpenConfig}
              >
                <Settings size={16} />
                Customize
              </button>
              <button
                className="cookie-banner__btn cookie-banner__btn--primary"
                onClick={acceptAll}
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          CONFIGURATION MODAL
      ======================================== */}
      {showConfigModal && (
        <div className="cookie-modal-overlay" onClick={closeConfigModal}>
          <div className="cookie-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="cookie-modal__header">
              <div className="cookie-modal__title-row">
                <div className="cookie-modal__icon">
                  <Cookie size={24} />
                </div>
                <h2 className="cookie-modal__title">Cookie Settings</h2>
              </div>
              <button className="cookie-modal__close" onClick={closeConfigModal}>
                <X size={20} />
              </button>
            </div>

            {/* Description */}
            <div className="cookie-modal__description">
              <p>
                We use cookies and similar technologies to enhance your experience on our platform.
                You can choose which categories of cookies you want to allow. Necessary cookies are
                essential for the site to function and cannot be disabled.
              </p>
              <Link to="/cookie-policy" className="cookie-modal__policy-link" onClick={closeConfigModal}>
                View full cookie policy
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Cookie Categories */}
            <div className="cookie-modal__categories">
              {/* Necessary - Always enabled */}
              <div className="cookie-category cookie-category--necessary">
                <div className="cookie-category__header">
                  <div className="cookie-category__info">
                    <div className="cookie-category__icon cookie-category__icon--necessary">
                      <Shield size={20} />
                    </div>
                    <div className="cookie-category__text">
                      <h3 className="cookie-category__name">Necessary Cookies</h3>
                      <span className="cookie-category__badge cookie-category__badge--required">
                        Always active
                      </span>
                    </div>
                  </div>
                  <div className="cookie-category__toggle cookie-category__toggle--disabled">
                    <Check size={16} />
                  </div>
                </div>
                <p className="cookie-category__description">
                  Essential for the site to function. Includes authentication,
                  security, and basic preferences. Without these cookies, the site cannot work properly.
                </p>
              </div>

              {/* Analytics */}
              <div className={`cookie-category ${localPrefs.analytics ? 'cookie-category--enabled' : ''}`}>
                <div className="cookie-category__header">
                  <div className="cookie-category__info">
                    <div className="cookie-category__icon cookie-category__icon--analytics">
                      <BarChart3 size={20} />
                    </div>
                    <div className="cookie-category__text">
                      <h3 className="cookie-category__name">Analytics Cookies</h3>
                      <span className="cookie-category__badge cookie-category__badge--optional">
                        Optional
                      </span>
                    </div>
                  </div>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={localPrefs.analytics}
                      onChange={(e) => setLocalPrefs({ ...localPrefs, analytics: e.target.checked })}
                    />
                    <span className="cookie-toggle__slider"></span>
                  </label>
                </div>
                <p className="cookie-category__description">
                  Help us understand how you interact with the site, which pages you visit, and
                  where we can improve. We use Google Analytics 4 with anonymized data.
                </p>
              </div>

              {/* Marketing - Future */}
              <div className={`cookie-category ${localPrefs.marketing ? 'cookie-category--enabled' : ''}`}>
                <div className="cookie-category__header">
                  <div className="cookie-category__info">
                    <div className="cookie-category__icon cookie-category__icon--marketing">
                      <Megaphone size={20} />
                    </div>
                    <div className="cookie-category__text">
                      <h3 className="cookie-category__name">Marketing Cookies</h3>
                      <span className="cookie-category__badge cookie-category__badge--optional">
                        Optional
                      </span>
                    </div>
                  </div>
                  <label className="cookie-toggle">
                    <input
                      type="checkbox"
                      checked={localPrefs.marketing}
                      onChange={(e) => setLocalPrefs({ ...localPrefs, marketing: e.target.checked })}
                    />
                    <span className="cookie-toggle__slider"></span>
                  </label>
                </div>
                <p className="cookie-category__description">
                  Allow personalized ads and measure the effectiveness of advertising campaigns.
                  We currently do not use marketing cookies, but may implement them in the future.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="cookie-modal__actions">
              <button
                className="cookie-modal__btn cookie-modal__btn--secondary"
                onClick={rejectNonEssential}
              >
                Reject optional
              </button>
              <button
                className="cookie-modal__btn cookie-modal__btn--primary"
                onClick={handleSavePreferences}
              >
                Save preferences
              </button>
              <button
                className="cookie-modal__btn cookie-modal__btn--accept-all"
                onClick={acceptAll}
              >
                Accept all
              </button>
            </div>

            {/* Footer note */}
            <div className="cookie-modal__footer">
              <p>
                You can change your preferences at any time from the
                "Cookie settings" link in the footer.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Export a button to open settings from footer
export const CookieSettingsButton = () => {
  const { openConfigModal } = useCookieConsent();

  return (
    <button className="cookie-settings-btn" onClick={openConfigModal}>
      <Cookie size={14} />
      Cookie settings
    </button>
  );
};
