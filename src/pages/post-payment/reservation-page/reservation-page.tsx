import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Layout } from "../../components/layout/layout";
import "./reservation-page.css";
import { ReservationHeader } from "../../components/reservation-header/reservation-header";
import { UserDetailsForm } from "../../components/user-details-form/user-details-form";
import { TicketReceipt } from "../../components/ticket-receipt/ticket-receipt";
import { useRef, useState } from "react";
import type { ReservationData } from "../../types/types";
import { formatBookingPostData } from "../../utils/format-post";
import { postBookingRequest } from "../../controller/booking-page-controller";

export const ReservationPage = () => {
  const { venueId, reservationDate } = useParams<{
    venueId: string;
    reservationDate: string;
  }>();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const table = searchParams.get("table");

  const [formQuantity, setFormQuantity] = useState<number>(1);

  const handleQuantityChange = (quantity: number) => {
    setFormQuantity(quantity);
  };

  const formRef = useRef<{ submit: (onSubmit: any) => void }>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const onSubmit = (data: any) => {
    setIsLoading(true);

    console.log("Form submitted with data:", data);

    const finalData: ReservationData = formatBookingPostData({
      id: venueId ? venueId : "",
      data,
      date: reservationDate ? reservationDate : "",
      isTable: table === "true",
    });

    try {
      postBookingRequest(finalData)
        .then((data) => {
          console.log(data);
          setIsLoading(false);
          if (data.status === 201) {
            navigate(`/venue/${venueId}/booking/${reservationDate}/confirmed`);
          }
        })
        .catch((error) => {
          console.error("Error posting booking request:", error);
          setIsLoading(false);
        });
    } catch (error) {
      console.error("Error formatting reservation data:", error);
      setIsLoading(false);
    }

    console.log("Formatted reservation data:", finalData);
  };

  return (
    <Layout>
      <div className="reservation-page-container">
        <ReservationHeader
          id={venueId ? venueId : ""}
          date={reservationDate ? reservationDate : ""}
          table={table ? table : ""}
        />
        <p className="booking-form-title">Booking form</p>
        <div className="reservation-user-details">
          <div className="form-details">
            <UserDetailsForm
              quantity={1}
              ref={formRef}
              isAbooking
              onQuantityChange={handleQuantityChange}
            />
          </div>
          <div className="booking-details">
            <TicketReceipt
              quantity={formQuantity}
              ticketDetails={{
                ticket_name: "General Admission",
                ticket_price: 111,
                ticket_quantity: 3,
                ticket_type_id: "12345",
                slug: "general-admission",
                ticket_description: "Access to the general admission area",
              }}
              url=""
              buttonText="Book now"
              onConfirm={() => formRef.current?.submit(onSubmit)}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};
