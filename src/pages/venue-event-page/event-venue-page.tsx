// event-venue-page.tsx
import { Layout } from "../../components/layout/layout";
import "./event-venue-page.css";
import { EventCard } from "../../components/events-card/events-card";
import { ClockIcon, EmailIcon, LocationIcon } from "../../icons/icons";
import { useEffect, useState } from "react";
import { getEventsByVenue, getVenueInfo } from "../../controller/events-page-controller";
import { useParams } from "react-router-dom";
import type { EventInfo, VenueEventInfo } from "../../types/types";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";

export const VenueEventsPage = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const [events, setAllEvents] = useState<EventInfo[]>([]);
  const [venueInfo, setVenueInfo] = useState<VenueEventInfo | null>(null);
  const [loading, setIsLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const eventsPerPage = 5;

  useEffect(() => {
    if (!venueId) {
      setIsLoading(false);
      return;
    }

    getEventsByVenue(venueId)
      .then((events) => {
        console.log("✅ Events received:", events); // DEBUG
        setAllEvents(events);
      })
      .catch((error) => {
        console.error("❌ Error fetching events:", error);
      });

    getVenueInfo(venueId)
      .then((venue) => {
        console.log("✅ Venue info received:", venue); // DEBUG
        setVenueInfo(venue);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("❌ Error fetching venue info:", error);
        setIsLoading(false);
      });
  }, [venueId]);

  const open = venueInfo?.open_time?.slice(0, 5) || "";
  const close = venueInfo?.close_time?.slice(0, 5) || "";

  const totalPages = Math.ceil(events.length / eventsPerPage);
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

  console.log("📊 Events state:", events); // DEBUG
  console.log("📊 Current events:", currentEvents); // DEBUG

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

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
                  <div className="venue-events-list">
                    {events.length !== 0 ? (
                      <>
                        {currentEvents.map((event) => (
                          <EventCard key={event.event_id} event={event} isVenueEventPage />
                        ))}
                        {totalPages > 1 && (
                          <div className="venue-pagination">
                            <button
                              onClick={handlePrevPage}
                              disabled={currentPage === 1}
                              className="venue-pagination-btn"
                            >
                              <ChevronLeft />
                            </button>
                            <span className="venue-pagination-text">
                              Page {currentPage} of {totalPages}
                            </span>
                            <button
                              onClick={handleNextPage}
                              disabled={currentPage === totalPages}
                              className="venue-pagination-btn"
                            >
                              <ChevronRight />
                            </button>
                          </div>
                        )}
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
                      <div className="venue-info-detail-item">
                        <LocationIcon strokeColor="rgb(52, 211, 153)" />
                        <span>{venueInfo?.long_location}</span>
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${40.4531},${-3.6883}`}
                      className="venue-info-directions"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Directions
                   </a>
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