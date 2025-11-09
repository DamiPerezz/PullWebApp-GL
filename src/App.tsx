// App.tsx
import { Navigate, Route, Routes } from "react-router-dom";
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
import { NotFoundPage } from "./pages/not-found-page/not-found-page";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/venues" />} />
      <Route path="/venues" element={<VenuesPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/event/:eventId" element={<EventDetailedPage />} />
      <Route path="/venues/:venueId/events/" element={<VenueEventsPage />} />
      
      {/* Regular Ticket Purchase Flow */}
      <Route path="/event/:eventId/tickets/:ticketTypeId" element={<PrePurchasePage />} />
      <Route path="/event/:eventId/tickets/:ticketTypeId/:quantity" element={<PaymentPage />} />
      <Route path="/payment-success" element={<PaymentSuccessPage />} />
      <Route path="/payment-cancel" element={<PaymentCancelPage />} />
      
      {/* VIP Table Reservation Flow */}
      <Route path="/event/:eventId/vip/setup" element={<VIPTableSetupPage />} />
      <Route path="/event/:eventId/vip/confirm" element={<VIPConfirmPage />} />
      <Route path="/vip/manage/:managementCode" element={<VIPManagementPage />} />
      <Route path="/vip-payment/:paymentLinkCode" element={<VIPPaymentPage />} />
      <Route path="/vip-payment/success" element={<VIPPaymentSuccessPage />} />
      
      {/* Post Payment / Wallet Routes */}
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/wallet/:orderId/:eventId" element={<PostPaymentPage />} />
      
      <Route path="/aboutUs" element={<AboutUsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}