// event-detailed-page.tsx (TU DISEÑO - SOLO CORREGIDO BACKEND)
// SECURITY: Validate URL parameters to prevent injection
import { useEffect, useState, useMemo } from 'react';
import { Layout } from '../../components/layout/layout';
import { TicketTypeCard } from '../../components/ticket-type-card/ticket-type-card';
import { DivTicketTypeCard } from '../../components/ticket-type-card/div-ticket-type-card';
import { GuestListCard } from '../../components/guest-list-card/guest-list-card';
import { Calendar, Clock, MapPin, Plus, Shirt, X, Ticket, Users, ClipboardList, MessageCircle, Crown } from 'lucide-react';
import type { EventDetailedInfo, TicketType, GuestListType } from '../../types/types';
import './event-detailed-page.css';
import { getEventDetailedInfo } from '../../controller/event-controller';
import { getTicketTypes } from '../../controller/event-controller';
import { getGuestListsForEvent } from '../../controller/guest-list-controller';
import { useParams } from 'react-router-dom';
import { SEO, generateEventStructuredData } from '../../components/seo/seo';
import { validateSlug } from '../../utils/security';
import { useTranslation } from 'react-i18next';

export const EventDetailedPage = () => {
    const { t, i18n } = useTranslation('events');
    const { eventId: rawEventId, lang } = useParams<{ eventId: string; lang: string }>();
    const currentLang = lang || i18n.language || 'es';

    // SECURITY: Validate event slug parameter
    const eventId = useMemo(() => validateSlug(rawEventId), [rawEventId]);

    const [eventDetailedInfo, setEventDetailedInfo] = useState<EventDetailedInfo | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [guestLists, setGuestLists] = useState<GuestListType[]>([]);
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
                // Store venue name for navbar display (use venue name from custom_location, not address)
                const venueName = data?.custom_location?.name || data?.custom_location?.venue_name;
                if (venueName) {
                    sessionStorage.setItem('lastVenueName', venueName);
                }
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

        // Fetch guest lists (free lists)
        getGuestListsForEvent(eventId)
            .then(data => {
                setGuestLists(data.filter(gl => gl.is_active));
            })
            .catch(() => {
                // Silently handle - guest lists are optional
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

    // ?. en CADA nivel: si open_time/close_time llegan null (dato de backend),
    // .slice sobre null lanzaba y —sin Error Boundary— dejaba TODA la web en
    // blanco. Ahora degrada a "".
    const open = eventDetailedInfo?.open_time?.slice(0, 5);
    const close = eventDetailedInfo?.close_time?.slice(0, 5);

    const parsedDate = new Date(eventDetailedInfo?.date || '');
    const dateValid = !isNaN(parsedDate.getTime());
    const dateLocale = currentLang === 'es' ? 'es-GT' : 'en-US';
    const formattedDate = dateValid
        ? parsedDate.toLocaleDateString(dateLocale, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : '';

    // Generate structured data for SEO
    const eventStructuredData = eventDetailedInfo ? generateEventStructuredData({
        name: eventDetailedInfo.event_name,
        description: eventDetailedInfo.description || `Evento en ${eventDetailedInfo.location}`,
        startDate: `${eventDetailedInfo.date}T${eventDetailedInfo.open_time}`,
        endDate: `${eventDetailedInfo.date}T${eventDetailedInfo.close_time}`,
        location: eventDetailedInfo.location,
        image: eventDetailedInfo.event_img,
        url: `${(typeof window!=='undefined'?window.location.origin:'https://web.pullevents.com')}/event/${eventId}`,
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
                    canonicalUrl={`${(typeof window!=='undefined'?window.location.origin:'https://web.pullevents.com')}/event/${eventId}`}
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
                                        <h3 className="event-detailed-description-title">{t('details.eventDescription')}</h3>
                                        <p className="event-detailed-description">
                                            {eventDetailedInfo.description}
                                        </p>
                                        <button
                                            className="event-detailed-read-more"
                                            onClick={() => setShowDescriptionModal(true)}
                                        >
                                            {t('details.readMore')}
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
                                        <span>{t('details.getDirections')}</span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            <div className="event-detailed-right">
                                <div className="event-detailed-right-header">
                                    {/* Title */}
                                    <h1 className="event-detailed-title">
                                        {eventDetailedInfo?.event_name}
                                    </h1>

                                    {((eventDetailedInfo as any)?.is_private || (eventDetailedInfo as any)?.require_approval) && (
                                        <div className="event-private-badge">
                                            🔒 Evento privado · requiere aprobación del organizador
                                        </div>
                                    )}

                                    {/* Tags - age and dress code only */}
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

                                    {/* Date - plain text with icon */}
                                    <div className="event-detailed-date-time date">
                                        <Calendar size={14} />
                                        <span>{formattedDate}</span>
                                    </div>

                                    {/* Time - plain text with icon */}
                                    <div className="event-detailed-date-time time">
                                        <Clock size={14} />
                                        <span>{open} - {close}</span>
                                    </div>

                                    {/* Location button - mobile only */}
                                    <a
                                        href={getMapUrl()}
                                        className="event-detailed-location-button-mobile"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MapPin size={14} />
                                        <span>{t('details.getDirections')}</span>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </a>

                                </div>

                                {/* Mobile only - description below tags */}
                                {eventDetailedInfo?.description && (
                                    <div className="event-detailed-mobile-description">
                                        <p>{eventDetailedInfo.description}</p>
                                        <button
                                            className="event-detailed-mobile-read-more"
                                            onClick={() => setShowDescriptionModal(true)}
                                        >
                                            {t('details.readMore')}
                                        </button>
                                    </div>
                                )}

                                {/* VIP List Flow - Contact venue instead of buying tickets */}
                                {eventDetailedInfo?.custom_location?.use_vip_list_flow ? (
                                    <div className="event-detailed-vip-section">
                                        <div className="event-detailed-vip-card">
                                            <div className="event-detailed-vip-header">
                                                <Crown size={24} />
                                                <h2>{t('details.vipOnly.title')}</h2>
                                            </div>
                                            <p className="event-detailed-vip-description">
                                                {t('details.vipOnly.description')}
                                            </p>
                                            {eventDetailedInfo?.custom_location?.whatsapp_number ? (
                                                <a
                                                    href={`https://wa.me/${eventDetailedInfo.custom_location.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('details.vipOnly.whatsappMessage', { eventName: eventDetailedInfo.event_name }))}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="event-detailed-vip-button"
                                                >
                                                    <MessageCircle size={20} />
                                                    {t('details.vipOnly.contactButton')}
                                                </a>
                                            ) : (
                                                <p className="event-detailed-vip-no-contact">
                                                    {t('details.vipOnly.noContact')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {ticketTypes.filter(t => !t.is_group).length > 0 && (
                                            <div className="event-detailed-tickets-section">
                                                <h2 className="event-detailed-tickets-title">
                                                    <Ticket size={20} style={{ color: 'rgb(168, 85, 255)' }} />
                                                    {t('details.individualTickets')}
                                                </h2>
                                                <div className="event-detailed-tickets-grid">
                                                    {ticketTypes.filter(ticket => !ticket.is_group).map(ticket => {
                                                        if (ticket.ticket_quantity === 0) {
                                                            return <DivTicketTypeCard key={ticket.ticket_type_id} ticket={ticket} />;
                                                        }
                                                        return <TicketTypeCard key={ticket.ticket_type_id} ticket={ticket} />;
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {guestLists.length > 0 && (
                                            <div className="event-detailed-tickets-section">
                                                <h2 className="event-detailed-tickets-title">
                                                    <ClipboardList size={20} style={{ color: 'rgb(20, 184, 166)' }} />
                                                    {t('details.guestLists')}
                                                </h2>
                                                <div className="event-detailed-tickets-grid">
                                                    {guestLists.map(guestList => (
                                                        <GuestListCard
                                                            key={guestList.id}
                                                            guestList={guestList}
                                                            eventSlug={eventId || ''}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {ticketTypes.filter(t => t.is_group).length > 0 && (
                                            <div className="event-detailed-tickets-section">
                                                <h2 className="event-detailed-tickets-title">
                                                    <Users size={20} style={{ color: 'rgb(59, 130, 246)' }} />
                                                    {t('details.groupTickets')}
                                                </h2>
                                                <div className="event-detailed-tickets-grid">
                                                    {ticketTypes.filter(ticket => ticket.is_group).map(ticket => {
                                                        if (ticket.ticket_quantity === 0) {
                                                            return <DivTicketTypeCard key={ticket.ticket_type_id} ticket={ticket} />;
                                                        }
                                                        return <TicketTypeCard key={ticket.ticket_type_id} ticket={ticket} />;
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {showDescriptionModal && eventDetailedInfo?.description && (
                    <div className="event-detailed-modal-overlay" onClick={() => setShowDescriptionModal(false)}>
                        <div className="event-detailed-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="event-detailed-modal-header">
                                <h3 className="event-detailed-modal-title">{t('details.aboutThisEvent')}</h3>
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