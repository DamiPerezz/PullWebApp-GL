import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Copy, ArrowRight, Check } from 'lucide-react';
import { Layout } from '../../components/layout/layout';
import './group-reservation-confirmation-page.css';

interface ConfirmationData {
  success: boolean;
  reservation_id: string;
  management_code: string;
  payment_link_code: string;
  total_amount?: number;
  message?: string;
  eventInfo?: {
    event_name: string;
    event_img: string;
    date: string;
    venue_slug?: string;
    custom_location?: {
      id: string;
      slug: string;
      name: string;
    };
  };
  guestCount?: number;
  hostPaysCount?: number;
}

export const GroupReservationConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!location.state) {
      navigate('/');
      return;
    }
    setData(location.state as ConfirmationData);
  }, [location.state, navigate]);

  if (!data) return null;

  const handleCopyReference = () => {
    navigator.clipboard.writeText(data.management_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eventImage = data.eventInfo?.event_img;
  // Try multiple possible paths for venue slug
  const eventInfo = data.eventInfo as any;
  const venueSlug = eventInfo?.venue_slug
    || eventInfo?.slug_venue
    || eventInfo?.custom_location?.slug
    || eventInfo?.venue?.slug;

  return (
    <Layout>
      <div className="group-confirmation-wrapper">
        {eventImage && (
          <>
            <div
              className="group-confirmation-bg-blur"
              style={{ backgroundImage: `url(${eventImage})` }}
            />
            <div className="group-confirmation-bg-overlay-dark" />
          </>
        )}
        {!eventImage && <div className="group-confirmation-bg-overlay" />}

        <div className="group-confirmation-content">
          <div className="group-confirmation-container">
            {/* Header Section */}
            <div className="group-confirmation-header">
              <div className="group-confirmation-icon-wrapper">
                <CheckCircle className="group-confirmation-icon" />
              </div>
              <h1 className="group-confirmation-title">Reservation Received!</h1>
              <div className="group-confirmation-description">
                <p>Your group reservation has been submitted and is pending approval from our team.</p>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="group-confirmation-main-card">
              <h2 className="group-confirmation-section-title">Reservation Information</h2>

              {/* Two Column Grid */}
              <div className="group-confirmation-grid">
                {/* Left Column - Pending Staff Approval */}
                <div className="group-confirmation-grid-left">
                  <div className="group-confirmation-status-card">
                    <div className="group-confirmation-status-header">
                      <Clock />
                      <span>Pending Staff Approval</span>
                    </div>
                    <div className="group-confirmation-status-body">
                      <p>
                        Your request is being reviewed by our team. Once approved, you'll receive an email with your ticket and the shareable link for your guests.
                      </p>
                      <div className="group-confirmation-timeline">
                        <div className="timeline-step timeline-step-completed">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h4>Reservation Created</h4>
                            <p>Your request was received successfully</p>
                          </div>
                        </div>
                        <div className="timeline-step timeline-step-current">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h4>Staff Review</h4>
                            <p>Our team is verifying your request</p>
                          </div>
                        </div>
                        <div className="timeline-step timeline-step-pending">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h4>Confirmation Sent</h4>
                            <p>You'll receive your ticket and the guest link via email</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Management Code & Important Info */}
                <div className="group-confirmation-grid-right">
                  {/* Management Code Card */}
                  <div className="group-confirmation-reference">
                    <p className="group-confirmation-reference-label">Management Code</p>
                    <div className="group-confirmation-reference-content">
                      <p className="group-confirmation-reference-number">
                        {data.management_code}
                      </p>
                      <button
                        onClick={handleCopyReference}
                        className={`group-confirmation-reference-copy ${copied ? 'copied' : ''}`}
                      >
                        {copied ? (
                          <>
                            <Check />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy />
                            Copy Code
                          </>
                        )}
                      </button>
                    </div>
                    <p className="group-confirmation-reference-hint">
                      Save this code to manage your reservation or contact support.
                    </p>
                  </div>

                  {/* Important Information */}
                  <div className="group-confirmation-info-box group-confirmation-info-box-blue">
                    <h3>Important Information</h3>
                    <ul>
                      <li>Staff will review your request shortly (usually within 24 hours)</li>
                      <li>Once approved, <strong>you'll receive your ticket and the shareable link</strong> via email</li>
                      <li>Guests you paid for will need to <strong>fill in their details</strong> using the link to receive their tickets</li>
                      <li>Guests you didn't pay for will need to <strong>complete payment and fill in their details</strong> using the link</li>
                      <li>You'll receive email updates about your reservation status</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="group-confirmation-actions">
                <button
                  onClick={() => navigate(venueSlug ? `/venues/${venueSlug}/events/` : '/')}
                  className="group-confirmation-button group-confirmation-button-primary"
                >
                  {venueSlug ? 'Return to Venue' : 'Go to Home'}
                  <ArrowRight />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
