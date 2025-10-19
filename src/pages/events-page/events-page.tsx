import "./events-page.css"
import { Layout } from "../../components/layout/layout"
import { EventCard } from "../../components/events-card/events-card";
import { useEffect, useState } from "react";
import { getAllEvents } from "../../controller/events-page-controller";
import type { EventInfo } from "../../types/types";

export const EventsPage = () => {

    const [events, setAllEvents] = useState<EventInfo[]>([])
    const [loading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {

        getAllEvents().then((events) => {
            setAllEvents(events)
            setIsLoading(false)
        }).catch((error) => {
            console.error("Error fetching events:", error)
            setIsLoading(false)
        })

    }, [])

    return (
        <Layout>
            <div className="events-container">
                <h2>Choose an Event</h2>
                {events.length !== 0 && !loading ? events.map((event) => (
                    <EventCard key={event.event_id} event={event} />
                )) : events.length === 0 && !loading ? (
                    <p>No events available</p>
                ) : (
                    <p>Loading events...</p>
                )}
            </div>
        </Layout>
    )
}