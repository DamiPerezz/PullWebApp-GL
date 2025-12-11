// all-venue-events-page.tsx
import { Layout } from "../../components/layout/layout";
import "./all-venue-events-page.css";
import { EventCard } from "../../components/events-card/events-card";
import { useEffect, useState } from "react";
import { getEventsByVenue, getVenueInfo } from "../../controller/events-page-controller";
import { useParams } from "react-router-dom";
import type { EventInfo, VenueEventInfo } from "../../types/types";
import { MapPin } from "lucide-react";

export const AllVenueEventsPage = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const [events, setAllEvents] = useState<EventInfo[]>([]);
  const [venueInfo, setVenueInfo] = useState<VenueEventInfo | null>(null);
  const [loading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!venueId) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      getEventsByVenue(venueId),
      getVenueInfo(venueId)
    ])
      .then(([eventsData, venueData]) => {
        const sortedEvents = [...eventsData].sort((a, b) => {
          const dateA = new Date(a.event_date).getTime();
          const dateB = new Date(b.event_date).getTime();
          return dateA - dateB;
        });
        setAllEvents(sortedEvents);
        setVenueInfo(venueData);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [venueId]);

  return (
    <Layout>
      <div className="all-events-page-wrapper">
        <div className="all-events-page-bg-blur" style={{ backgroundImage: `url(${venueInfo?.image || ''})` }} />

        {loading ? (
          <div className="all-events-loading-container">
            <div className="all-events-loading-spinner"></div>
          </div>
        ) : (
          <div className="all-events-page-inner">
            <div className="all-events-banner">
              <div className="all-events-banner__content">
                <div className="all-events-banner__avatar">
                  <img src={venueInfo?.image} alt={venueInfo?.name} />
                </div>
                <div className="all-events-banner__info">
                  <h1 className="all-events-banner__title">All Events</h1>
                  <p className="all-events-banner__venue">
                    <MapPin size={16} className="all-events-banner__venue-icon" />
                    {venueInfo?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="all-events-content">
              {events.length !== 0 ? (
                <div className="all-events-grid">
                  {events.map((event) => (
                    <EventCard key={event.event_id} event={event} isVenueEventPage />
                  ))}
                </div>
              ) : (
                <div className="all-events-empty">
                  <p>No events available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
