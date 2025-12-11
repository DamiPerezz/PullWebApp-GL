// pages/post-payment/post-payment.tsx - CORREGIDO
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import "./post-payment.css";
import { useEffect, useState } from "react";
import { getTicketsByOrderId } from "../../controller/post-purchase-controller";
import { getEventDetailedInfo } from "../../controller/purchase-pages-controller";
import type { PurchasedTicketInfo, EventDetailedInfo } from "../../types/types";
import { CheckCircle, Download, ChevronLeft, Loader } from "lucide-react";
import { TicketCard } from "../../components/ticket-card/ticket-card";

export const PostPaymentPage = () => {
  const { orderId, eventSlug } = useParams<{ orderId: string; eventSlug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<PurchasedTicketInfo[]>([]);
  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Missing order information");
      setLoading(false);
      return;
    }

    // Obtener tickets
    getTicketsByOrderId(orderId)
      .then((ticketsData) => {
        if (ticketsData?.tickets) {
          setTickets(ticketsData.tickets);
        }
        
        // Si tenemos eventSlug, obtener info del evento
        if (eventSlug) {
          return getEventDetailedInfo(eventSlug);
        }
        return null;
      })
      .then((eventData) => {
        if (eventData) {
          setEventInfo(eventData);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tickets");
        setLoading(false);
      });
  }, [orderId, eventSlug]);

  const handleBack = () => {
    navigate('/');
  };

  const handleDownloadAll = () => {
    // TODO: Implement download all tickets functionality
  };

  if (loading) {
    return (
      <Layout>
        <div className="post-payment-wrapper">
          <div className="post-payment-bg-gradient" />
          <div className="post-payment-loading">
            <div className="post-payment-loading-card">
              <div className="post-payment-loading-spinner-wrapper">
                <Loader className="post-payment-loading-spinner" />
              </div>
              <h2 className="post-payment-loading-title">Loading your tickets</h2>
              <p className="post-payment-loading-text">Please wait while we retrieve your order...</p>
              <div className="post-payment-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="post-payment-wrapper">
          <div className="post-payment-bg-gradient" />
          <div className="post-payment-content">
            <div className="post-payment-container">
              <button onClick={handleBack} className="post-payment-back-button">
                <ChevronLeft />
                Back to Home
              </button>
              <div className="post-payment-error">
                <p className="post-payment-error-text">{error}</p>
                <button onClick={handleBack} className="post-payment-button">
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="post-payment-wrapper">
        {eventInfo?.event_img ? (
          <>
            <div 
              className="post-payment-bg-blur"
              style={{ backgroundImage: `url(${eventInfo.event_img})` }}
            />
            <div className="post-payment-bg-overlay" />
          </>
        ) : (
          <div className="post-payment-bg-gradient" />
        )}

        <div className="post-payment-content">
          <div className="post-payment-container">
            <button onClick={handleBack} className="post-payment-back-button">
              <ChevronLeft />
              Back to Home
            </button>

            <div className="post-payment-steps">
              <div className="post-payment-step post-payment-step-completed">
                <div className="post-payment-step-number">1</div>
                <div className="post-payment-step-label">Select Tickets</div>
              </div>
              <div className="post-payment-step-line post-payment-step-line-completed"></div>
              <div className="post-payment-step post-payment-step-completed">
                <div className="post-payment-step-number">2</div>
                <div className="post-payment-step-label">Enter Data</div>
              </div>
              <div className="post-payment-step-line post-payment-step-line-completed"></div>
              <div className="post-payment-step post-payment-step-completed">
                <div className="post-payment-step-number">3</div>
                <div className="post-payment-step-label">Payment</div>
              </div>
            </div>

            <div className="post-payment-success-banner">
              <div className="post-payment-success-icon">
                <CheckCircle />
              </div>
              <div className="post-payment-success-content">
                <h1 className="post-payment-success-title">Payment Successful!</h1>
                <p className="post-payment-success-message">
                  Your tickets have been sent to your email. You can view and download them below.
                </p>
              </div>
              <button onClick={handleDownloadAll} className="post-payment-download-button">
                <Download />
                Download All
              </button>
            </div>

            <div className="post-payment-tickets-section">
              <div className="post-payment-tickets-header">
                <h2 className="post-payment-tickets-title">Your Tickets</h2>
                <span className="post-payment-tickets-count">
                  {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
                </span>
              </div>

              {tickets.length > 0 ? (
                <div className="post-payment-tickets-grid">
                  {tickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              ) : (
                <div className="post-payment-no-tickets">
                  <p>No tickets found for this order.</p>
                </div>
              )}
            </div>

            <div className="post-payment-instructions">
              <h3 className="post-payment-instructions-title">Next Steps</h3>
              <ul className="post-payment-instructions-list">
                <li>Your tickets have been sent to your email address</li>
                <li>Present your QR code at the venue entrance</li>
                <li>Each ticket can only be used once</li>
                <li>Arrive early to avoid queues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};