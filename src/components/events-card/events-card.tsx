import './events-card.css'
import { CalendarIcon, ClockIcon, LocationIcon, HangerIcon } from '../../icons/icons';
import { NavLink } from 'react-router-dom';
import type { EventInfo } from '../../types/types';
import { ArrowRight } from 'lucide-react';
import { formatEventDateShort } from '../../utils/dateFormatter';

export const EventCard = ({ event, isVenueEventPage }: { event: EventInfo, isVenueEventPage?: boolean }) => {

    const dressCode = event.dress_code || 'No dress code specified';

    const open = event.start_time.slice(0, 5);
    const close = event.end_time.slice(0, 5);

    return (
        <NavLink to={`/event/${event.event_slug}`} className={isVenueEventPage ? "event-card venue-event-card" : "event-card"}>
            <div className="event-card-inner">
                <div className="event-card-bg-gradient" />
                
                <div className="event-card-content">
                    <div className="event-card-image-wrapper">
                        <img 
                            src={event.event_img} 
                            alt={event.event_name}
                            className="event-card-image"
                        />
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
                                    <ClockIcon strokeColor="rgb(34, 211, 238)" />
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
                                    <HangerIcon strokeColor="rgb(232, 121, 249)" />
                                    <span>{dressCode}</span>
                                </div>
                            </div>
                        </div>

                        <div className="event-card-button">
                            View Details
                            <ArrowRight />
                        </div>
                    </div>
                </div>
            </div>
        </NavLink>
    )
}