import QRCode from "react-qr-code";
import "./qr-card.css";
import type { PurchasedTicketInfo } from "../../types/types";
import { Ticket, Download, CheckCircle } from "lucide-react";

interface QrCardProps {
  info: PurchasedTicketInfo;
  onDownload?: () => void;
}

export const QrCard = ({ info, onDownload }: QrCardProps) => {
  // Formatear fecha
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Date TBD";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="qr-card-modern">
      {/* Header */}
      <div className="qr-card-modern-header">
        <div>
          <div className="qr-card-modern-ticket-label">
            <Ticket size={14} />
            <span>Ticket #{info.qr_token.slice(0, 8)}</span>
          </div>
          <h3 className="qr-card-modern-title">
            {info.ticket_type || "General Admission"}
          </h3>
        </div>
        <div className="qr-card-modern-badge">
          <CheckCircle size={12} />
          <span>Valid</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="qr-card-modern-qr">
        <div className="qr-card-modern-qr-wrapper">
          <QRCode 
            value={info.qr_token} 
            size={192}
            bgColor="#000000"
            fgColor="#FFFFFF"
            level="H"
          />
        </div>
      </div>

      {/* Info Grid */}
      <div className="qr-card-modern-info">
        <div className="qr-card-modern-info-item">
          <span className="qr-card-modern-info-label">Name</span>
          <span className="qr-card-modern-info-value">{info.owner_full_name}</span>
        </div>
        
        <div className="qr-card-modern-info-item">
          <span className="qr-card-modern-info-label">Event</span>
          <span className="qr-card-modern-info-value">{info.event_name}</span>
        </div>
        
        <div className="qr-card-modern-info-item">
          <span className="qr-card-modern-info-label">Date</span>
          <span className="qr-card-modern-info-value">{formatDate(info.event_date)}</span>
        </div>
        
        {info.location && (
          <div className="qr-card-modern-info-item">
            <span className="qr-card-modern-info-label">Location</span>
            <span className="qr-card-modern-info-value">{info.location}</span>
          </div>
        )}
      </div>

      {/* Download Button */}
      {onDownload && (
        <button 
          onClick={onDownload}
          className="qr-card-modern-download"
        >
          <Download size={16} />
          <span>Download PDF</span>
        </button>
      )}
    </div>
  );
};