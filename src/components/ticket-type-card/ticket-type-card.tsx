import { NavLink } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import './ticket-type-card.css';
import type { TicketType } from '../../types/types';

export const TicketTypeCard = ({ ticket }: { ticket: TicketType }) => {
    return (
        <NavLink 
            to={`/event/${ticket.slug}/tickets/${ticket.ticket_type_id}`} 
            className="ticket-type-card"
        >
            <div className="ticket-type-card-header">
                <h3 className="ticket-type-card-title">{ticket.ticket_name}</h3>
                {ticket.ticket_quantity < 15 && (
                    <p className="ticket-type-card-availability">
                        Only {ticket.ticket_quantity} left
                    </p>
                )}
            </div>
            
            <p className="ticket-type-card-description">{ticket.ticket_description}</p>
            
            <div className="ticket-type-card-footer">
                <p className="ticket-type-card-price">€{ticket.ticket_price.toFixed(2)}</p>
                <div className="ticket-type-card-button">
                    <ShoppingCart />
                    Buy
                </div>
            </div>
        </NavLink>
    );
};