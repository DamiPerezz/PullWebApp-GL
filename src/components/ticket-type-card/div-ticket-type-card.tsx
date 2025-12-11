// div-ticket-type-card.tsx - ACTUALIZADO PROFESIONAL
import type { TicketType } from "../../types/types";
import { User, Users, CheckCircle } from 'lucide-react';
import './ticket-type-card.css';

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

export const DivTicketTypeCard = ({ ticket }: { ticket: TicketType }) => {
    const getTicketIcon = () => {
        const name = ticket.ticket_name.toLowerCase();
        if (name.includes('women')) return <User className="ticket-icon-women" />;
        if (name.includes('men')) return <User className="ticket-icon-men" />;
        if (name.includes('group')) return <Users className="ticket-icon-group" />;
        return null;
    };

    const getTicketClass = () => {
        const name = ticket.ticket_name.toLowerCase();
        if (name.includes('women')) return 'ticket-type-card div-ticket-type-card ticket-type-card-unavailable ticket-women';
        if (name.includes('men')) return 'ticket-type-card div-ticket-type-card ticket-type-card-unavailable ticket-men';
        if (name.includes('group')) return 'ticket-type-card div-ticket-type-card ticket-type-card-unavailable ticket-group';
        return 'ticket-type-card div-ticket-type-card ticket-type-card-unavailable';
    };

    const isGroupTicket = ticket.ticket_name.toLowerCase().includes('group');
    const currencySymbol = getCurrencySymbol(ticket.currency);

    if (isGroupTicket) {
        return (
            <div className={getTicketClass()}>
                <div className="ticket-type-card-header">
                    <div className="ticket-type-card-title-wrapper">
                        {getTicketIcon()}
                        <h3 className="ticket-type-card-title">{ticket.ticket_name}</h3>
                    </div>
                    <div className="ticket-type-card-sold-out-badge">
                        Sold Out
                    </div>
                </div>
                
                <div className="ticket-type-card-body">
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
                </div>

                <div className="ticket-type-card-footer">
                    <p className="ticket-type-card-price">{currencySymbol}{ticket.ticket_price.toFixed(2)}</p>
                    <div className="ticket-type-card-button-unavailable">
                        Not Available
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={getTicketClass()}>
            <div className="ticket-type-card-header">
                <div className="ticket-type-card-title-wrapper">
                    {getTicketIcon()}
                    <h3 className="ticket-type-card-title">{ticket.ticket_name}</h3>
                </div>
                <div className="ticket-type-card-sold-out-badge">
                    Sold Out
                </div>
            </div>
            
            <div className="ticket-type-card-body">
                <p className="ticket-type-card-description">{ticket.ticket_description}</p>
            </div>

            <div className="ticket-type-card-footer">
                <p className="ticket-type-card-price">{currencySymbol}{ticket.ticket_price.toFixed(2)}</p>
                <div className="ticket-type-card-button-unavailable">
                    Not Available
                </div>
            </div>
        </div>
    );
};