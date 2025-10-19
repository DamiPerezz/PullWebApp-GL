import { useParams } from "react-router-dom";
import { Layout } from "../../components/layout/layout";

import './post-payment.css'
import { QrCard } from "../../components/qr-card/qr-card";
import { PrePaymentHeader } from "../../components/payments-header/payments-header";
import { useEffect, useState } from "react";
import type { PurchasedTicketInfo } from "../../types/types";
import { getTicketPurchaseInfo } from "../../controller/post-purchase-controller";

export function PostPaymentPage() {
    const { orderId, eventId } = useParams<{ orderId: string, eventId: string }>();

    const [tickets, setTickets] = useState<PurchasedTicketInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {

        getTicketPurchaseInfo(eventId!, orderId!)
            .then(data => {
                setTickets(data.tickets);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching ticket purchase info:", error);
                setLoading(false);
            });

    }, [orderId, eventId]);

    return (
        <Layout>
            <div className="post-payment-container">
                <PrePaymentHeader url={`/event/${eventId}`} slug={eventId ? eventId : ''} />
                <p className="payment-title">Payment Successful</p>
                <div className="qr-codes-section">
                    {tickets.length !== 0 && !loading ? tickets.map((ticket, index) => (
                        <QrCard key={index} info={ticket} />
                    )) : tickets.length === 0 && !loading ? (
                        <p className="no-tickets">No tickets purchased for this event.</p>
                    ) : (
                        <p className="loading">Loading...</p>
                    )}
                </div>
            </div>
        </Layout>
    )
}