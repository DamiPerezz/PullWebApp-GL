// event-venue-page.tsx
import "./event-venue-page.css";
import { EventCard } from "../../components/events-card/events-card";
import { ClockIcon, EmailIcon } from "../../icons/icons";
import { useEffect, useState } from "react";
import { getEventsByVenue, getVenueInfo } from "../../controller/events-page-controller";
import { useParams } from "react-router-dom";
import type { EventInfo, VenueEventInfo } from "../../types/types";
import { MapPin, ChevronRight, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "../../components/layout/layout";

export const VenueEventsPage = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const [events, setAllEvents] = useState<EventInfo[]>([]);
  const [venueInfo, setVenueInfo] = useState<VenueEventInfo | null>(null);
  const [loading, setIsLoading] = useState<boolean>(true);
  const maxEventsToShow = 4;

  useEffect(() => {
    if (!venueId) {
      setIsLoading(false);
      return;
    }

    getEventsByVenue(venueId)
      .then((events) => {
        const sortedEvents = [...events].sort((a, b) => {
          const dateA = new Date(a.event_date).getTime();
          const dateB = new Date(b.event_date).getTime();
          return dateA - dateB;
        });
        setAllEvents(sortedEvents);
      })
      .catch(() => {
        // Silently handle error
      });

    getVenueInfo(venueId)
      .then((venue) => {
        setVenueInfo(venue);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [venueId]);

  const open = venueInfo?.open_time?.slice(0, 5) || "";
  const close = venueInfo?.close_time?.slice(0, 5) || "";

  const displayedEvents = events.slice(0, maxEventsToShow);
  const hasMoreEvents = events.length > maxEventsToShow;

  return (
    <Layout>
      <div className="venue-page-wrapper">
        <div className="venue-page-bg-blur" style={{ backgroundImage: `url(${venueInfo?.image || ''})` }} />
        
        {loading ? (
          <div className="venue-page-loading-container">
            <div className="venue-loading-spinner"></div>
          </div>
        ) : (
          <>
            <div className="venue-banner">
              <div className="venue-banner-content">
                <div className="venue-banner-avatar">
                  <img src={venueInfo?.image} alt={venueInfo?.name} />
                </div>
                <div className="venue-banner-info">
                  <h1 className="venue-banner-title">{venueInfo?.name}</h1>
                  <div className="venue-banner-location">
                    <MapPin className="venue-banner-icon" />
                    <span>{venueInfo?.long_location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="venue-page-content">
              <div className="venue-page-grid">
                <div className="venue-events-section">
                  <h2 className="venue-events-title">
                    Upcoming Events
                  </h2>
                  <div className="venue-events-list">
                    {events.length !== 0 ? (
                      <>
                        {displayedEvents.map((event) => (
                          <EventCard key={event.event_id} event={event} isVenueEventPage />
                        ))}
                        <div className="venue-events-buttons">
                          <Link
                            to={`/venues/${venueId}/all-events`}
                            className="venue-btn venue-btn--purple"
                          >
                            <span>All Events</span>
                            <ChevronRight size={18} />
                          </Link>
                          <Link
                            to={`/venues/${venueId}/calendar`}
                            className="venue-btn venue-btn--cyan"
                          >
                            <Calendar size={18} />
                            <span>Calendar</span>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="venue-events-empty">
                        <p>No events available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="venue-info-section">
                  <div className="venue-info-card">
                    <h3 className="venue-card-title">Information</h3>
                    
                    {venueInfo?.description && (
                      <>
                        <p className="venue-description-text">{venueInfo.description}</p>
                        <div className="venue-info-divider" />
                      </>
                    )}

                    <div className="venue-info-details">
                      <div className="venue-info-detail-item">
                        <ClockIcon strokeColor="rgb(34, 211, 238)" />
                        <span>{open} - {close}</span>
                      </div>
                      <div className="venue-info-detail-item">
                        <EmailIcon strokeColor="rgb(232, 121, 249)" />
                        <span>{venueInfo?.email}</span>
                      </div>
                      <a
                        href={venueInfo?.latitude && venueInfo?.longitude
                          ? `https://www.google.com/maps/search/?api=1&query=${venueInfo.latitude},${venueInfo.longitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueInfo?.long_location || '')}`}
                        className="venue-info-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin size={16} />
                        <span>Get Directions</span>
                        <ChevronRight size={14} className="venue-info-link-arrow" />
                      </a>
                      <Link
                        to={`/venues/${venueId}/calendar`}
                        className="venue-info-link"
                      >
                        <Calendar size={16} />
                        <span>View Event Calendar</span>
                        <ChevronRight size={14} className="venue-info-link-arrow" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};