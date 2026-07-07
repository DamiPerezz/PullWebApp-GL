// components/cookie-banner/cookie-banner.tsx
// Cookie Consent Banner for Pull with i18n support
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const currentLang = lang || 'es';

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

  // Helper to build language-prefixed URLs
  const buildUrl = (path: string) => `/${currentLang}${path}`;

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
                  {t('cookies.banner.message')}{' '}
                  <Link to={buildUrl("/cookie-policy")} className="cookie-banner__link">
                    {t('cookies.banner.policy')}
                  </Link>.
                </p>
              </div>
            </div>
            <div className="cookie-banner__actions">
              <button
                className="cookie-banner__btn cookie-banner__btn--secondary"
                onClick={rejectNonEssential}
              >
                {t('buttons.necessaryOnly')}
              </button>
              <button
                className="cookie-banner__btn cookie-banner__btn--tertiary"
                onClick={handleOpenConfig}
              >
                <Settings size={16} />
                {t('buttons.customize')}
              </button>
              <button
                className="cookie-banner__btn cookie-banner__btn--primary"
                onClick={acceptAll}
              >
                {t('buttons.acceptAll')}
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
                <h2 className="cookie-modal__title">{t('cookies.modal.title')}</h2>
              </div>
              <button className="cookie-modal__close" onClick={closeConfigModal}>
                <X size={20} />
              </button>
            </div>

            {/* Description */}
            <div className="cookie-modal__description">
              <p>{t('cookies.modal.description')}</p>
              <Link to={buildUrl("/cookie-policy")} className="cookie-modal__policy-link" onClick={closeConfigModal}>
                {t('cookies.modal.viewPolicy')}
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
                      <h3 className="cookie-category__name">{t('cookies.modal.necessary.title')}</h3>
                      <span className="cookie-category__badge cookie-category__badge--required">
                        {t('cookies.modal.necessary.badge')}
                      </span>
                    </div>
                  </div>
                  <div className="cookie-category__toggle cookie-category__toggle--disabled">
                    <Check size={16} />
                  </div>
                </div>
                <p className="cookie-category__description">
                  {t('cookies.modal.necessary.description')}
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
                      <h3 className="cookie-category__name">{t('cookies.modal.analytics.title')}</h3>
                      <span className="cookie-category__badge cookie-category__badge--optional">
                        {t('cookies.modal.analytics.badge')}
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
                  {t('cookies.modal.analytics.description')}
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
                      <h3 className="cookie-category__name">{t('cookies.modal.marketing.title')}</h3>
                      <span className="cookie-category__badge cookie-category__badge--optional">
                        {t('cookies.modal.marketing.badge')}
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
                  {t('cookies.modal.marketing.description')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="cookie-modal__actions">
              <button
                className="cookie-modal__btn cookie-modal__btn--secondary"
                onClick={rejectNonEssential}
              >
                {t('cookies.modal.rejectOptional')}
              </button>
              <button
                className="cookie-modal__btn cookie-modal__btn--primary"
                onClick={handleSavePreferences}
              >
                {t('cookies.modal.savePreferences')}
              </button>
              <button
                className="cookie-modal__btn cookie-modal__btn--accept-all"
                onClick={acceptAll}
              >
                {t('buttons.acceptAll')}
              </button>
            </div>

            {/* Footer note */}
            <div className="cookie-modal__footer">
              <p>{t('cookies.modal.footerNote')}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Export a button to open settings from footer
export const CookieSettingsButton = () => {
  const { t } = useTranslation();
  const { openConfigModal } = useCookieConsent();

  return (
    <button className="cookie-settings-btn" onClick={openConfigModal}>
      <Cookie size={14} />
      {t('footer.cookies')}
    </button>
  );
};
