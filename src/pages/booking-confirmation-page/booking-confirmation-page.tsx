import { useParams } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import "./booking-confirmation-page.css";

export const BookingConfirmationPage = () => {
  const { reservationDate } = useParams();

  return (
    <Layout>
      <div className="confirmed-booking-layout">
        <div className="message-container">
          <h3>We have received your reservation</h3>
          <p>
            Your reservation for <strong>{reservationDate}</strong> has been
            saved and you will receive an email within an hour with the password
            and instructions to manage your reservations.
          </p>
          <div className="important-notice">
            <p>
              <strong>Important reminders:</strong>
            </p>
            <ul>
              <li>
                You must pay the full amount at least{" "}
                <strong>24 hours before your check-in date</strong> to avoid
                cancellation
              </li>
              <li>
                Adding new guests to your reservation may require venue
                confirmation
              </li>
            </ul>
          </div>
          <p className="closing-message">
            We hope you enjoy your stay!{" "}
            <strong>Thank you for choosing us!</strong>
          </p>
        </div>
      </div>
    </Layout>
  );
};
