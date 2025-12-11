import { Layout } from "../../components/layout/layout";
import "./venue-calendar-page.css";
import { useEffect, useState } from "react";
import { getEventsByVenue, getVenueInfo } from "../../controller/events-page-controller";
import { useParams, useNavigate } from "react-router-dom";
import type { EventInfo, VenueEventInfo } from "../../types/types";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const VenueCalendarPage = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [events, setAllEvents] = useState<EventInfo[]>([]);
  const [venueInfo, setVenueInfo] = useState<VenueEventInfo | null>(null);
  const [loading, setIsLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
        setAllEvents(eventsData);
        setVenueInfo(venueData);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [venueId]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventsForDate = (date: Date): EventInfo[] => {
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleEventClick = (event: EventInfo) => {
    navigate(`/event/${event.event_slug}`);
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day calendar-day--empty" />
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = getEventsForDate(date);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const hasEvents = dayEvents.length > 0;
      const firstEvent = hasEvents ? dayEvents[0] : null;

      days.push(
        hasEvents ? (
          <button
            key={day}
            className={`calendar-day calendar-day--clickable ${isToday ? 'calendar-day--today' : ''} ${isPast ? 'calendar-day--past' : ''} calendar-day--has-events`}
            onClick={() => firstEvent && handleEventClick(firstEvent)}
            title={firstEvent?.event_name}
            style={{
              backgroundImage: `url(${firstEvent?.event_img})`,
            }}
          >
            <span className="calendar-day__number">{day}</span>
            {dayEvents.length > 1 && (
              <span className="calendar-day__badge">+{dayEvents.length - 1}</span>
            )}
          </button>
        ) : (
          <div
            key={day}
            className={`calendar-day ${isToday ? 'calendar-day--today' : ''} ${isPast ? 'calendar-day--past' : ''}`}
          >
            <span className="calendar-day__number">{day}</span>
          </div>
        )
      );
    }

    return days;
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter(event => new Date(event.event_date) >= today)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
      .slice(0, 5);
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="calendar-page-wrapper">
        <div className="calendar-page-bg-blur" style={{ backgroundImage: `url(${venueInfo?.image || ''})` }} />

        {loading ? (
          <div className="calendar-page-loading">
            <div className="calendar-loading-spinner"></div>
          </div>
        ) : (
          <div className="calendar-page-inner">
            <div className="calendar-banner">
              <div className="calendar-banner__content">
                <div className="calendar-banner__avatar">
                  <img src={venueInfo?.image} alt={venueInfo?.name} />
                </div>
                <div className="calendar-banner__info">
                  <h1 className="calendar-banner__title">Events Calendar</h1>
                  <p className="calendar-banner__venue">
                    <MapPin size={16} className="calendar-banner__venue-icon" />
                    {venueInfo?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="calendar-content">
              <div className="calendar-main">
                <div className="calendar-nav">
                  <button
                    className="calendar-nav__btn"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="calendar-nav__title">
                    {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    className="calendar-nav__btn"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="calendar-grid">
                  <div className="calendar-weekdays">
                    {DAY_NAMES.map(day => (
                      <div key={day} className="calendar-weekday">{day}</div>
                    ))}
                  </div>
                  <div className="calendar-days">
                    {renderCalendarDays()}
                  </div>
                </div>
              </div>

              <div className="calendar-sidebar">
                <div className="calendar-sidebar__card">
                  <h3 className="calendar-sidebar__title">Upcoming Events</h3>
                  {getUpcomingEvents().length > 0 ? (
                    <div className="calendar-upcoming-list">
                      {getUpcomingEvents().map(event => (
                        <button
                          key={event.event_id}
                          className="calendar-upcoming-item"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="calendar-upcoming-item__image">
                            <img src={event.event_img} alt={event.event_name} />
                          </div>
                          <div className="calendar-upcoming-item__info">
                            <span className="calendar-upcoming-item__name">{event.event_name}</span>
                            <span className="calendar-upcoming-item__date">{formatEventDate(event.event_date)}</span>
                          </div>
                          <ChevronRight size={16} className="calendar-upcoming-item__arrow" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="calendar-sidebar__empty">No upcoming events</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
