import './ticket-receipt.css'
import type { TicketType } from '../../types/types'
import { ShoppingCart, ChevronLeft } from 'lucide-react'

export const TicketReceipt = (
    { quantity, ticketDetails, onConfirm, buttonText = "Continue to Data" }
        :
        {
            quantity: number,
            ticketDetails: TicketType,
            onConfirm?: () => void,
            buttonText?: string
        }
) => {
    const subtotal = ticketDetails.ticket_price * quantity;
    const serviceFee = subtotal * 0.07;
    const total = subtotal + serviceFee;

    return (
        <div className="ticket-receipt">
            <div className="ticket-receipt-card">
                {/* Header */}
                <div className="ticket-receipt-header">
                    <h3 className="ticket-receipt-title">Order Summary</h3>
                    <ShoppingCart className="ticket-receipt-icon" />
                </div>

                {/* Items */}
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
                                €{ticketDetails.ticket_price?.toFixed(2)}
                            </div>
                            <div className="ticket-receipt-item-label">
                                per ticket
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="ticket-receipt-divider" />

                {/* Totals */}
                <div className="ticket-receipt-totals">
                    <div className="ticket-receipt-subtotal">
                        <span>Subtotal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="ticket-receipt-fee">
                        <span>Service Fee (7%)</span>
                        <span>€{serviceFee.toFixed(2)}</span>
                    </div>

                    {/* Total */}
                    <div className="ticket-receipt-total">
                        <span>Total</span>
                        <span className="ticket-receipt-total-amount">
                            €{total.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Confirm Button */}
                <button
                    onClick={onConfirm}
                    className="ticket-receipt-button"
                >
                    {buttonText}
                    <ChevronLeft className="ticket-receipt-button-icon" />
                </button>

                {/* Secure Payment Badge */}
                <div className="ticket-receipt-badge">
                    <div className="ticket-receipt-badge-dot" />
                    Secure payment with Stripe
                </div>
            </div>
        </div>
    );
}