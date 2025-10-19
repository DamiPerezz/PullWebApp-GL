import './events-card.css'
import { CalendarIcon, ClockIcon, LocationIcon, HangerIcon } from '../../icons/icons';
import { InfoComponent } from './info-component';
import { NavLink } from 'react-router-dom';
import type { EventInfo } from '../../types/types';

export const EventCard = ({ event, isVenueEventPage }: { event: EventInfo, isVenueEventPage?: boolean }) => {

    let dressCode = 'No dress code specified';
    try {
        const dressCodeRequirement = event.requirements.find(req => req.name === 'dress_code');
        dressCode = dressCodeRequirement ? dressCodeRequirement.description : 'No dress code specified';
    } catch (error) {
        return null
    }

    const open = event.start_time.slice(0, 5);
    const close = event.end_time.slice(0, 5);

    return (
        <NavLink to={`/event/${event.event_slug}`} className={isVenueEventPage ? "event-card venue-event-card" : "event-card"}>
            <img src={event.event_img} alt={event.event_name} width={126} height={160} />
            <div className="event-info">
                <div className="header-info">
                    <p className='title'>{event.event_name}</p>
                </div>
                <p className='date'><CalendarIcon strokeColor='white' /> {event.event_date}</p>
                <div className="event-extra-info">
                    <InfoComponent icon={<ClockIcon strokeColor={'var(--light-color-gray)'} />} text={`${open} - ${close}`} />
                    <InfoComponent icon={<LocationIcon strokeColor={'var(--light-color-gray)'} />} text={event.venue_name} />
                    <InfoComponent icon={<HangerIcon strokeColor={'var(--light-color-gray)'} />} text={dressCode} />
                </div>
            </div>
        </NavLink>
    )
}