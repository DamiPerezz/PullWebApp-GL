import { useParams } from "react-router-dom"
import { Layout } from "../../components/layout/layout"
import './pre-purchase-page.css'
import { MinusIcon, PlusIcon } from "../../icons/icons";
import { useEffect, useState } from "react";
import { DivTicketTypeCard } from "../../components/ticket-type-card/div-ticket-type-card";
import { PrePaymentHeader } from "../../components/payments-header/payments-header";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import type { TicketType } from "../../types/types";
import { getTicketInfo } from "../../controller/purchase-pages-controller";


export const PrePurchasePage = () => {

    const { eventId, ticketTypeId } = useParams<{ eventId: string, ticketTypeId: string }>();
    const [loading, setIsLoading] = useState<boolean>(true);

    const [ticketDetails, setTicketDetails] = useState<TicketType>({} as TicketType);

    useEffect(() => {

        if (!eventId || !ticketTypeId) {
            return;
        }

        getTicketInfo(eventId, ticketTypeId)
            .then(data => {
                setTicketDetails(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error("Error fetching ticket details:", error);
                setIsLoading(false);
            });

    }, [eventId, ticketTypeId])

    const [quantity, setQuantity] = useState<number>(1);

    const url = `/event/${eventId}`;

    return (
        <Layout>
            <div className="pre-payment-container">
                <PrePaymentHeader url={url} slug={eventId ? eventId : ''} />
                {loading ? <p>Loading ticket details...</p> :
                    <div className="selection-ticket-container">
                        <div className="ticket-options">
                            <DivTicketTypeCard ticket={ticketDetails} />
                            <div className="quantity-selector">
                                <p>Choose the quantity</p>
                                <div className="quantity-options">
                                    <button
                                        onClick={() => { quantity > 1 ? setQuantity(quantity - 1) : 1 }}
                                        disabled={quantity === 1}
                                    >
                                        <MinusIcon strokeColor="var(--light-color-gray)" />
                                    </button>
                                    <p>{quantity}</p>
                                    <button
                                        onClick={() => { setQuantity(quantity + 1) }}
                                    ><PlusIcon strokeColor="var(--light-color-gray)" /></button>
                                </div>
                            </div>
                        </div>
                        <div className="payment-container">
                            <TicketReceipt
                                quantity={quantity}
                                ticketDetails={ticketDetails}
                                url={`/event/${eventId}/tickets/${ticketTypeId}/${quantity}`}
                                isNavigationLink
                                buttonText="Pay"
                            />
                        </div>
                    </div>}
            </div>
        </Layout >
    )
}