// pre-purchase-page.tsx
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import "./pre-purchase-page.css";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import { EventInfoCard } from "../../components/event-info-card/event-info-card";
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
      .catch(() => {
        setIsLoading(false);
      });
  }, [eventId, ticketTypeId]);

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    const maxQuantity = Math.min(3, ticketDetails.ticket_quantity || 3);
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
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

  const maxQuantity = Math.min(3, ticketDetails.ticket_quantity || 3);
  const currencySymbol = ticketDetails.currency === 'GTQ' ? 'Q' :
                        ticketDetails.currency === 'USD' ? '$' :
                        ticketDetails.currency === 'EUR' ? '€' :
                        ticketDetails.currency || 'Q';

  return (
    <Layout>
      <div className="pre-purchase-wrapper">
        {eventInfo?.event_img && (
          <>
            <div
              className="pre-purchase-bg-blur"
              style={{ backgroundImage: `url(${eventInfo.event_img})` }}
            />
            <div className="pre-purchase-bg-overlay" />
          </>
        )}

        <div className="pre-purchase-content">
          <div className="pre-purchase-container">
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

            <EventInfoCard eventInfo={eventInfo} />

            <div className="pre-purchase-grid">
              <div className="pre-purchase-left">
                <div className="pre-purchase-ticket-card">
                  <div className="pre-purchase-ticket-content">
                    <h3 className="pre-purchase-ticket-title">
                      {ticketDetails.ticket_name}
                    </h3>
                    <p className="pre-purchase-ticket-description">
                      {ticketDetails.ticket_description}
                    </p>
                  </div>

                  <div className="pre-purchase-ticket-price">
                    <span className="pre-purchase-price-amount">{currencySymbol}{ticketDetails.ticket_price?.toFixed(2)}</span>
                    <span className="pre-purchase-price-label">per person</span>
                  </div>
                </div>

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
                    <p>Maximum 3 tickets • {ticketDetails.ticket_quantity} tickets remaining</p>
                  </div>
                </div>
              </div>

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
