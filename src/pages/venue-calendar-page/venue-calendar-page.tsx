import { Layout } from "../../components/layout/layout";
import "./venue-calendar-page.css";
import { useEffect, useState } from "react";
import { getEventsByVenue, getVenueInfo } from "../../controller/events-page-controller";
import { useParams, useNavigate } from "react-router-dom";
import type { EventInfo, VenueEventInfo } from "../../types/types";
import { ChevronLeft, ChevronRight, MapPin, ImageOff, CalendarX } from "lucide-react";
import { useTranslation } from "react-i18next";

export const VenueCalendarPage = () => {
  const { t, i18n } = useTranslation('events');
  const { venueId, lang } = useParams<{ venueId: string; lang: string }>();
  const currentLang = lang || i18n.language || 'es';
  const navigate = useNavigate();
  const buildUrl = (path: string) => `/${currentLang}${path}`;
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
    navigate(buildUrl(`/event/${event.event_slug}`));
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
        <div key={`empty-${i}`} className="calendar-day calendar-day--empty">
          <div className="calendar-day__box" />
        </div>
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

      // Don't show past events as clickable
      const hasClickableEvents = hasEvents && !isPast;
      const eventImage = firstEvent?.event_img;

      days.push(
        hasClickableEvents ? (
          // Future event - clickable button
          <button
            key={day}
            className={`calendar-day calendar-day--clickable ${isToday ? 'calendar-day--today' : ''} calendar-day--has-events`}
            onClick={() => firstEvent && handleEventClick(firstEvent)}
            title={firstEvent?.event_name}
          >
            <div
              className="calendar-day__box"
              style={eventImage ? { backgroundImage: `url(${eventImage})` } : undefined}
            >
              {!eventImage && (
                <div className="calendar-day__placeholder">
                  <ImageOff size={24} />
                </div>
              )}
              {dayEvents.length > 1 && (
                <span className="calendar-day__badge">+{dayEvents.length - 1}</span>
              )}
            </div>
            <span className="calendar-day__number">{day}</span>
          </button>
        ) : hasEvents && isPast ? (
          // Past event - show with image but not clickable
          <div
            key={day}
            className={`calendar-day calendar-day--past calendar-day--has-events`}
            title={firstEvent?.event_name}
          >
            <div
              className="calendar-day__box"
              style={eventImage ? { backgroundImage: `url(${eventImage})` } : undefined}
            >
              {!eventImage && (
                <div className="calendar-day__placeholder">
                  <ImageOff size={24} />
                </div>
              )}
              {dayEvents.length > 1 && (
                <span className="calendar-day__badge">+{dayEvents.length - 1}</span>
              )}
            </div>
            <span className="calendar-day__number">{day}</span>
          </div>
        ) : (
          // No events
          <div
            key={day}
            className={`calendar-day calendar-day--no-events ${isToday ? 'calendar-day--today' : ''} ${isPast ? 'calendar-day--past' : ''}`}
          >
            <div className="calendar-day__box">
              <div className="calendar-day__no-events">
                <CalendarX size={20} />
                <span>{currentLang === 'es' ? 'Sin eventos' : 'No events'}</span>
              </div>
            </div>
            <span className="calendar-day__number">{day}</span>
          </div>
        )
      );
    }

    return days;
  };

  // Translated month and day names
  const MONTH_NAMES = currentLang === 'es'
    ? ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
    : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const DAY_NAMES = currentLang === 'es'
    ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
                  <h1 className="calendar-banner__title">{t('calendar.title')}</h1>
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

            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
