// ticket-type-card.tsx - ACTUALIZADO PROFESIONAL
import { NavLink } from 'react-router-dom';
import { ShoppingCart, User, Users, Wine, CheckCircle } from 'lucide-react';
import './ticket-type-card.css';
import type { TicketType } from '../../types/types';

const getCurrencySymbol = (currency: string): string => {
    const symbols: { [key: string]: string } = {
        'GTQ': 'Q',
        'USD': '$',
        'EUR': '€',
        'MXN': '$',
        'GBP': '£'
    };
    return symbols[currency] || currency;
};

export const TicketTypeCard = ({ ticket }: { ticket: TicketType }) => {
    const getTicketIcon = () => {
        const name = ticket.ticket_name.toLowerCase();
        if (name.includes('women')) return <User className="ticket-icon-women" />;
        if (name.includes('men')) return <User className="ticket-icon-men" />;
        if (name.includes('group')) return <Users className="ticket-icon-group" />;
        return null;
    };

    const getTicketClass = () => {
        const name = ticket.ticket_name.toLowerCase();
        if (name.includes('women')) return 'ticket-type-card ticket-women';
        if (name.includes('men')) return 'ticket-type-card ticket-men';
        if (name.includes('group')) return 'ticket-type-card ticket-group';
        return 'ticket-type-card';
    };

    const isGroupTicket = ticket.ticket_name.toLowerCase().includes('group');
    const currencySymbol = getCurrencySymbol(ticket.currency);

    if (isGroupTicket) {
        return (
            <NavLink 
                to={`/event/${ticket.slug}/tickets/${ticket.ticket_type_id}`} 
                className={getTicketClass()}
            >
                <div className="ticket-type-card-header">
                    <div className="ticket-type-card-title-wrapper">
                        {getTicketIcon()}
                        <h3 className="ticket-type-card-title">{ticket.ticket_name}</h3>
                    </div>
                    {ticket.ticket_quantity < 15 && (
                        <p className="ticket-type-card-availability">
                            Only {ticket.ticket_quantity} left
                        </p>
                    )}
                </div>
                
                <p className="ticket-type-card-description">{ticket.ticket_description}</p>
                
                <div className="ticket-group-features">
                    <div className="ticket-group-feature">
                        <CheckCircle />
                        <span>Premium bottle service available</span>
                    </div>
                    <div className="ticket-group-feature">
                        <CheckCircle />
                        <span>Dedicated group area</span>
                    </div>
                    <div className="ticket-group-feature">
                        <CheckCircle />
                        <span>Easy payment split</span>
                    </div>
                </div>
                
                <div className="ticket-type-card-footer">
                    <p className="ticket-type-card-price">{currencySymbol}{ticket.ticket_price.toFixed(2)}</p>
                    <div className="ticket-type-card-button">
                        <Wine />
                        Reserve Now
                    </div>
                </div>
            </NavLink>
        );
    }

    return (
        <NavLink 
            to={`/event/${ticket.slug}/tickets/${ticket.ticket_type_id}`} 
            className={getTicketClass()}
        >
            <div className="ticket-type-card-header">
                <div className="ticket-type-card-title-wrapper">
                    {getTicketIcon()}
                    <h3 className="ticket-type-card-title">{ticket.ticket_name}</h3>
                </div>
                {ticket.ticket_quantity < 15 && (
                    <p className="ticket-type-card-availability">
                        Only {ticket.ticket_quantity} left
                    </p>
                )}
            </div>
            
            <p className="ticket-type-card-description">{ticket.ticket_description}</p>
            
            <div className="ticket-type-card-footer">
                <p className="ticket-type-card-price">{currencySymbol}{ticket.ticket_price.toFixed(2)}</p>
                <div className="ticket-type-card-button">
                    <ShoppingCart />
                    Buy
                </div>
            </div>
        </NavLink>
    );
};