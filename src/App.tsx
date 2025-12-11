// App.tsx - COMPLETO Y CORREGIDO
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CookieConsentProvider } from "./context/CookieConsentContext";
import { Loader2 } from "lucide-react";

// Pages
import { VenuesPage } from "./pages/venues-page/venues-page";
import { EventsPage } from "./pages/events-page/events-page";
import { CookiePolicyPage } from "./pages/cookie-policy-page/cookie-policy-page";
import { PrivacyPolicyPage } from "./pages/privacy-policy-page/privacy-policy-page";
import { TermsOfServicePage } from "./pages/terms-of-service-page/terms-of-service-page";

// Cookie Banner
import { CookieBanner } from "./components/cookie-banner/cookie-banner";
import { WalletPage } from "./pages/wallet-page/wallet-page";
import { AboutUsPage } from "./pages/about-us/about-us";
import { VenueEventsPage } from "./pages/venue-event-page/event-venue-page";
import { AllVenueEventsPage } from "./pages/all-venue-events-page/all-venue-events-page";
import { VenueCalendarPage } from "./pages/venue-calendar-page/venue-calendar-page";
import { EventDetailedPage } from "./pages/event-detailed-page/event-detailed-page";
import { PrePurchasePage } from "./pages/pre-purchase-page/pre-purchase-page";
import { PaymentPage } from "./pages/payment-page/payment-page";
import { PostPaymentPage } from "./pages/post-payment/post-payment";
import { PaymentSuccessPage } from "./pages/payment-success/payment-success";
import { PaymentCancelPage } from "./pages/payment-cancel/payment-cancel";
import { GroupReservationSetupPage } from "./pages/group-reservation-setup-page/group-reservation-setup-page";
import { GroupReservationGuestsPage } from "./pages/group-reservation-guests-page/group-reservation-guests-page";
import { GroupReservationConfirmationPage } from "./pages/group-reservation-confirmation-page/group-reservation-confirmation-page";
import { GroupReservationTrackingPage } from "./pages/group-reservation-tracking-page/group-reservation-tracking-page";
import { GroupPaymentSuccessPage } from "./pages/group-payment-success-page/group-payment-success-page";
import { GroupPaymentCancelPage } from "./pages/group-payment-cancel-page/group-payment-cancel-page";
import { GroupGuestCompletePage } from "./pages/group-guest-complete-page/group-guest-complete-page";
import { LoginPage } from "./pages/login-page/login-page";
import { NotFoundPage } from "./pages/not-found-page/not-found-page";

// Components
import { VenueNavBar } from "./components/venue-nav-bar/venue-nav-bar";
import { Footer } from "./components/footer/footer";

// ========================================
// PROTECTED ROUTE COMPONENT
// ========================================
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <>
        <VenueNavBar />
        <div className="protected-route-loading">
          <div className="protected-route-loading__content">
            <Loader2 size={48} className="protected-route-loading__spinner" />
            <p className="protected-route-loading__text">Loading your account...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ========================================
// LAYOUT COMPONENTS
// ========================================
const GeneralLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <VenueNavBar />
    {children}
  </>
);

const VenueLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <VenueNavBar />
    {children}
  </>
);

// ========================================
// MAIN APP COMPONENT
// ========================================
export default function App() {
  return (
    <CookieConsentProvider>
      <AuthProvider>
        <Routes>
        {/* ========================================
            ROOT REDIRECT
        ======================================== */}
        <Route path="/" element={<Navigate to="/venues/plus-club/events" replace />} />

        {/* ========================================
            PUBLIC ROUTES - General Layout
        ======================================== */}
        <Route
          path="/venues"
          element={
            <GeneralLayout>
              <VenuesPage />
            </GeneralLayout>
          }
        />

        <Route
          path="/events"
          element={
            <GeneralLayout>
              <EventsPage />
            </GeneralLayout>
          }
        />

        <Route
          path="/aboutUs"
          element={
            <GeneralLayout>
              <AboutUsPage />
            </GeneralLayout>
          }
        />

        {/* ========================================
            AUTH ROUTES - No Layout
        ======================================== */}
        <Route path="/login" element={<LoginPage />} />

        {/* ========================================
            VENUE & EVENT ROUTES - Venue Layout
        ======================================== */}
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

        {/* ========================================
            REGULAR TICKET PURCHASE FLOW
            (1-3 tickets)
        ======================================== */}

        {/* Step 1: Select quantity (max 3) */}
        <Route
          path="/event/:eventId/tickets/:ticketTypeId"
          element={
            <VenueLayout>
              <PrePurchasePage />
            </VenueLayout>
          }
        />

        {/* Step 2: Enter data and process payment */}
        <Route
          path="/event/:eventId/tickets/:ticketTypeId/:quantity"
          element={
            <VenueLayout>
              <PaymentPage />
            </VenueLayout>
          }
        />

        {/* Step 3: Payment success confirmation */}
        <Route
          path="/order/payment-success"
          element={
            <VenueLayout>
              <PaymentSuccessPage />
            </VenueLayout>
          }
        />

        {/* Payment cancellation */}
        <Route
          path="/order/payment-cancel"
          element={
            <VenueLayout>
              <PaymentCancelPage />
            </VenueLayout>
          }
        />

        {/* View tickets after staff approval - PUBLIC */}
        <Route
          path="/post-purchase/:orderId/:eventSlug"
          element={
            <VenueLayout>
              <PostPaymentPage />
            </VenueLayout>
          }
        />

        {/* ========================================
            GROUP RESERVATION FLOW
            (4-30 people, optional bottles, staff approval)
        ======================================== */}

        {/* Step 1: Select guest count, bottles, organizer data */}
        <Route
          path="/event/:eventId/group/setup"
          element={
            <VenueLayout>
              <GroupReservationSetupPage />
            </VenueLayout>
          }
        />

        {/* Step 2: Fill guest details and mark who host pays for */}
        <Route
          path="/event/:eventId/group/guests"
          element={
            <VenueLayout>
              <GroupReservationGuestsPage />
            </VenueLayout>
          }
        />

        {/* Step 3: Confirmation page - shown immediately after creating reservation */}
        <Route
          path="/group/confirmation"
          element={
            <GroupReservationConfirmationPage />
          }
        />

        {/* Shareable tracking page - guests can view and pay using payment link */}
        <Route
          path="/group/track/:paymentLinkCode"
          element={
            <VenueLayout>
              <GroupReservationTrackingPage />
            </VenueLayout>
          }
        />

        {/* Group payment success */}
        <Route
          path="/group/payment/success"
          element={
            <GroupPaymentSuccessPage />
          }
        />

        {/* Group payment cancel */}
        <Route
          path="/group/payment/cancel"
          element={
            <GroupPaymentCancelPage />
          }
        />

        {/* Guest complete data page - uses verification code (legacy) */}
        <Route
          path="/group/complete/:verificationCode"
          element={
            <GroupGuestCompletePage />
          }
        />

        {/* Guest complete data page - uses guest ID (new flow) */}
        <Route
          path="/group/guest/:guestId/complete"
          element={
            <GroupGuestCompletePage />
          }
        />

        {/* ========================================
            WALLET - PROTECTED ROUTES
            Requires authentication
        ======================================== */}

        {/* Main wallet page */}
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

        {/* Wallet with specific tickets */}
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

        {/* ========================================
            LEGAL PAGES - No NavBar Layout
        ======================================== */}
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />

        {/* ========================================
            404 NOT FOUND
        ======================================== */}
        <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Cookie Consent Banner - Shows on all pages */}
        <CookieBanner />
      </AuthProvider>
    </CookieConsentProvider>
  );
}