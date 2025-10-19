import type { PurchasedTicketInfo } from "../types/types";
import { apiClient } from "../utils/axios";

export const getTicketPurchaseInfo = async (eventId: string, ticketTypeId: string): Promise<{ tickets: PurchasedTicketInfo[] }> => {
    const response = await apiClient.get<{ tickets: PurchasedTicketInfo[] }>(`/orders/${ticketTypeId}/${eventId}`);

    return response.data;
}