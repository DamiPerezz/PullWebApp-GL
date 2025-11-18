import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { VenuesPage } from "./pages/venues-page/venues-page";
import { EventsPage } from "./pages/events-page/events-page";
import { WalletPage } from "./pages/wallet-page/wallet-page";
import { AboutUsPage } from "./pages/about-us/about-us";
import { VenueEventsPage } from "./pages/venue-event-page/event-venue-page";
import { EventDetailedPage } from "./pages/event-detailed-page/event-detailed-page";
import { PrePurchasePage } from "./pages/pre-purchase-page/pre-purchase-page";
import { PaymentPage } from "./pages/payment-page/payment-page";
import { PostPaymentPage } from "./pages/post-payment/post-payment";
import { PaymentSuccessPage } from "./pages/payment-success/payment-success";
import { PaymentCancelPage } from "./pages/payment-cancel/payment-cancel";
import { VIPTableSetupPage } from "./pages/vip-table-setup-page/vip-table-setup-page";
import { VIPConfirmPage } from "./pages/vip-confirm-page/vip-confirm-page";
import { VIPManagementPage } from "./pages/vip-management-page/vip-management-page";
import { VIPPaymentPage } from "./pages/vip-payment-page/vip-payment-page";
import { VIPPaymentSuccessPage } from "./pages/vip-payment-success-page/vip-payment-success-page";
import { LoginPage } from "./pages/login-page/login-page";
import { RegisterPage } from "./pages/register-page/register-page";
import { NotFoundPage } from "./pages/not-found-page/not-found-page";
import { NavBar } from "./components/nav-bar/nav-bar";
import { VenueNavBar } from "./components/venue-nav-bar/venue-nav-bar";

// Componente para rutas protegidas
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.15), rgba(17, 24, 39, 1))',
        color: 'white',
        fontSize: '1.125rem'
      }}>
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Layout con NavBar general
const GeneralLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <NavBar />
    {children}
  </>
);

// Layout con VenueNavBar
const VenueLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <VenueNavBar />
    {children}
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Redirect */}
        <Route path="/" element={<Navigate to="/venues" />} />

        {/* Rutas públicas con NavBar general */}
        <Route path="/venues" element={
          <GeneralLayout>
            <VenuesPage />
          </GeneralLayout>
        } />
        
        <Route path="/events" element={
          <GeneralLayout>
            <EventsPage />
          </GeneralLayout>
        } />

        <Route path="/aboutUs" element={
          <GeneralLayout>
            <AboutUsPage />
          </GeneralLayout>
        } />

        {/* Rutas de autenticación (sin navbar) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rutas de venue con VenueNavBar */}
        <Route path="/venues/:venueId/events/" element={
          <VenueLayout>
            <VenueEventsPage />
          </VenueLayout>
        } />

        <Route path="/event/:eventId" element={
          <VenueLayout>
            <EventDetailedPage />
          </VenueLayout>
        } />
        
        {/* Regular Ticket Purchase Flow */}
        <Route path="/event/:eventId/tickets/:ticketTypeId" element={
          <VenueLayout>
            <PrePurchasePage />
          </VenueLayout>
        } />

        <Route path="/event/:eventId/tickets/:ticketTypeId/:quantity" element={
          <VenueLayout>
            <PaymentPage />
          </VenueLayout>
        } />

        <Route path="/payment/success" element={
          <VenueLayout>
            <PaymentSuccessPage />
          </VenueLayout>
        } />

        <Route path="/payment/cancel" element={
          <VenueLayout>
            <PaymentCancelPage />
          </VenueLayout>
        } />

        {/* Post-Purchase Page - PÚBLICA (sin autenticación requerida) */}
        <Route path="/post-purchase/:orderId/:eventSlug" element={
          <VenueLayout>
            <PostPaymentPage />
          </VenueLayout>
        } />
        
        {/* VIP Table Reservation Flow */}
        <Route path="/event/:eventId/vip/setup" element={
          <VenueLayout>
            <VIPTableSetupPage />
          </VenueLayout>
        } />

        <Route path="/event/:eventId/vip/confirm" element={
          <VenueLayout>
            <VIPConfirmPage />
          </VenueLayout>
        } />

        <Route path="/vip/manage/:managementCode" element={
          <VenueLayout>
            <VIPManagementPage />
          </VenueLayout>
        } />

        <Route path="/vip-payment/:paymentLinkCode" element={
          <VenueLayout>
            <VIPPaymentPage />
          </VenueLayout>
        } />

        <Route path="/vip-payment/success" element={
          <VenueLayout>
            <VIPPaymentSuccessPage />
          </VenueLayout>
        } />
        
        {/* Rutas protegidas - requieren autenticación */}
        <Route path="/wallet" element={
          <ProtectedRoute>
            <VenueLayout>
              <WalletPage />
            </VenueLayout>
          </ProtectedRoute>
        } />

        {/* Wallet con tickets específicos - PROTEGIDA */}
        <Route path="/wallet/:orderId/:eventSlug" element={
          <ProtectedRoute>
            <VenueLayout>
              <PostPaymentPage />
            </VenueLayout>
          </ProtectedRoute>
        } />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}