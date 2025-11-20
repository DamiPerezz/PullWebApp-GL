// components/ticket-card/ticket-card.tsx
import { Download, QrCode, Calendar, MapPin, CheckCircle } from "lucide-react";
import type { PurchasedTicketInfo } from "../../types/types";
import "./ticket-card.css";

interface TicketCardProps {
  ticket: PurchasedTicketInfo;
}

export const TicketCard = ({ ticket }: TicketCardProps) => {
  const eventName = ticket.events?.name || "Event";
  const eventDate = ticket.events?.event_date || "";
  const eventTime = ticket.events?.start_time || "";
  const venueName = ticket.events?.venues?.name || "";
  const venueLocation = ticket.events?.venues?.location || "";
  const ticketType = ticket.ticket_types?.name || "General Admission";
  const validated = !!ticket.validated_at;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "";
    return timeStr.slice(0, 5);
  };

  const handleDownload = () => {
    console.log("Download ticket:", ticket.id);
  };

  return (
    <div className={`ticket-card ${validated ? 'ticket-card-validated' : ''}`}>
      <div className="ticket-card-header">
        <div className="ticket-card-type">
          <span>{ticketType}</span>
        </div>
        {validated && (
          <div className="ticket-card-validated-badge">
            <CheckCircle size={16} />
            <span>Validated</span>
          </div>
        )}
      </div>

      <div className="ticket-card-body">
        <h3 className="ticket-card-event-name">{eventName}</h3>
        
        <div className="ticket-card-details">
          <div className="ticket-card-detail">
            <Calendar className="ticket-card-icon" />
            <div>
              <p className="ticket-card-detail-label">Date</p>
              <p className="ticket-card-detail-value">{formatDate(eventDate)}</p>
            </div>
          </div>

          <div className="ticket-card-detail">
            <MapPin className="ticket-card-icon" />
            <div>
              <p className="ticket-card-detail-label">Venue</p>
              <p className="ticket-card-detail-value">{venueName}</p>
              {venueLocation && (
                <p className="ticket-card-detail-sub">{venueLocation}</p>
              )}
            </div>
          </div>
        </div>

        <div className="ticket-card-qr">
          <QrCode size={80} />
          <p className="ticket-card-qr-text">Present this code at entrance</p>
        </div>
      </div>

      <div className="ticket-card-footer">
        <button onClick={handleDownload} className="ticket-card-download-btn">
          <Download size={16} />
          Download
        </button>
      </div>
    </div>
  );
};