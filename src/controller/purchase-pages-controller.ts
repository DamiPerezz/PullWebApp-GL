import type { TicketResponse, TicketType, UserInfoTicket } from "../types/types";
import { apiClient } from "../utils/axios";

export const getEventDetailedInfo = async (eventId: string): Promise<any> => {
    const response = await apiClient.get<any>(`/event/get-detailed-event-info/${eventId}`);
    return response.data;
}

export const getEventTicketsTypes = async (eventId: string): Promise<TicketType[]> => {
    const response = await apiClient.get<TicketType[]>(`/event/get-tickets-types/${eventId}`);
    return response.data;
}

export const getTicketInfo = async (slug: string, ticketTypeId: string): Promise<TicketType> => {
    const response = await apiClient.get<TicketType>(`/event/get-ticket-info/${slug}/${ticketTypeId}`);
    return response.data;
}

export const postTicketPurchase = async (ticket_type_id: string, slug_id: string, tickets: { usuarios: UserInfoTicket[] }): Promise<TicketResponse> => {

    const ticketsMapped = tickets.usuarios.map((t) => ({
        ...t,
        owner_birth_date: t.owner_birthdate
            ? new Date(t.owner_birthdate).toISOString().substring(0, 10)
            : "",
    }));

    const response = await apiClient.post<TicketResponse>(`/orders/reserve`, {
        ticket_type_id,
        slug_id,
        tickets: ticketsMapped,
    });

    return response.data;
};