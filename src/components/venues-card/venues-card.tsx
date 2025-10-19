import { NavLink } from 'react-router-dom';
import { ClockIcon, LocationIcon } from '../../icons/icons';
import './venues-card.css';
import type { VenueInfo } from '../../types/types';

const ArrowRightIcon = () => (
    <svg 
        className="venue-card-action-icon" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 7l5 5m0 0l-5 5m5-5H6" 
        />
    </svg>
);

export const VenuesCard = ({ venue }: { venue: VenueInfo }) => {

    const open = venue.open_time.slice(0, 5);
    const close = venue.close_time.slice(0, 5);

    return (
        <NavLink to={`/venues/${venue.slug}/events`} className="venues-card-container">
            <img 
                src={venue.image} 
                alt={venue.venue_name} 
                width={150} 
                height={150}
                loading="lazy"
            />
            
            <div className="venue-info">
                <p className='title'>{venue.venue_name}</p>
                <div>
                    <p className='extra-info'>
                        <ClockIcon strokeColor={'var(--light-color-gray)'} /> 
                        {open} - {close}
                    </p>
                    <p className='extra-info'>
                        <LocationIcon strokeColor={'var(--light-color-gray)'} /> 
                        {venue.location}
                    </p>
                </div>
            </div>

            <div className="venue-card-action">
                <div className="venue-card-action-button">
                    <span>View Events</span>
                    <ArrowRightIcon />
                </div>
            </div>
        </NavLink>
    );
};