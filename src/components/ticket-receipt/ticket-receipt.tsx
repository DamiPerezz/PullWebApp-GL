// ticket-receipt.tsx
import { useTranslation } from 'react-i18next';
import './ticket-receipt.css'
import type { TicketType } from '../../types/types'
import { ShoppingCart, ChevronLeft } from 'lucide-react'

export const TicketReceipt = (
    { quantity, ticketDetails, onConfirm, buttonText, disabled = false }
        :
        {
            quantity: number,
            ticketDetails: TicketType,
            onConfirm?: () => void,
            buttonText?: string,
            disabled?: boolean
        }
) => {
    const { t } = useTranslation('common');
    const displayButtonText = buttonText || t('receipt.continueToData');
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
                    <h3 className="ticket-receipt-title">{t('receipt.orderSummary')}</h3>
                    <ShoppingCart className="ticket-receipt-icon" />
                </div>

                <div className="ticket-receipt-items">
                    <div className="ticket-receipt-item">
                        <div className="ticket-receipt-item-info">
                            <div className="ticket-receipt-item-name">
                                {ticketDetails.ticket_name}
                            </div>
                            <div className="ticket-receipt-item-quantity">
                                {quantity}x {quantity > 1 ? t('receipt.tickets') : t('receipt.ticket')}
                            </div>
                        </div>
                        <div className="ticket-receipt-item-price">
                            <div className="ticket-receipt-item-amount">
                                {currencySymbol}{ticketDetails.ticket_price?.toFixed(2)}
                            </div>
                            <div className="ticket-receipt-item-label">
                                {t('receipt.perTicket')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ticket-receipt-divider" />

                <div className="ticket-receipt-totals">
                    <div className="ticket-receipt-subtotal">
                        <span>{t('receipt.subtotal')}</span>
                        <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="ticket-receipt-fee">
                        <span>{t('receipt.serviceFee')}</span>
                        <span>{currencySymbol}{serviceFee.toFixed(2)}</span>
                    </div>

                    <div className="ticket-receipt-total">
                        <span>{t('receipt.total')}</span>
                        <span className="ticket-receipt-total-amount">
                            {currencySymbol}{total.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <button
                onClick={onConfirm}
                className="ticket-receipt-button"
                disabled={disabled}
            >
                {displayButtonText}
                <ChevronLeft className="ticket-receipt-button-icon" />
            </button>
        </div>
    );
}
