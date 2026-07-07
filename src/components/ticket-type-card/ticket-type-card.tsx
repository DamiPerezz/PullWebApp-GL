// ticket-type-card.tsx - ACTUALIZADO PROFESIONAL
import { NavLink, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShoppingCart, User, Users, Wine, CheckCircle } from 'lucide-react';
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
    const { t } = useTranslation('common');
    const { lang } = useParams<{ lang: string }>();
    const currentLang = lang || 'es';

    const getTicketIcon = () => {
        const isGroup = ticket.is_group || ticket.ticket_name.toLowerCase().includes('group');
        if (isGroup) return <Wine className="ticket-icon-blue" />;
        return <User className="ticket-icon-purple" />;
    };

    const getTicketClass = () => {
        const isGroup = ticket.is_group || ticket.ticket_name.toLowerCase().includes('group');
        if (isGroup) return 'ticket-type-card ticket-group-blue';
        return 'ticket-type-card ticket-individual-purple';
    };

    const isGroupTicket = ticket.is_group || ticket.ticket_name.toLowerCase().includes('group');
    const currencySymbol = getCurrencySymbol(ticket.currency);

    if (isGroupTicket) {
        return (
            <NavLink
                to={`/${currentLang}/event/${ticket.slug}/group/setup`}
                className={getTicketClass()}
            >
                <div className="ticket-type-card-header">
                    <div className="ticket-type-card-title-wrapper">
                        {getTicketIcon()}
                        <h3 className="ticket-type-card-title">{ticket.ticket_name}</h3>
                    </div>
                    {ticket.ticket_quantity < 15 && (
                        <p className="ticket-type-card-availability">
                            {t('ticketCard.onlyLeft', { count: ticket.ticket_quantity })}
                        </p>
                    )}
                </div>
                
                <p className="ticket-type-card-description">{ticket.ticket_description}</p>
                
                <div className="ticket-group-features">
                    <div className="ticket-group-feature">
                        <CheckCircle />
                        <span>{t('ticketCard.premiumBottle')}</span>
                    </div>
                    <div className="ticket-group-feature">
                        <CheckCircle />
                        <span>{t('ticketCard.dedicatedArea')}</span>
                    </div>
                    <div className="ticket-group-feature">
                        <CheckCircle />
                        <span>{t('ticketCard.easyPayment')}</span>
                    </div>
                </div>
                
                <div className="ticket-type-card-footer">
                    <div className="ticket-group-capacity">
                        <Users size={16} />
                        <span>{t('ticketCard.guests', { min: ticket.min_quantity || 4, max: ticket.max_quantity || 12 })}</span>
                    </div>
                    <div className="ticket-type-card-button">
                        <Wine />
                        {t('ticketCard.reserveNow')}
                        <ArrowRight />
                    </div>
                </div>
            </NavLink>
        );
    }

    return (
        <NavLink 
            to={`/${currentLang}/event/${ticket.slug}/tickets/${ticket.ticket_type_id}`} 
            className={getTicketClass()}
        >
            <div className="ticket-type-card-header">
                <div className="ticket-type-card-title-wrapper">
                    {getTicketIcon()}
                    <h3 className="ticket-type-card-title">{ticket.ticket_name}</h3>
                </div>
                {ticket.ticket_quantity < 15 && (
                    <p className="ticket-type-card-availability">
                        {t('ticketCard.onlyLeft', { count: ticket.ticket_quantity })}
                    </p>
                )}
            </div>
            
            <p className="ticket-type-card-description">{ticket.ticket_description}</p>
            
            <div className="ticket-type-card-footer">
                <p className="ticket-type-card-price">{currencySymbol}{ticket.ticket_price.toFixed(2)}</p>
                <div className="ticket-type-card-button">
                    <ShoppingCart />
                    {t('ticketCard.buy')}
                    <ArrowRight />
                </div>
            </div>
        </NavLink>
    );
};
