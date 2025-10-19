import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import { PrePaymentHeader } from "../../components/payments-header/payments-header";
import "./payment-page.css";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import { UserDetailsForm } from "../../components/user-details-form/user-details-form";
import { useEffect, useRef, useState } from "react";
import {
  getTicketInfo,
  postTicketPurchase,
} from "../../controller/purchase-pages-controller";
import type { TicketResponse, TicketType } from "../../types/types";

export const PaymentPage = () => {
  const { eventId, ticketTypeId, quantity } = useParams<{
    eventId: string;
    ticketTypeId: string;
    quantity: string;
  }>();

  const url = `/event/${eventId}/tickets/${ticketTypeId}`;

  const formRef = useRef<{ submit: (onSubmit: any) => void }>(null);

  const navigate = useNavigate();

  const onSubmit = (data: any) => {
    postTicketPurchase(ticketTypeId!, eventId!, data)
      .then((response: TicketResponse) => {
        navigate(`/wallet/${response.order_id}/${eventId!}`);
      })
      .catch((error) => {
        console.error("Error during ticket purchase:", error);
      });
  };

  const [ticketDetails, setTicketDetails] = useState<TicketType>(
    {} as TicketType
  );
  const [loading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!eventId || !ticketTypeId) {
      return;
    }

    getTicketInfo(eventId, ticketTypeId)
      .then((data) => {
        setTicketDetails(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching ticket details:", error);
        setIsLoading(false);
      });
  }, [eventId, ticketTypeId]);

  return (
    <Layout>
      <div className="payment-page-container">
        <PrePaymentHeader url={url} slug={eventId ? eventId : ""} />
        {loading ? (
          <p>Loading ticket details...</p>
        ) : (
          <div className="payment-user-details">
            <div className="user-details">
              <UserDetailsForm quantity={Number(quantity!)} ref={formRef} />
            </div>
            <div className="super-receipt-container">
              <TicketReceipt
                quantity={Number(quantity!)}
                ticketDetails={ticketDetails}
                url={``}
                buttonText="Confirm Payment"
                isNavigationLink={false}
                onConfirm={() => formRef.current?.submit(onSubmit)}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
