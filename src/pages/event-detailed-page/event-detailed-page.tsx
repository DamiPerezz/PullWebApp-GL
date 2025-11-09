import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/layout';
import { TicketTypeCard } from '../../components/ticket-type-card/ticket-type-card';
import { DivTicketTypeCard } from '../../components/ticket-type-card/div-ticket-type-card';
import { Calendar, Clock, MapPin, ChevronLeft, Plus, Shirt, Wine, CheckCircle, Users } from 'lucide-react';
import type { EventDetailedInfo, TicketType } from '../../types/types';
import './event-detailed-page.css';
import { getEventDetailedInfo, getEventTicketsTypes } from '../../controller/purchase-pages-controller';
import { useParams, useNavigate } from 'react-router-dom';

export const EventDetailedPage = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();

    const [eventDetailedInfo, setEventDetailedInfo] = useState<EventDetailedInfo | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [loading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (!eventId) {
            setIsLoading(false);
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
    }, [eventId]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleViewMap = () => {
        // Use event coordinates if available, otherwise use a default location
        const lat = eventDetailedInfo?.latitude || 40.4531;
        const lng = eventDetailedInfo?.longitude || -3.6883;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    };

    if (loading) {
        return (
            <Layout>
                <div className="event-detailed-wrapper">
                    <div className="event-detailed-bg-blur" />
                    <div className="event-detailed-bg-overlay" />
                    <div className="event-detailed-content">
                        <div className="event-detailed-loading">
                            <div className="event-detailed-loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

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
            <div className="event-detailed-wrapper">
                <div 
                    className="event-detailed-bg-blur" 
                    style={{ backgroundImage: `url(${eventDetailedInfo?.event_img})` }}
                />
                <div className="event-detailed-bg-overlay" />
                
                <div className="event-detailed-content">
                    <div className="event-detailed-container">
                        <button 
                            onClick={handleBack}
                            className="event-detailed-back-button"
                        >
                            <ChevronLeft />
                            Back to Events
                        </button>

                        <div className="event-detailed-layout">
                            <div className="event-detailed-left">
                                <div className="event-detailed-image-wrapper">
                                    <img 
                                        src={eventDetailedInfo?.event_img} 
                                        alt={eventDetailedInfo?.event_name}
                                        className="event-detailed-image"
                                    />
                                </div>

                                <div className="event-detailed-info-card">
                                    <div className="event-detailed-location-info">
                                        <div className="event-detailed-meta-item location">
                                            <MapPin />
                                            <span>{eventDetailedInfo?.location}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleViewMap}
                                        className="event-detailed-location-button"
                                    >
                                        <MapPin size={16} />
                                        <span>Get Directions</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="event-detailed-right">
                                <div className="event-detailed-right-header">
                                    <h1 className="event-detailed-title">
                                        {eventDetailedInfo?.event_name}
                                    </h1>

                                    <div className="event-detailed-date-time">
                                        <div className="event-detailed-meta-item date">
                                            <Calendar />
                                            <span>{formattedDate}</span>
                                        </div>
                                        <div className="event-detailed-meta-item time">
                                            <Clock />
                                            <span>{open} - {close}</span>
                                        </div>
                                    </div>

                                    {eventDetailedInfo?.requirements && eventDetailedInfo.requirements.length > 0 && (
                                        <div className="event-detailed-requirements">
                                            {eventDetailedInfo.requirements.map(req => {
                                                if (req.name === 'age') {
                                                    return (
                                                        <div key={req.name} className="event-detailed-requirement age">
                                                            <Plus size={16} />
                                                            <span>{req.description}</span>
                                                        </div>
                                                    );
                                                }
                                                if (req.name === 'dress_code') {
                                                    return (
                                                        <div key={req.name} className="event-detailed-requirement dress-code">
                                                            <Shirt size={16} />
                                                            <span>{req.description}</span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div key={req.name} className="event-detailed-requirement">
                                                        <span>{req.description}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="event-detailed-tickets-section">
                                    <h2 className="event-detailed-tickets-title">Available Tickets</h2>
                                    <div className="event-detailed-tickets-grid">
                                        <div className="event-detailed-vip-section">
                                            <div className="event-detailed-vip-content">
                                                <div className="event-detailed-vip-header">
                                                    <Wine />
                                                    <h3 className="event-detailed-vip-title">VIP Table Service</h3>
                                                </div>

                                                <p className="event-detailed-vip-description">
                                                    Reserve an exclusive table with premium bottle service. Perfect for groups looking for a VIP experience.
                                                </p>

                                                <ul className="event-detailed-vip-features">
                                                    <li className="event-detailed-vip-feature">
                                                        <CheckCircle />
                                                        <span>Premium bottle service</span>
                                                    </li>
                                                    <li className="event-detailed-vip-feature">
                                                        <CheckCircle />
                                                        <span>Dedicated VIP area</span>
                                                    </li>
                                                    <li className="event-detailed-vip-feature">
                                                        <CheckCircle />
                                                        <span>Easy group payment split</span>
                                                    </li>
                                                </ul>

                                                <button className="event-detailed-vip-button">
                                                    <Users />
                                                    View Table Options
                                                </button>
                                            </div>
                                        </div>

                                        {ticketTypes.map(ticket => {
                                            if (ticket.ticket_quantity === 0) {
                                                return <DivTicketTypeCard key={ticket.ticket_type_id} ticket={ticket} />;
                                            }
                                            return <TicketTypeCard key={ticket.ticket_type_id} ticket={ticket} />;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};