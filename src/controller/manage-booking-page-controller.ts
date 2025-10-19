import type {
  AuthenticationResponse,
  ReservationDetailsResponse,
  GuestChange,
  ModifyGuestsResponse,
} from "../types/types";
import { apiClient } from "../utils/axios";

export const getReservationDetails = async (
  reservationId: string
): Promise<ReservationDetailsResponse> => {
  try {
    const response = await apiClient.get(`/bookings/${reservationId}/details`);
    return response.data;
  } catch (error) {
    console.error("Error fetching reservation details:", error);
    throw error;
  }
};

export const authenticateBooking = async (
  reservationId: string,
  credentials: { dpi: string; password: string }
): Promise<AuthenticationResponse> => {
  try {
    const response = await apiClient.post(
      `/bookings/${reservationId}/auth`,
      credentials
    );
    return response.data;
  } catch (error) {
    console.error("Error authenticating reservation:", error);
    throw error;
  }
};

export const modifyReservationGuests = async (
  reservationId: string,
  guestChanges: GuestChange[]
): Promise<ModifyGuestsResponse> => {
  try {
    const token = localStorage.getItem("reservationToken");

    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await apiClient.put(
      `/bookings/${reservationId}/modify-guests`,
      { guestChanges },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error modifying reservation guests:", error);
    throw error;
  }
};
