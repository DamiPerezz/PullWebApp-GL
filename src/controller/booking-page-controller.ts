// controllers/booking-page-controller.ts
import type { ReservationData } from "../types/types";
import { apiClient } from "../utils/axios";

export const postBookingRequest = async (
  data: ReservationData
): Promise<any> => {
  const response = await apiClient.post("/venues/request-reservation", data);
  return response.data;
};

export const getReservationTypes = async (venueId: string) => {
  const response = await apiClient.get(`/venues/get-reservation-types/${venueId}`);
  return response.data;
};