// event-info-card.tsx
import { Calendar, Clock, MapPin, User, Shirt, X } from "lucide-react";
import { useState } from "react";
import type { EventDetailedInfo } from "../../types/types";
import "./event-info-card.css";

interface EventInfoCardProps {
  eventInfo: EventDetailedInfo | null;
}

export const EventInfoCard = ({ eventInfo }: EventInfoCardProps) => {
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);

  if (!eventInfo) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = startTime?.slice(0, 5) || '';
    const end = endTime?.slice(0, 5) || '';
    return end ? `${start} - ${end}` : start;
  };

  return (
    <>
      <div className="event-info-card">
        <div className="event-info-card-image">
          <img src={eventInfo.event_img} alt={eventInfo.event_name} />
        </div>
        <div className="event-info-card-details">
          <h2 className="event-info-card-name">{eventInfo.event_name}</h2>

          <div className="event-info-card-tags">
            <span className="event-info-tag date">
              <Calendar size={14} />
              {formatDate(eventInfo.date || '')}
            </span>
            <span className="event-info-tag time">
              <Clock size={14} />
              {formatTime(eventInfo.open_time, eventInfo.close_time)}
            </span>
            {eventInfo.min_age && (
              <span className="event-info-tag age">
                <User size={14} />
                +{eventInfo.min_age}
              </span>
            )}
            {eventInfo.dress_code && (
              <span className="event-info-tag dress-code">
                <Shirt size={14} />
                {eventInfo.dress_code}
              </span>
            )}
          </div>

          <div className="event-info-card-location">
            <MapPin size={20} />
            <span>{eventInfo.location}</span>
          </div>

          {eventInfo.description && (
            <div className="event-info-card-description-wrapper">
              <p className="event-info-card-description">
                {eventInfo.description}
              </p>
              <button
                className="event-info-card-read-more"
                onClick={() => setShowDescriptionModal(true)}
              >
                Read more
              </button>
            </div>
          )}
        </div>
      </div>

      {showDescriptionModal && eventInfo.description && (
        <div className="event-info-modal-overlay" onClick={() => setShowDescriptionModal(false)}>
          <div className="event-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-info-modal-header">
              <h3 className="event-info-modal-title">About this event</h3>
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
};
