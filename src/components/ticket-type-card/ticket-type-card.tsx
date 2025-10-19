import { NavLink } from 'react-router-dom'
import { ShoppingCartIcon } from '../../icons/icons'
import './ticket-type-card.css'
import type { TicketType } from '../../types/types'

export const TicketTypeCard = ({ ticket }: { ticket: TicketType }) => {
    return (
        <NavLink to={`/event/${ticket.slug}/tickets/${ticket.ticket_type_id}`} className="ticket-type-card-container">
            <div className="header-ticket-card">
                <div>
                    <h3>{ticket.ticket_name}</h3>
                    {ticket.ticket_quantity < 15 && <p className="availability">¡Quedan pocas entradas! {ticket.ticket_quantity} disponibles</p>}
                </div>
                <p className="price">Q {ticket.ticket_price.toFixed(2)}</p>
            </div>
            <div>
                <p className="description">{ticket.ticket_description}</p>
                <div className='buy-ticket-button'><ShoppingCartIcon strokeColor='#fff' /> Buy</div>
            </div>
        </NavLink>
    )
}