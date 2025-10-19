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
import { ReservationPage } from "./pages/reservation-page/reservation-page";
import { BookingConfirmationPage } from "./pages/booking-confirmation-page/booking-confirmation-page";
import { ManageBookingPage } from "./pages/manage-booking-page/manage-booking-page";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/venues" />} />
        <Route path="/venues" element={<VenuesPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/event/:eventId" element={<EventDetailedPage />} />
        <Route path="/venues/:venueId/events/" element={<VenueEventsPage />} />
        <Route
          path="/venue/:venueId/booking/:reservationDate"
          element={<ReservationPage />}
        />
        <Route
          path="/venue/:venueId/booking/:reservationDate/confirmed"
          element={<BookingConfirmationPage />}
        />
        <Route
          path="/venue/:venueId/booking/:reservationDate/manage-booking/:reservationId"
          element={<ManageBookingPage />}
        />
        <Route
          path="/event/:eventId/tickets/:ticketTypeId"
          element={<PrePurchasePage />}
        />
        <Route
          path="/event/:eventId/tickets/:ticketTypeId/:quantity"
          element={<PaymentPage />}
        />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet/:orderId/:eventId" element={<PostPaymentPage />} />
        <Route path="/aboutUs" element={<AboutUsPage />} />
        <Route path="/signIn" element={<h1>Sign In Page</h1>} />
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </>
  );
}
