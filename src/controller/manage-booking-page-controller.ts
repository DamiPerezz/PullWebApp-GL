// manage-booking-page-controller.ts
// SECURITY: Authentication via HttpOnly cookies - no localStorage for tokens
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
  const response = await apiClient.get(`/bookings/${reservationId}/details`);
  return response.data;
};

export const authenticateBooking = async (
  reservationId: string,
  credentials: { dpi: string; password: string }
): Promise<AuthenticationResponse> => {
  // SECURITY: El servidor establece una cookie HttpOnly al autenticar
  const response = await apiClient.post(
    `/bookings/${reservationId}/auth`,
    credentials
  );
  return response.data;
};

export const modifyReservationGuests = async (
  reservationId: string,
  guestChanges: GuestChange[]
): Promise<ModifyGuestsResponse> => {
  // SECURITY: La autenticación se envía automáticamente via HttpOnly cookie
  // No necesitamos leer tokens de localStorage
  const response = await apiClient.put(
    `/bookings/${reservationId}/modify-guests`,
    { guestChanges }
  );

  return response.data;
};
