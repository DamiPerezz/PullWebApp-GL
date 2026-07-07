// context/CookieConsentContext.tsx
// Cookie Consent Manager for Pull - GDPR/LOPD Compatible
import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

// Cookie categories
export interface CookiePreferences {
  necessary: boolean;     // Always true - cannot be disabled
  analytics: boolean;     // Google Analytics, etc.
  marketing: boolean;     // Future: advertising cookies
}

// Consent metadata
interface ConsentMetadata {
  version: string;
  timestamp: string;
  method: 'accept_all' | 'reject_all' | 'custom';
}

interface CookieConsentContextType {
  // State
  preferences: CookiePreferences;
  hasConsented: boolean;
  showBanner: boolean;
  showConfigModal: boolean;
  consentMetadata: ConsentMetadata | null;

  // Actions
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: Partial<CookiePreferences>) => void;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  resetConsent: () => void;
}

const CONSENT_STORAGE_KEY = 'pull_cookie_consent';
const CONSENT_VERSION = '1.0';

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);
  const [hasConsented, setHasConsented] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [consentMetadata, setConsentMetadata] = useState<ConsentMetadata | null>(null);

  // Load consent from localStorage on mount
  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);

        if (stored) {
          const data = JSON.parse(stored);

          // Check if consent version matches
          if (data.version === CONSENT_VERSION) {
            setPreferences({
              necessary: true, // Always true
              analytics: data.preferences?.analytics ?? false,
              marketing: data.preferences?.marketing ?? false,
            });
            setConsentMetadata(data.metadata);
            setHasConsented(true);
            setShowBanner(false);

            // Apply analytics if consented
            if (data.preferences?.analytics) {
              enableAnalytics();
            }
          } else {
            // Version mismatch - need new consent
            setShowBanner(true);
          }
        } else {
          // No consent stored - show banner
          setShowBanner(true);
        }
      } catch {
        // SECURITY: Silently handle errors to avoid exposing internal state
        setShowBanner(true);
      }
    };

    // Small delay to prevent flash
    const timer = setTimeout(loadConsent, 500);
    return () => clearTimeout(timer);
  }, []);

  // Save consent to localStorage
  const saveConsent = useCallback((prefs: CookiePreferences, method: ConsentMetadata['method']) => {
    const metadata: ConsentMetadata = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      method,
    };

    const consentData = {
      version: CONSENT_VERSION,
      preferences: prefs,
      metadata,
    };

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentData));
      setPreferences(prefs);
      setConsentMetadata(metadata);
      setHasConsented(true);
      setShowBanner(false);
      setShowConfigModal(false);

      // Apply or revoke analytics based on preference
      if (prefs.analytics) {
        enableAnalytics();
      } else {
        disableAnalytics();
      }

      // Future: Handle marketing cookies
      if (prefs.marketing) {
        enableMarketing();
      } else {
        disableMarketing();
      }
    } catch {
      // SECURITY: Silently handle errors to avoid exposing internal state
    }
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted, 'accept_all');
  }, [saveConsent]);

  // Reject non-essential cookies
  const rejectNonEssential = useCallback(() => {
    const onlyNecessary: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    saveConsent(onlyNecessary, 'reject_all');
  }, [saveConsent]);

  // Save custom preferences
  const savePreferences = useCallback((prefs: Partial<CookiePreferences>) => {
    const newPrefs: CookiePreferences = {
      necessary: true, // Always true
      analytics: prefs.analytics ?? preferences.analytics,
      marketing: prefs.marketing ?? preferences.marketing,
    };
    saveConsent(newPrefs, 'custom');
  }, [preferences, saveConsent]);

  // Modal controls
  const openConfigModal = useCallback(() => {
    setShowConfigModal(true);
  }, []);

  const closeConfigModal = useCallback(() => {
    setShowConfigModal(false);
  }, []);

  // Reset consent (for testing or user request)
  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setPreferences(defaultPreferences);
    setHasConsented(false);
    setConsentMetadata(null);
    setShowBanner(true);
    setShowConfigModal(false);
    disableAnalytics();
    disableMarketing();
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        hasConsented,
        showBanner,
        showConfigModal,
        consentMetadata,
        acceptAll,
        rejectNonEssential,
        savePreferences,
        openConfigModal,
        closeConfigModal,
        resetConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within CookieConsentProvider');
  }
  return context;
};

// ============================================
// ANALYTICS & TRACKING FUNCTIONS
// ============================================

// SECURITY: Helper to get secure cookie attributes
const getSecureCookieAttributes = (): string => {
  const isSecure = window.location.protocol === 'https:';
  const baseAttrs = 'path=/; max-age=31536000; SameSite=Strict';
  return isSecure ? `${baseAttrs}; Secure` : baseAttrs;
};

// Enable Google Analytics (GA4)
function enableAnalytics() {
  // Check if gtag is available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    // Update consent mode
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'granted',
    });
  }

  // SECURITY: Set cookie with Secure attribute on HTTPS
  document.cookie = `analytics_consent=granted; ${getSecureCookieAttributes()}`;
}

// Disable Google Analytics
function disableAnalytics() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    // Update consent mode
    (window as any).gtag('consent', 'update', {
      analytics_storage: 'denied',
    });
  }

  // Remove analytics cookies
  const analyticsCookies = ['_ga', '_ga_', '_gid', '_gat'];
  analyticsCookies.forEach(name => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    // Also try with domain
    document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });

  // SECURITY: Set cookie with Secure attribute on HTTPS
  document.cookie = `analytics_consent=denied; ${getSecureCookieAttributes()}`;
}

// Enable Marketing cookies (for future use)
function enableMarketing() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  }
  // SECURITY: Set cookie with Secure attribute on HTTPS
  document.cookie = `marketing_consent=granted; ${getSecureCookieAttributes()}`;
}

// Disable Marketing cookies
function disableMarketing() {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }
  // SECURITY: Set cookie with Secure attribute on HTTPS
  document.cookie = `marketing_consent=denied; ${getSecureCookieAttributes()}`;
}
