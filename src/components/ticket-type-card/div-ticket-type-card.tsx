import type { TicketType } from "../../types/types"
import './ticket-type-card.css'

export const DivTicketTypeCard = ({ ticket }: { ticket: TicketType }) => {
    return (
        <div className="ticket-type-card-container div-ticket">
            <div className="header-ticket-card">
                <div>
                    <h3>{ticket.ticket_name}</h3>
                </div>
                <p className="price">Q {ticket.ticket_price.toFixed(2)}</p>
            </div>
            <div>
                <p className="description">{ticket.ticket_description}</p>
            </div>
        </div>
    )
}