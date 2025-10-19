import { NavLink } from "react-router-dom"
import { CalendarIcon, ClockIcon, LocationIcon, GoBackIcon } from "../../icons/icons"
import './payments-header.css'
import { useEffect, useState } from "react"
import type { EventDetailedInfo } from "../../types/types"
import { getEventDetailedInfo } from "../../controller/purchase-pages-controller"

export const PrePaymentHeader = ({ url, slug }: { url: string, slug: string }) => {

    const [eventDetail, setEventDetail] = useState<EventDetailedInfo | null>(null);

    useEffect(() => {
        getEventDetailedInfo(slug)
            .then(data => {
                setEventDetail(data);
            })
            .catch(error => {
                console.error("Error fetching event details:", error);
            });
    }, [slug])

    const date = new Date(eventDetail?.date || '');

    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const open = eventDetail?.open_time.slice(0, 5);
    const close = eventDetail?.close_time.slice(0, 5);

    return (
        <>
            <div className="pre-payment-header">
                <NavLink to={url} className="pre-payment-header-link"><GoBackIcon strokeColor="white" /></NavLink>
                <p>{eventDetail?.event_name} at {eventDetail?.location}</p>
            </div>
            <div className="event-info-sum-up">
                <img src={eventDetail?.event_img} alt={eventDetail?.event_name} width={80} />
                <div>
                    <p><CalendarIcon strokeColor="var(--light-color-gray)" /> <span>{formattedDate}</span></p>
                    <p><ClockIcon strokeColor="var(--light-color-gray)" /> {open} - {close}</p>
                    <p><LocationIcon strokeColor="var(--light-color-gray)" /> {eventDetail?.location}</p>
                </div>
            </div>
            <h2>{eventDetail?.event_name}</h2>
        </>
    )
}