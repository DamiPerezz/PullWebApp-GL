import QRCode from "react-qr-code";
import { useTranslation } from "react-i18next";
import "./qr-card.css";
import type { PurchasedTicketInfo } from "../../types/types";
import { Ticket, Download, CheckCircle } from "lucide-react";

interface QrCardProps {
  info: PurchasedTicketInfo;
  onDownload?: () => void;
}

export const QrCard = ({ info, onDownload }: QrCardProps) => {
  const { t, i18n } = useTranslation('common');

  // Format date based on current locale
  const formatDate = (dateStr: string) => {
    if (!dateStr) return t('qr.dateTbd');
    try {
      const locale = i18n.language === 'es' ? 'es-GT' : 'en-US';
      return new Date(dateStr).toLocaleDateString(locale, {
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
            {info.ticket_type || t('qr.generalAdmission')}
          </h3>
        </div>
        <div className="qr-card-modern-badge">
          <CheckCircle size={12} />
          <span>{t('qr.valid')}</span>
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
          <span className="qr-card-modern-info-label">{t('qr.name')}</span>
          <span className="qr-card-modern-info-value">{info.owner_full_name}</span>
        </div>

        <div className="qr-card-modern-info-item">
          <span className="qr-card-modern-info-label">{t('qr.event')}</span>
          <span className="qr-card-modern-info-value">{info.event_name}</span>
        </div>

        <div className="qr-card-modern-info-item">
          <span className="qr-card-modern-info-label">{t('qr.date')}</span>
          <span className="qr-card-modern-info-value">{formatDate(info.event_date)}</span>
        </div>

        {info.location && (
          <div className="qr-card-modern-info-item">
            <span className="qr-card-modern-info-label">{t('qr.location')}</span>
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
          <span>{t('qr.downloadPdf')}</span>
        </button>
      )}
    </div>
  );
};
