// components/ticket-card/ticket-card.tsx
// PERFORMANCE: Memoized to prevent unnecessary re-renders in lists
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Download, QrCode, Calendar, MapPin, CheckCircle } from "lucide-react";
import type { PurchasedTicketInfo } from "../../types/types";
import "./ticket-card.css";

interface TicketCardProps {
  ticket: PurchasedTicketInfo;
}

export const TicketCard = memo(({ ticket }: TicketCardProps) => {
  const { t, i18n } = useTranslation('common');

  const eventName = ticket.events?.name || t('qr.event');
  const eventDate = ticket.events?.event_date || "";
  const venueName = ticket.events?.venues?.name || "";
  const venueLocation = ticket.events?.venues?.location || "";
  const ticketType = ticket.ticket_types?.name || t('qr.generalAdmission');
  const validated = !!ticket.validated_at;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const locale = i18n.language === 'es' ? 'es-GT' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = () => {
    // TODO: Implement ticket PDF download
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
            <span>{t('qr.validated')}</span>
          </div>
        )}
      </div>

      <div className="ticket-card-body">
        <h3 className="ticket-card-event-name">{eventName}</h3>

        <div className="ticket-card-details">
          <div className="ticket-card-detail">
            <Calendar className="ticket-card-icon" />
            <div>
              <p className="ticket-card-detail-label">{t('qr.date')}</p>
              <p className="ticket-card-detail-value">{formatDate(eventDate)}</p>
            </div>
          </div>

          <div className="ticket-card-detail">
            <MapPin className="ticket-card-icon" />
            <div>
              <p className="ticket-card-detail-label">{t('qr.location')}</p>
              <p className="ticket-card-detail-value">{venueName}</p>
              {venueLocation && (
                <p className="ticket-card-detail-sub">{venueLocation}</p>
              )}
            </div>
          </div>
        </div>

        <div className="ticket-card-qr">
          <QrCode size={80} />
          <p className="ticket-card-qr-text">{t('qr.presentCode')}</p>
        </div>
      </div>

      <div className="ticket-card-footer">
        <button onClick={handleDownload} className="ticket-card-download-btn">
          <Download size={16} />
          {t('buttons.download')}
        </button>
      </div>
    </div>
  );
});
