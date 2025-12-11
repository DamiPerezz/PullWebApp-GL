// ticket-receipt.tsx
import './ticket-receipt.css'
import type { TicketType } from '../../types/types'
import { ShoppingCart, ChevronLeft } from 'lucide-react'

export const TicketReceipt = (
    { quantity, ticketDetails, onConfirm, buttonText = "Continue to Data", disabled = false }
        :
        {
            quantity: number,
            ticketDetails: TicketType,
            onConfirm?: () => void,
            buttonText?: string,
            disabled?: boolean
        }
) => {
    const currencySymbol = ticketDetails.currency === 'GTQ' ? 'Q' : 
                          ticketDetails.currency === 'USD' ? '$' : 
                          ticketDetails.currency === 'EUR' ? '€' : 
                          ticketDetails.currency || 'Q';
    
    const subtotal = ticketDetails.ticket_price * quantity;
    const serviceFee = subtotal * 0.112;
    const total = subtotal + serviceFee;

    return (
        <div className="ticket-receipt">
            <div className="ticket-receipt-card">
                <div className="ticket-receipt-header">
                    <h3 className="ticket-receipt-title">Order Summary</h3>
                    <ShoppingCart className="ticket-receipt-icon" />
                </div>

                <div className="ticket-receipt-items">
                    <div className="ticket-receipt-item">
                        <div className="ticket-receipt-item-info">
                            <div className="ticket-receipt-item-name">
                                {ticketDetails.ticket_name}
                            </div>
                            <div className="ticket-receipt-item-quantity">
                                {quantity}x {quantity > 1 ? 'tickets' : 'ticket'}
                            </div>
                        </div>
                        <div className="ticket-receipt-item-price">
                            <div className="ticket-receipt-item-amount">
                                {currencySymbol}{ticketDetails.ticket_price?.toFixed(2)}
                            </div>
                            <div className="ticket-receipt-item-label">
                                per ticket
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ticket-receipt-divider" />

                <div className="ticket-receipt-totals">
                    <div className="ticket-receipt-subtotal">
                        <span>Subtotal</span>
                        <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="ticket-receipt-fee">
                        <span>Service Fee</span>
                        <span>{currencySymbol}{serviceFee.toFixed(2)}</span>
                    </div>

                    <div className="ticket-receipt-total">
                        <span>Total</span>
                        <span className="ticket-receipt-total-amount">
                            {currencySymbol}{total.toFixed(2)}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onConfirm}
                    className="ticket-receipt-button"
                    disabled={disabled}
                >
                    {buttonText}
                    <ChevronLeft className="ticket-receipt-button-icon" />
                </button>
            </div>
        </div>
    );
}