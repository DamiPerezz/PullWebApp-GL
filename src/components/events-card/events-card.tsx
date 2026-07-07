// PERFORMANCE: Memoized to prevent unnecessary re-renders in event lists
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useParams } from 'react-router-dom';
import './events-card.css'
import { CalendarIcon, ClockIcon, LocationIcon, HangerIcon } from '../../icons/icons';
import type { EventInfo } from '../../types/types';
import { ArrowRight, ImageOff } from 'lucide-react';
import { formatEventDateShort } from '../../utils/dateFormatter';

export const EventCard = memo(({ event, isVenueEventPage }: { event: EventInfo, isVenueEventPage?: boolean }) => {
    const { t, i18n } = useTranslation('common');
    const { lang } = useParams<{ lang: string }>();
    const currentLang = lang || i18n.language || 'es';
    const [imageError, setImageError] = useState(false);

    const dressCode = event.dress_code || t('event.noDressCode');

    const open = event.start_time.slice(0, 5);
    const close = event.end_time.slice(0, 5);

    return (
        <NavLink to={`/${currentLang}/event/${event.event_slug}`} className={isVenueEventPage ? "event-card venue-event-card" : "event-card"}>
            <div className="event-card-inner">
                <div className="event-card-bg-gradient" />

                <div className="event-card-content">
                    <div className="event-card-image-wrapper">
                        {imageError ? (
                            <div className="event-card-image-placeholder">
                                <ImageOff size={24} />
                            </div>
                        ) : (
                            <img
                                src={event.event_img}
                                alt={event.event_name}
                                className="event-card-image"
                                onError={() => setImageError(true)}
                            />
                        )}
                        {event.min_price && (
                            <div className="event-card-price">
                                <span className="event-card-price-value">€{event.min_price}</span>
                            </div>
                        )}
                    </div>

                    <div className="event-card-info">
                        <div className="event-card-main">
                            <div className="event-card-badges">
                                <div className="event-card-badge event-card-date-badge">
                                    <CalendarIcon strokeColor="rgb(167, 139, 250)" />
                                    <span>{formatEventDateShort(event.event_date)}</span>
                                </div>
                                <div className="event-card-badge event-card-time-badge">
                                    <ClockIcon strokeColor="rgb(59, 130, 246)" />
                                    <span>{open} - {close}</span>
                                </div>
                            </div>

                            <h3 className="event-card-title">{event.event_name}</h3>

                            <div className="event-card-details">
                                <div className="event-card-detail-item">
                                    <LocationIcon strokeColor="rgb(52, 211, 153)" />
                                    <span>{event.venue_name}</span>
                                </div>

                                <div className="event-card-detail-item">
                                    <HangerIcon strokeColor="rgb(168, 85, 255)" />
                                    <span>{dressCode}</span>
                                </div>
                            </div>
                        </div>

                        <div className="event-card-button">
                            {t('buttons.viewDetails')}
                            <ArrowRight />
                        </div>
                    </div>
                </div>
            </div>
        </NavLink>
    )
});
