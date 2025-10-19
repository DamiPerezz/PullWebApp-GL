import { Layout } from "../../components/layout/layout";
import "./event-venue-page.css";

import { EventCard } from "../../components/events-card/events-card";
import {
  ClockIcon,
  CurrentLocationIcon,
  EmailIcon,
  LocationIcon,
} from "../../icons/icons";
import { useEffect, useState } from "react";
import {
  getEventsByVenue,
  getVenueDescription,
  getVenueInfo,
} from "../../controller/events-page-controller";
import { NavLink, useParams } from "react-router-dom";
import type {
  EventInfo,
  VenueDescription,
  VenueEventInfo,
} from "../../types/types";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import "./calendar-custom.css";

export const VenueEventsPage = () => {
  const { venueId } = useParams<{ venueId: string }>();

  const [events, setAllEvents] = useState<EventInfo[]>([]);
  const [venueInfo, setVenueInfo] = useState<VenueEventInfo | null>(null);
  const [venueDescription, setVenueDescription] =
    useState<VenueDescription | null>(null);

  const [loading, setIsLoading] = useState<boolean>(true);

  const [isTable, setIsTable] = useState<boolean>(true);

  useEffect(() => {
    if (!venueId) {
      setIsLoading(false);
      return;
    }

    getEventsByVenue(venueId)
      .then((events) => {
        setAllEvents(events);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
      });

    getVenueInfo(venueId)
      .then((venue) => {
        setVenueInfo(venue);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching venue info:", error);
        setIsLoading(false);
      });

    getVenueDescription(venueId)
      .then((description) => {
        setVenueDescription(description);
      })
      .catch((error) => {
        console.error("Error fetching venue description:", error);
      });
  }, [venueId]);

  const [open, setOpen] = useState<string>("");
  const [close, setClose] = useState<string>("");

  const [dateSelected, setDateSelected] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (venueInfo) {
      setOpen(venueInfo.open_time.slice(0, 5));
      setClose(venueInfo.close_time.slice(0, 5));
    }
  }, [venueInfo]);

  return (
    <Layout>
      <div className="event-venue-container">
        <div className="left-side-container">
          <img
            src={venueInfo?.image}
            alt={venueInfo?.name}
            width={130}
            height={130}
          />
          <h2>{venueInfo?.name}</h2>
          <div className="location-info">
            <p>Capacity: {venueInfo?.capacity}</p>
            <p>
              <ClockIcon strokeColor="var(--light-color-gray)" /> {open} -{" "}
              {close}
            </p>
            <p>
              <EmailIcon strokeColor="var(--light-color-gray)" />{" "}
              {venueInfo?.email}
            </p>
            <p>
              <LocationIcon strokeColor="var(--light-color-gray)" />
              {venueInfo?.long_location}
            </p>
            {/* TODO: Implementar esto en lugar de hardcodear las variables `https://www.google.com/maps/search/?api=1&query=${lat},${long}` */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${40.4531},${-3.6883}`}
              className="direction-link"
              target="_blank"
            >
              {" "}
              <CurrentLocationIcon fillColor="white" /> Take me there
            </a>
          </div>
          <div className="more-venue-info">
            <div className="info-side-header">
              <p className="title">Venue Information</p>
              <p>
                Find out more about the venue, its history, and upcoming events.
              </p>
            </div>
            <div className="venue-info">
              <p className="description">{venueDescription?.description}</p>
              <p>
                For more information, visit the official website or contact us
                via email.
              </p>
            </div>
          </div>
        </div>
        <div className="middle-container">
          <h2>Santiago Bernabeu Stadium</h2>
          {events.length !== 0 && !loading ? (
            events.map((event) => (
              <EventCard key={event.event_id} event={event} isVenueEventPage />
            ))
          ) : events.length === 0 && !loading ? (
            <p>No events available</p>
          ) : (
            <p>Loading events...</p>
          )}
        </div>
        <div className="right-side-container">
          <p className="title">Other Reservations Options</p>
          <div className="reservation-options">
            <button
              onClick={() => setIsTable(true)}
              className={isTable ? "active" : ""}
            >
              Table
            </button>
            <div className="sep" />
            <button
              onClick={() => setIsTable(false)}
              className={!isTable ? "active" : ""}
            >
              Bar
            </button>
          </div>
          <div className="reservation-info-options">
            {isTable ? (
              <p className="description">
                Book a table for your group and enjoy in comfort.
              </p>
            ) : (
              <p className="description">
                Book a spot at the bar to enjoy drinks and snacks.
              </p>
            )}
          </div>
          <DayPicker
            animate
            mode="single"
            required={true}
            selected={dateSelected}
            onSelect={setDateSelected}
            disabled={[
              { before: new Date() },
              {
                after: new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  new Date().getDate() - 1
                ),
              },
              { dayOfWeek: [0, 2] },
            ]}
            captionLayout="label"
            className="custom-day-picker"
            footer={
              dateSelected ? (
                <NavLink
                  className="reserve-link"
                  to={`/venue/${venueId}/booking/${
                    dateSelected.toISOString().split("T")[0]
                  }?table=${isTable}`}
                >
                  Book {isTable ? "Table" : "Bar"}
                </NavLink>
              ) : (
                "Pick a day"
              )
            }
          />
        </div>
      </div>
    </Layout>
  );
};
