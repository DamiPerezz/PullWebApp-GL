import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import "./pre-purchase-page.css";
import { ChevronLeft, Minus, Plus, Calendar, Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import type { TicketType, EventDetailedInfo } from "../../types/types";
import { getTicketInfo, getEventDetailedInfo } from "../../controller/purchase-pages-controller";

export const PrePurchasePage = () => {
  const { eventId, ticketTypeId } = useParams<{ eventId: string; ticketTypeId: string }>();
  const navigate = useNavigate();
  const [loading, setIsLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  
  const [ticketDetails, setTicketDetails] = useState<TicketType>({} as TicketType);
  const [eventInfo, setEventInfo] = useState<EventDetailedInfo | null>(null);

  useEffect(() => {
    if (!eventId || !ticketTypeId) {
      return;
    }

    Promise.all([
      getTicketInfo(eventId, ticketTypeId),
      getEventDetailedInfo(eventId)
    ])
      .then(([ticketData, eventData]) => {
        setTicketDetails(ticketData);
        setEventInfo(eventData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setIsLoading(false);
      });
  }, [eventId, ticketTypeId]);

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    const maxQuantity = Math.min(10, ticketDetails.ticket_quantity || 10);
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleBack = () => {
    navigate(`/event/${eventId}`);
  };

  const handleConfirm = () => {
    navigate(`/event/${eventId}/tickets/${ticketTypeId}/${quantity}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="pre-purchase-wrapper">
          <div className="pre-purchase-loading">
            <div className="pre-purchase-loading-spinner"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const maxQuantity = Math.min(10, ticketDetails.ticket_quantity || 10);

  return (
    <Layout>
      <div className="pre-purchase-wrapper">
        {/* Background Blur */}
        {eventInfo?.event_img && (
          <>
            <div 
              className="pre-purchase-bg-blur"
              style={{ backgroundImage: `url(${eventInfo.event_img})` }}
            />
            <div className="pre-purchase-bg-overlay" />
          </>
        )}

        {/* Content */}
        <div className="pre-purchase-content">
          <div className="pre-purchase-container">
            {/* Back Button */}
            <button onClick={handleBack} className="pre-purchase-back-button">
              <ChevronLeft />
              Back to Event
            </button>

            {/* Progress Steps */}
            <div className="pre-purchase-steps">
              <div className="pre-purchase-step pre-purchase-step-active">
                <div className="pre-purchase-step-number">1</div>
                <div className="pre-purchase-step-label">Select Tickets</div>
              </div>
              <div className="pre-purchase-step-line"></div>
              <div className="pre-purchase-step">
                <div className="pre-purchase-step-number">2</div>
                <div className="pre-purchase-step-label">Enter Data</div>
              </div>
              <div className="pre-purchase-step-line"></div>
              <div className="pre-purchase-step">
                <div className="pre-purchase-step-number">3</div>
                <div className="pre-purchase-step-label">Payment</div>
              </div>
            </div>

            {/* Event Info Section */}
            <div className="pre-purchase-event-info">
              <div className="pre-purchase-event-image">
                <img src={eventInfo?.event_img} alt={eventInfo?.event_name} />
              </div>
              <div className="pre-purchase-event-details">
                <h2 className="pre-purchase-event-name">{eventInfo?.event_name}</h2>
                <div className="pre-purchase-event-meta">
                  <p>
                    <Calendar className="pre-purchase-event-icon" />
                    <span>{new Date(eventInfo?.date || '').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </p>
                  <p>
                    <Clock className="pre-purchase-event-icon" />
                    <span>{eventInfo?.open_time?.slice(0, 5)} - {eventInfo?.close_time?.slice(0, 5)}</span>
                  </p>
                  <p>
                    <MapPin className="pre-purchase-event-icon" />
                    <span>{eventInfo?.location}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="pre-purchase-grid">
              {/* Left Column */}
              <div className="pre-purchase-left">
                {/* Ticket Card */}
                <div className="pre-purchase-ticket-card">
                  <div className="pre-purchase-ticket-content">
                    <h3 className="pre-purchase-ticket-title">
                      {ticketDetails.ticket_name}
                    </h3>
                    <p className="pre-purchase-ticket-description">
                      {ticketDetails.ticket_description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="pre-purchase-ticket-price">
                    <span className="pre-purchase-price-amount">€{ticketDetails.ticket_price?.toFixed(2)}</span>
                    <span className="pre-purchase-price-label">per person</span>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="pre-purchase-quantity-card">
                  <h3 className="pre-purchase-quantity-title">Select Quantity</h3>

                  <div className="pre-purchase-quantity-controls">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity === 1}
                      className="pre-purchase-quantity-button"
                    >
                      <Minus />
                    </button>

                    <div className="pre-purchase-quantity-display">
                      <div className="pre-purchase-quantity-number">{quantity}</div>
                      <div className="pre-purchase-quantity-label">
                        {quantity > 1 ? 'tickets' : 'ticket'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity === maxQuantity}
                      className="pre-purchase-quantity-button pre-purchase-quantity-button-plus"
                    >
                      <Plus />
                    </button>
                  </div>

                  <div className="pre-purchase-quantity-info">
                    <p>Maximum {maxQuantity} tickets • {ticketDetails.ticket_quantity} tickets remaining</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="pre-purchase-right">
                <TicketReceipt
                  quantity={quantity}
                  ticketDetails={ticketDetails}
                  onConfirm={handleConfirm}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};