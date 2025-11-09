import type { PurchasedTicketInfo } from "../types/types";
import { apiClient } from "../utils/axios";

/**
 * Obtiene los tickets de una orden completada por su orderId y eventId
 */
export const getTicketsByOrderId = async (orderId: string, eventId: string): Promise<{ tickets: PurchasedTicketInfo[] }> => {
  try {
    const response = await apiClient.get<{ tickets: PurchasedTicketInfo[] }>(`/orders/${orderId}/${eventId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error getting tickets by order ID:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to retrieve tickets");
  }
};

/**
 * Función legacy - mantener por compatibilidad con wallet page
 * @deprecated Use getTicketsByOrderId instead
 */
export const getTicketPurchaseInfo = async (eventId: string, ticketTypeId: string): Promise<{ tickets: PurchasedTicketInfo[] }> => {
  try {
    const response = await apiClient.get<{ tickets: PurchasedTicketInfo[] }>(`/orders/${ticketTypeId}/${eventId}`);
    return response.data;
  } catch (error: any) {
    console.error("Error getting ticket purchase info:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to retrieve ticket information");
  }
};