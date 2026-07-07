import { NavLink, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next";
import { CalendarIcon, ClockIcon, GoBackIcon, LocationIcon } from "../../icons/icons"

import './reservation-header.css'
import { useEffect, useState } from "react";

export const ReservationHeader = (
    { id, date, table, isPaymentPage, startTime, endTime, isWithTime }:
        {
            id: string;
            date: string;
            table: string;
            isPaymentPage?: boolean;
            startTime?: string;
            endTime?: string;
            isWithTime?: boolean
        }) => {

    const { t, i18n } = useTranslation('common');
    const { lang } = useParams<{ lang: string }>();
    const currentLang = lang || i18n.language || 'es';

    const name = id.replace(/-/g, ' ');

    const [isTableBooking, setIsTableBooking] = useState<boolean>(table == "true");

    useEffect(() => {
        setIsTableBooking(table == "true");
    }, [table])

    return (
        <div className="reservation-header-container">
            <div className="reservation-header">
                {!isPaymentPage && <NavLink to={`/${currentLang}/venues/${id}/events`} className="reservation-header-link"><GoBackIcon strokeColor="white" /></NavLink>}
                <p>{isTableBooking ? t('venue.table') : t('venue.bar')} {t('venue.bookingFor')} {name}</p>
            </div>
            <div className="venue-info-header">
                <img src="https://i.etsystatic.com/34752464/r/il/33cf3a/3925609298/il_570xN.3925609298_fv2t.jpg" alt="Arriba" />
                <div className="more-info">
                    <p><CalendarIcon strokeColor="var(--light-color-gray)" /> {date}</p>
                    <p><LocationIcon strokeColor="var(--light-color-gray)" /> {name}</p>
                    {isWithTime && <p><ClockIcon strokeColor="var(--light-color-gray)" /> {startTime} - {endTime}</p>}
                </div>
            </div>
        </div>
    )
}
