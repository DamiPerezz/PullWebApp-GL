import { NavLink } from 'react-router-dom'
import './ticket-receipt.css'
import type { TicketType } from '../../types/types'

export const TicketReceipt = (
    { quantity, ticketDetails, url, buttonText, isNavigationLink, onConfirm, isLoading }
        :
        {
            quantity: number,
            ticketDetails: TicketType,
            url: string,
            buttonText: string,
            isNavigationLink?: boolean,
            onConfirm?: () => void,
            isLoading?: boolean
        }
) => {
    return (
        <div className="ticket-receipt">
            <div className="receipt-container">
                <div className="title">Ticket Receipt</div>
                <div className="separator" />
                <div className="receipt-details">
                    <div>
                        <p>{quantity}*{ticketDetails.ticket_name} ({ticketDetails.ticket_price})</p>
                        <p>Q {quantity * ticketDetails.ticket_price}</p>
                    </div>
                    <div>
                        <p>Management</p>
                        <p>Q {quantity * 8.75}</p>
                    </div>
                </div>
                <div className="separator" />
                <div className="receipt-total">
                    <p>Total</p>
                    <p>Q {quantity * ticketDetails.ticket_price + quantity * 8.75}</p>
                </div>
            </div>
            {/* `/events/${ticketDetails.eventId}/tickets/${ticketTypeId}/${quantity}` */}
            {isNavigationLink ?
                <NavLink to={url} className="receipt-button">{buttonText}</NavLink>
                :
                <button className="receipt-button" onClick={onConfirm} disabled={isLoading}>
                    {buttonText}
                </button>
            }
        </div>
    )
}