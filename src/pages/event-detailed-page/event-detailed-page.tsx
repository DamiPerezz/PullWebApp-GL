import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/layout'
import { TicketTypeCard } from '../../components/ticket-type-card/ticket-type-card';
import { HangerIcon, PlusIcon } from '../../icons/icons'
import type { EventDetailedInfo, TicketType } from '../../types/types';
import './event-detailed-page.css'
import { getEventDetailedInfo, getEventTicketsTypes } from '../../controller/purchase-pages-controller';
import { useParams } from 'react-router-dom';

export const EventDetailedPage = () => {

    const { eventId } = useParams<{ eventId: string }>();

    const [eventDetailedInfo, setEventDetailedInfo] = useState<EventDetailedInfo | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[] | []>([]);

    const [loading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {

        if (!eventId) {
            return;
        }

        getEventDetailedInfo(eventId)
            .then(data => {
                setEventDetailedInfo(data);
            })
            .catch(error => {
                console.error("Error fetching event details:", error);
            });

        getEventTicketsTypes(eventId)
            .then(data => {
                setTicketTypes(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error("Error fetching ticket types:", error);
                setIsLoading(false);
            });

    }, [eventId])

    const open = eventDetailedInfo?.open_time.slice(0, 5);
    const close = eventDetailedInfo?.close_time.slice(0, 5);

    const date = new Date(eventDetailedInfo?.date || '');

    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <Layout>
            <div className="detailed-event-page">
                {loading ? <p>Loading event details...</p> : <>
                    <p className='header-bar'>{eventDetailedInfo?.event_name} at {eventDetailedInfo?.location}</p>
                    <div className="event-header-info">
                        <img src={eventDetailedInfo?.event_img} alt={eventDetailedInfo?.event_name} width={200} height={250} />
                        <div className="header-details">
                            <h1>{eventDetailedInfo?.event_name}</h1>
                            <p className="event-date">{formattedDate} <span>From {open} to {close}</span></p>
                            <p className="event-venue">{eventDetailedInfo?.location}</p>
                            <div className="restrictions">
                                {
                                    eventDetailedInfo?.requirements.map(req => req.name === 'age' ?
                                        <p key={req.name}><PlusIcon strokeColor='#101010' /> {req.description}</p>
                                        :
                                        req.name === 'dress_code' ? <p key={req.name}><HangerIcon strokeColor='#101010' /> {req.description}</p>
                                            : <p key={req.name}>{req.description}</p>)
                                }
                            </div>
                        </div>
                    </div>
                    <div className="types-of-tickets">
                        <h2>Choose your type of ticket</h2>
                        {ticketTypes.map(ticket => (
                            <TicketTypeCard key={ticket.ticket_type_id} ticket={ticket} />
                        ))}
                    </div>
                </>
                }
            </div>

        </Layout>
    )
}