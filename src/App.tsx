// App.tsx - OPTIMIZED WITH CODE SPLITTING, LAZY LOADING & i18n
import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CookieConsentProvider } from "./context/CookieConsentContext";
import { Loader2 } from "lucide-react";

// ========================================
// SUPPORTED LANGUAGES
// ========================================
const SUPPORTED_LANGUAGES = ['en', 'es'] as const;
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// ========================================
// LAZY LOADED PAGES - Code Splitting
// Each page loads only when needed
// ========================================

// Core pages (loaded with slight delay acceptable)
// VenuesPage - Available but not in routes yet
const VenueEventsPage = lazy(() => import("./pages/venue-event-page/event-venue-page").then(m => ({ default: m.VenueEventsPage })));
const AllVenueEventsPage = lazy(() => import("./pages/all-venue-events-page/all-venue-events-page").then(m => ({ default: m.AllVenueEventsPage })));
const VenueCalendarPage = lazy(() => import("./pages/venue-calendar-page/venue-calendar-page").then(m => ({ default: m.VenueCalendarPage })));
const EventDetailedPage = lazy(() => import("./pages/event-detailed-page/event-detailed-page").then(m => ({ default: m.EventDetailedPage })));

// Purchase flow pages
const PrePurchasePage = lazy(() => import("./pages/pre-purchase-page/pre-purchase-page").then(m => ({ default: m.PrePurchasePage })));
const PaymentPage = lazy(() => import("./pages/payment-page/payment-page").then(m => ({ default: m.PaymentPage })));
const PaymentSuccessPage = lazy(() => import("./pages/payment-success/payment-success").then(m => ({ default: m.PaymentSuccessPage })));
const PaymentCancelPage = lazy(() => import("./pages/payment-cancel/payment-cancel").then(m => ({ default: m.PaymentCancelPage })));
const PostPaymentPage = lazy(() => import("./pages/post-payment/post-payment").then(m => ({ default: m.PostPaymentPage })));

// Group reservation pages (heavy, load only when needed)
const GroupReservationSetupPage = lazy(() => import("./pages/group-reservation-setup-page/group-reservation-setup-page").then(m => ({ default: m.GroupReservationSetupPage })));
const GroupReservationGuestsPage = lazy(() => import("./pages/group-reservation-guests-page/group-reservation-guests-page").then(m => ({ default: m.GroupReservationGuestsPage })));
const GroupReservationConfirmationPage = lazy(() => import("./pages/group-reservation-confirmation-page/group-reservation-confirmation-page").then(m => ({ default: m.GroupReservationConfirmationPage })));
const GroupReservationTrackingPage = lazy(() => import("./pages/group-reservation-tracking-page/group-reservation-tracking-page").then(m => ({ default: m.GroupReservationTrackingPage })));
const GroupPaymentSuccessPage = lazy(() => import("./pages/group-payment-success-page/group-payment-success-page").then(m => ({ default: m.GroupPaymentSuccessPage })));
const GroupPaymentCancelPage = lazy(() => import("./pages/group-payment-cancel-page/group-payment-cancel-page").then(m => ({ default: m.GroupPaymentCancelPage })));
const GroupGuestCompletePage = lazy(() => import("./pages/group-guest-complete-page/group-guest-complete-page").then(m => ({ default: m.GroupGuestCompletePage })));

// Guest List pages (free lists)
const GuestListSignupPage = lazy(() => import("./pages/guest-list-signup-page/guest-list-signup-page").then(m => ({ default: m.GuestListSignupPage })));
const GuestListConfirmationPage = lazy(() => import("./pages/guest-list-confirmation-page/guest-list-confirmation-page").then(m => ({ default: m.GuestListConfirmationPage })));

// VIP List pages (staff-created lists with deferred payment)
const VIPListTrackingPage = lazy(() => import("./pages/vip-list-tracking-page/vip-list-tracking-page").then(m => ({ default: m.VIPListTrackingPage })));
const VIPListPaymentPage = lazy(() => import("./pages/vip-list-payment-page/vip-list-payment-page").then(m => ({ default: m.VIPListPaymentPage })));
const VIPListEditPage = lazy(() => import("./pages/vip-list-edit-page/vip-list-edit-page").then(m => ({ default: m.VIPListEditPage })));
const VIPListBottleSelectionPage = lazy(() => import("./pages/vip-list-bottle-selection/vip-list-bottle-selection").then(m => ({ default: m.VIPListBottleSelectionPage })));

// Auth & Wallet pages
const LoginPage = lazy(() => import("./pages/login-page/login-page").then(m => ({ default: m.LoginPage })));
const WalletPage = lazy(() => import("./pages/wallet-page/wallet-page").then(m => ({ default: m.WalletPage })));

// Legal pages (rarely accessed, perfect for lazy loading)
const CookiePolicyPage = lazy(() => import("./pages/cookie-policy-page/cookie-policy-page").then(m => ({ default: m.CookiePolicyPage })));
const PrivacyPolicyPage = lazy(() => import("./pages/privacy-policy-page/privacy-policy-page").then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import("./pages/terms-of-service-page/terms-of-service-page").then(m => ({ default: m.TermsOfServicePage })));
// AboutUsPage - Not implemented yet
const NotFoundPage = lazy(() => import("./pages/not-found-page/not-found-page").then(m => ({ default: m.NotFoundPage })));

// Components loaded immediately (small, needed for layout)
import { VenueNavBar } from "./components/venue-nav-bar/venue-nav-bar";
import { Footer } from "./components/footer/footer";
import { CookieBanner } from "./components/cookie-banner/cookie-banner";
import { MobileTabBar } from "./components/mobile-tab-bar/mobile-tab-bar";

// ========================================
// LOADING FALLBACK COMPONENT
// Minimal, fast-loading spinner
// ========================================
const PageLoader = () => (
  <div className="page-loader">
    <div className="page-loader__content">
      <Loader2 size={40} className="page-loader__spinner" />
    </div>
  </div>
);

// ========================================
// LANGUAGE DETECTION & REDIRECT
// Detects user's preferred language and redirects
// ========================================
const LanguageDetector = () => {
  const getPreferredLanguage = (): SupportedLanguage => {
    // 1. Check localStorage for saved preference
    const stored = localStorage.getItem('preferred-language');
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }

    // 2. Check browser language
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    if (browserLang === 'es') {
      return 'es';
    }

    // 3. Default to Spanish for Guatemala market
    return 'es';
  };

  const lang = getPreferredLanguage();
  return <Navigate to={`/${lang}/venues/aurora-hall/events`} replace />;
};

// ========================================
// LEGACY URL REDIRECT
// Redirects old URLs without language prefix to new format
// ========================================
const LegacyUrlRedirect = () => {
  const location = useLocation();

  const getPreferredLanguage = (): SupportedLanguage => {
    const stored = localStorage.getItem('preferred-language');
    if (stored && SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }
    return 'es';
  };

  const lang = getPreferredLanguage();
  const newPath = `/${lang}${location.pathname}${location.search}${location.hash}`;

  return <Navigate to={newPath} replace />;
};

// ========================================
// LANGUAGE WRAPPER
// Validates language param and syncs with i18n
// ========================================
const LanguageWrapper = ({ children }: { children: React.ReactNode }) => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();

  // Validate language parameter
  const isValidLang = lang && SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);

  useEffect(() => {
    if (isValidLang && i18n.language !== lang) {
      i18n.changeLanguage(lang);
      localStorage.setItem('preferred-language', lang);
    }
  }, [lang, i18n, isValidLang]);

  // If invalid language, redirect to default
  if (!isValidLang) {
    return <Navigate to="/es/venues/aurora-hall/events" replace />;
  }

  return <>{children}</>;
};

// ========================================
// PROTECTED ROUTE COMPONENT
// ========================================
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <>
        <VenueNavBar />
        <div className="protected-route-loading">
          <div className="protected-route-loading__content">
            <Loader2 size={48} className="protected-route-loading__spinner" />
            <p className="protected-route-loading__text">{t('loading.account')}</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to={`/${lang}/login`} replace />;
};

// ========================================
// LAYOUT COMPONENTS
// ========================================
const VenueLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <VenueNavBar />
    {children}
  </>
);

// ========================================
// APP ROUTES - All routes with language prefix
// ========================================
const AppRoutes = () => {
  return (
    <Routes>
      {/* DEFAULT REDIRECT */}
      <Route path="/" element={<Navigate to="venues/aurora-hall/events" replace />} />

      {/* PUBLIC ROUTES - Redirect /venues to Plus venue */}
      <Route
        path="/venues"
        element={<Navigate to="aurora-hall/events" replace />}
      />

      {/* /events and /aboutUs routes - Not implemented yet */}

      {/* AUTH ROUTES */}
      <Route path="/login" element={<LoginPage />} />

      {/* VENUE & EVENT ROUTES */}
      <Route
        path="/venues/:venueId/events/"
        element={
          <VenueLayout>
            <VenueEventsPage />
          </VenueLayout>
        }
      />

      <Route
        path="/venues/:venueId/calendar"
        element={
          <VenueLayout>
            <VenueCalendarPage />
          </VenueLayout>
        }
      />

      <Route
        path="/venues/:venueId/all-events"
        element={
          <VenueLayout>
            <AllVenueEventsPage />
          </VenueLayout>
        }
      />

      <Route
        path="/event/:eventId"
        element={
          <VenueLayout>
            <EventDetailedPage />
          </VenueLayout>
        }
      />

      {/* REGULAR TICKET PURCHASE FLOW */}
      <Route
        path="/event/:eventId/tickets/:ticketTypeId"
        element={
          <VenueLayout>
            <PrePurchasePage />
          </VenueLayout>
        }
      />

      <Route
        path="/event/:eventId/tickets/:ticketTypeId/:quantity"
        element={
          <VenueLayout>
            <PaymentPage />
          </VenueLayout>
        }
      />

      <Route
        path="/order/payment-success"
        element={
          <VenueLayout>
            <PaymentSuccessPage />
          </VenueLayout>
        }
      />

      <Route
        path="/order/payment-cancel"
        element={
          <VenueLayout>
            <PaymentCancelPage />
          </VenueLayout>
        }
      />

      <Route
        path="/post-purchase/:orderId/:eventSlug"
        element={
          <VenueLayout>
            <PostPaymentPage />
          </VenueLayout>
        }
      />

      {/* GROUP RESERVATION FLOW */}
      <Route
        path="/event/:eventId/group/setup"
        element={
          <VenueLayout>
            <GroupReservationSetupPage />
          </VenueLayout>
        }
      />

      <Route
        path="/event/:eventId/group/guests"
        element={
          <VenueLayout>
            <GroupReservationGuestsPage />
          </VenueLayout>
        }
      />

      <Route path="/group/confirmation" element={<GroupReservationConfirmationPage />} />

      <Route
        path="/group/track/:paymentLinkCode"
        element={
          <VenueLayout>
            <GroupReservationTrackingPage />
          </VenueLayout>
        }
      />

      <Route path="/group/payment/success" element={<GroupPaymentSuccessPage />} />
      <Route path="/group/payment/cancel" element={<GroupPaymentCancelPage />} />
      <Route path="/group/complete/:verificationCode" element={<GroupGuestCompletePage />} />
      <Route path="/group/guest/:guestId/complete" element={<GroupGuestCompletePage />} />

      {/* GUEST LIST FLOW (Free Lists) */}
      <Route
        path="/event/:eventId/list/:guestListTypeId"
        element={
          <VenueLayout>
            <GuestListSignupPage />
          </VenueLayout>
        }
      />
      <Route path="/list/confirmation" element={<GuestListConfirmationPage />} />

      {/* VIP LIST FLOW (Staff-created with deferred payment) */}
      <Route
        path="/vip/track/:trackingCode"
        element={
          <VenueLayout>
            <VIPListTrackingPage />
          </VenueLayout>
        }
      />
      <Route
        path="/vip/pay/:guestId"
        element={
          <VenueLayout>
            <VIPListPaymentPage />
          </VenueLayout>
        }
      />
      <Route
        path="/vip/edit/:editCode"
        element={
          <VenueLayout>
            <VIPListEditPage />
          </VenueLayout>
        }
      />
      <Route
        path="/vip/bottles/:token"
        element={
          <VenueLayout>
            <VIPListBottleSelectionPage />
          </VenueLayout>
        }
      />

      {/* WALLET - PROTECTED ROUTES */}
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <VenueLayout>
              <WalletPage />
            </VenueLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/wallet/:orderId/:eventSlug"
        element={
          <ProtectedRoute>
            <VenueLayout>
              <PostPaymentPage />
            </VenueLayout>
          </ProtectedRoute>
        }
      />

      {/* LEGAL PAGES */}
      <Route path="/cookie-policy" element={<CookiePolicyPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />

      {/* 404 NOT FOUND */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

// ========================================
// MAIN APP COMPONENT
// ========================================
export default function App() {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ROOT - Language Detection & Redirect */}
            <Route path="/" element={<LanguageDetector />} />

            {/* LANGUAGE-PREFIXED ROUTES */}
            <Route
              path="/:lang/*"
              element={
                <LanguageWrapper>
                  <AppRoutes />
                </LanguageWrapper>
              }
            />

            {/* LEGACY ROUTES - Redirect to language-prefixed version */}
            <Route path="/venues/*" element={<LegacyUrlRedirect />} />
            <Route path="/event/*" element={<LegacyUrlRedirect />} />
            <Route path="/order/*" element={<LegacyUrlRedirect />} />
            <Route path="/group/*" element={<LegacyUrlRedirect />} />
            <Route path="/list/*" element={<LegacyUrlRedirect />} />
            <Route path="/vip/*" element={<LegacyUrlRedirect />} />
            <Route path="/wallet/*" element={<LegacyUrlRedirect />} />
            <Route path="/login" element={<LegacyUrlRedirect />} />
            <Route path="/cookie-policy" element={<LegacyUrlRedirect />} />
            <Route path="/privacy" element={<LegacyUrlRedirect />} />
            <Route path="/terms" element={<LegacyUrlRedirect />} />
            <Route path="/aboutUs" element={<LegacyUrlRedirect />} />
            <Route path="/events" element={<LegacyUrlRedirect />} />

            {/* CATCH-ALL 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        {/* Cookie Consent Banner */}
        <CookieBanner />

        {/* Mobile Tab Bar - Only visible on mobile */}
        <MobileTabBar />
      </AuthProvider>
    </CookieConsentProvider>
  );
}
