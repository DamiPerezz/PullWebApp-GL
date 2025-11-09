import type { TicketType } from "../../types/types";
import './ticket-type-card.css';

export const DivTicketTypeCard = ({ ticket }: { ticket: TicketType }) => {
    return (
        <div className="ticket-type-card div-ticket-type-card ticket-type-card-unavailable">
            <div className="ticket-type-card-header">
                <div className="ticket-type-card-info">
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
                <p className="ticket-type-card-price">€{ticket.ticket_price.toFixed(2)}</p>
                <div className="ticket-type-card-button-unavailable">
                    Not Available
                </div>
            </div>
        </div>
    );
};