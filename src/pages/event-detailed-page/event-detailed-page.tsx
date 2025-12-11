// event-detailed-page.tsx (TU DISEÑO - SOLO CORREGIDO BACKEND)
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/layout';
import { TicketTypeCard } from '../../components/ticket-type-card/ticket-type-card';
import { DivTicketTypeCard } from '../../components/ticket-type-card/div-ticket-type-card';
import { Calendar, Clock, MapPin, Plus, Shirt, X } from 'lucide-react';
import type { EventDetailedInfo, TicketType } from '../../types/types';
import './event-detailed-page.css';
import { getEventDetailedInfo } from '../../controller/event-controller';
import { getTicketTypes } from '../../controller/event-controller';
import { useParams } from 'react-router-dom';
import { SEO, generateEventStructuredData } from '../../components/seo/seo';

export const EventDetailedPage = () => {
    const { eventId } = useParams<{ eventId: string }>();

    const [eventDetailedInfo, setEventDetailedInfo] = useState<EventDetailedInfo | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [loading, setIsLoading] = useState<boolean>(true);
    const [showDescriptionModal, setShowDescriptionModal] = useState(false);

    useEffect(() => {
        if (!eventId) {
            setIsLoading(false);
            return;
        }

        getEventDetailedInfo(eventId)
            .then(data => {
                setEventDetailedInfo(data);
            })
            .catch(() => {
                // Silently handle error
            });

        getTicketTypes(eventId)
            .then(data => {
                setTicketTypes(data);
                setIsLoading(false);
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, [eventId]);

    const getMapUrl = () => {
        const lat = eventDetailedInfo?.custom_location?.latitude;
        const lng = eventDetailedInfo?.custom_location?.longitude;
        if (lat && lng) {
            return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventDetailedInfo?.location || '')}`;
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

    // Generate structured data for SEO
    const eventStructuredData = eventDetailedInfo ? generateEventStructuredData({
        name: eventDetailedInfo.event_name,
        description: eventDetailedInfo.description || `Evento en ${eventDetailedInfo.location}`,
        startDate: `${eventDetailedInfo.date}T${eventDetailedInfo.open_time}`,
        endDate: `${eventDetailedInfo.date}T${eventDetailedInfo.close_time}`,
        location: eventDetailedInfo.location,
        image: eventDetailedInfo.event_img,
        url: `https://web.pullevents.com/event/${eventId}`,
        price: ticketTypes[0]?.ticket_price,
        currency: "GTQ",
        availability: ticketTypes.some(t => t.ticket_quantity > 0) ? "InStock" : "SoldOut"
    }) : undefined;

    return (
        <Layout>
            {eventDetailedInfo && (
                <SEO
                    title={eventDetailedInfo.event_name}
                    description={eventDetailedInfo.description || `Compra entradas para ${eventDetailedInfo.event_name} en ${eventDetailedInfo.location}. ${formattedDate}.`}
                    keywords={`${eventDetailedInfo.event_name}, entradas ${eventDetailedInfo.location}, eventos guatemala, fiestas ${eventDetailedInfo.location}`}
                    canonicalUrl={`https://web.pullevents.com/event/${eventId}`}
                    ogTitle={`${eventDetailedInfo.event_name} | Pull Events`}
                    ogDescription={`Compra entradas para ${eventDetailedInfo.event_name}. ${formattedDate} en ${eventDetailedInfo.location}.`}
                    ogImage={eventDetailedInfo.event_img}
                    ogType="event"
                    structuredData={eventStructuredData}
                />
            )}
            <div className="event-detailed-wrapper">
                <div
                    className="event-detailed-bg-blur"
                    style={{ backgroundImage: `url(${eventDetailedInfo?.event_img})` }}
                />
                <div className="event-detailed-bg-overlay" />
                
                <div className="event-detailed-content">
                    <div className="event-detailed-container">
                        <div className="event-detailed-layout">
                            <div className="event-detailed-left">
                                <div className="event-detailed-image-wrapper">
                                    <img
                                        src={eventDetailedInfo?.event_img}
                                        alt={eventDetailedInfo?.event_name}
                                        className="event-detailed-image"
                                    />
                                </div>

                                {eventDetailedInfo?.description && (
                                    <div className="event-detailed-description-card">
                                        <h3 className="event-detailed-description-title">Event Description</h3>
                                        <p className="event-detailed-description">
                                            {eventDetailedInfo.description}
                                        </p>
                                        <button
                                            className="event-detailed-read-more"
                                            onClick={() => setShowDescriptionModal(true)}
                                        >
                                            Read more
                                        </button>
                                    </div>
                                )}

                                <div className="event-detailed-info-card">
                                    <div className="event-detailed-location-info">
                                        <div className="event-detailed-meta-item location">
                                            <MapPin />
                                            <span>{eventDetailedInfo?.location}</span>
                                        </div>
                                    </div>
                                    <a
                                        href={getMapUrl()}
                                        className="event-detailed-location-button"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MapPin size={16} />
                                        <span>Get Directions</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            <div className="event-detailed-right">
                                <div className="event-detailed-right-header">
                                    {/* Tags fecha/hora - Line 1 in mobile */}
                                    <div className="event-detailed-tags event-detailed-tags-datetime">
                                        <div className="event-detailed-tag date">
                                            <Calendar size={14} />
                                            <span>{formattedDate}</span>
                                        </div>
                                        <div className="event-detailed-tag time">
                                            <Clock size={14} />
                                            <span>{open} - {close}</span>
                                        </div>
                                    </div>

                                    {/* Title - Line 2 in mobile */}
                                    <h1 className="event-detailed-title">
                                        {eventDetailedInfo?.event_name}
                                    </h1>

                                    {/* Tags edad/dress code - Line 3 in mobile */}
                                    {(eventDetailedInfo?.min_age || eventDetailedInfo?.dress_code) && (
                                        <div className="event-detailed-tags event-detailed-tags-info">
                                            {eventDetailedInfo?.min_age && (
                                                <div className="event-detailed-tag age">
                                                    <Plus size={14} />
                                                    <span>{eventDetailedInfo.min_age}+</span>
                                                </div>
                                            )}
                                            {eventDetailedInfo?.dress_code && (
                                                <div className="event-detailed-tag dress-code">
                                                    <Shirt size={14} />
                                                    <span>{eventDetailedInfo.dress_code}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mobile only - location and description */}
                                    <div className="event-detailed-mobile-location">
                                        <MapPin size={16} />
                                        <span>{eventDetailedInfo?.location}</span>
                                    </div>
                                    {eventDetailedInfo?.description && (
                                        <div className="event-detailed-mobile-description">
                                            <p>{eventDetailedInfo.description}</p>
                                            <button
                                                className="event-detailed-mobile-read-more"
                                                onClick={() => setShowDescriptionModal(true)}
                                            >
                                                Read more
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="event-detailed-tickets-section">
                                    <h2 className="event-detailed-tickets-title">Available Tickets</h2>
                                    <div className="event-detailed-tickets-grid">
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

                {showDescriptionModal && eventDetailedInfo?.description && (
                    <div className="event-detailed-modal-overlay" onClick={() => setShowDescriptionModal(false)}>
                        <div className="event-detailed-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="event-detailed-modal-header">
                                <h3 className="event-detailed-modal-title">About this event</h3>
                                <button
                                    className="event-detailed-modal-close"
                                    onClick={() => setShowDescriptionModal(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="event-detailed-modal-content">
                                <p>{eventDetailedInfo.description}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};