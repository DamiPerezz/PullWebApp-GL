// event-info-card.tsx - Matches event-detailed-page design exactly
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Clock, MapPin, Plus, Shirt, X } from "lucide-react";
import type { EventDetailedInfo } from "../../types/types";
import "./event-info-card.css";

interface EventInfoCardProps {
  eventInfo: EventDetailedInfo | null;
}

export const EventInfoCard = memo(({ eventInfo }: EventInfoCardProps) => {
  const { t, i18n } = useTranslation('common');
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  if (!eventInfo) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const locale = i18n.language === 'es' ? 'es-GT' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = startTime?.slice(0, 5) || '';
    const end = endTime?.slice(0, 5) || '';
    return end ? `${start} - ${end}` : start;
  };

  const getMapUrl = () => {
    const lat = eventInfo?.custom_location?.latitude;
    const lng = eventInfo?.custom_location?.longitude;
    if (lat && lng) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventInfo?.location || '')}`;
  };

  return (
    <>
      <div className="event-info-layout">
        {/* Left - Image */}
        <div className="event-info-left">
          <div className="event-info-image-wrapper">
            <img
              src={eventInfo.event_img}
              alt={eventInfo.event_name}
              className="event-info-image"
            />
          </div>

          {/* Description - Desktop only */}
          {eventInfo.description && (
            <div className="event-info-description-card">
              <h3 className="event-info-description-title">{t('event.description') || 'Description'}</h3>
              <p className="event-info-description">
                {eventInfo.description}
              </p>
              <button
                className="event-info-read-more"
                onClick={() => setShowDescriptionModal(true)}
              >
                {t('event.readMore') || 'Read More'}
              </button>
            </div>
          )}

          {/* Location Card - Desktop only */}
          <div className="event-info-location-card">
            <div className="event-info-location-info">
              <div className="event-info-meta-item location">
                <MapPin />
                <span>{eventInfo.location}</span>
              </div>
            </div>
            <a
              href={getMapUrl()}
              className="event-info-location-button"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={16} />
              <span>{t('event.getDirections') || 'Get Directions'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
          </div>
        </div>

        {/* Right - Title, Tags, Date/Time */}
        <div className="event-info-right">
          <div className="event-info-right-header">
            {/* Title */}
            <h1 className="event-info-title">{eventInfo.event_name}</h1>

            {/* Tags - age and dress code only */}
            {(eventInfo.min_age || eventInfo.dress_code) && (
              <div className="event-info-tags event-info-tags-info">
                {eventInfo.min_age && (
                  <div className="event-info-tag age">
                    <Plus size={14} />
                    <span>{eventInfo.min_age}+</span>
                  </div>
                )}
                {eventInfo.dress_code && (
                  <div className="event-info-tag dress-code">
                    <Shirt size={14} />
                    <span>{eventInfo.dress_code}</span>
                  </div>
                )}
              </div>
            )}

            {/* Date - plain text with icon */}
            <div className="event-info-date-time date">
              <Calendar size={14} />
              <span>{formatDate(eventInfo.date || '')}</span>
            </div>

            {/* Time - plain text with icon */}
            <div className="event-info-date-time time">
              <Clock size={14} />
              <span>{formatTime(eventInfo.open_time, eventInfo.close_time)}</span>
            </div>

            {/* Location button - mobile only */}
            <a
              href={getMapUrl()}
              className="event-info-location-button-mobile"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={14} />
              <span>{t('event.getDirections') || 'Get Directions'}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </a>
          </div>

          {/* Mobile only - description below tags */}
          {eventInfo.description && (
            <div className="event-info-mobile-description">
              <p>{eventInfo.description}</p>
              <button
                className="event-info-mobile-read-more"
                onClick={() => setShowDescriptionModal(true)}
              >
                {t('event.readMore') || 'Read More'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description Modal */}
      {showDescriptionModal && eventInfo.description && (
        <div className="event-info-modal-overlay" onClick={() => setShowDescriptionModal(false)}>
          <div className="event-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-info-modal-header">
              <h3 className="event-info-modal-title">{t('event.aboutEvent') || 'About Event'}</h3>
              <button
                className="event-info-modal-close"
                onClick={() => setShowDescriptionModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="event-info-modal-content">
              <p>{eventInfo.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
