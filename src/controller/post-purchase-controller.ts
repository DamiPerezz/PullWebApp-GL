// controllers/post-purchase-controller.ts - CORREGIDO
import type { PurchasedTicketInfo } from "../types/types";
import { apiClient } from "../utils/axios";

export const getTicketsByOrderId = async (orderId: string): Promise<{ tickets: PurchasedTicketInfo[] }> => {
  try {
    const response = await apiClient.get<{ success: boolean; tickets: PurchasedTicketInfo[] }>(`/orders/${orderId}/tickets`);
    return response.data;
  } catch (error: any) {
    console.error("Error getting tickets by order ID:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to retrieve tickets");
  }
};