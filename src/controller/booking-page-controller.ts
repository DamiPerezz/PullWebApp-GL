import type { ReservationData } from "../types/types";
import { apiClient } from "../utils/axios";

export const postBookingRequest = async (
  data: ReservationData
): Promise<any> => {
  try {
    const response = await apiClient.post("/venues/request-reservation", data);
    return response.data;
  } catch (error) {
    console.error("Error posting booking request:", error);
    throw error;
  }
};
