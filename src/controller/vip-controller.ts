// vip-controller.ts
import type { 
  VIPTable, 
  VIPBottle, 
  VIPMixer, 
  VIPPerk,
  CreateVIPReservationRequest,
  CreateVIPReservationResponse,
  VIPReservationDetails,
  EventDetailedInfo
} from "../types/types";
import { apiClient } from "../utils/axios";

export const getAvailableVIPTables = async (eventSlug: string): Promise<{ tables: VIPTable[] }> => {
  const response = await apiClient.get(`/vip/tables/${eventSlug}`);
  return response.data;
};

export const getVenueBottles = async (venueId: string): Promise<{ bottles: VIPBottle[] }> => {
  const response = await apiClient.get(`/vip/bottles/${venueId}`);
  return response.data;
};

export const getVenueMixers = async (venueId: string): Promise<{ mixers: VIPMixer[] }> => {
  const response = await apiClient.get(`/vip/mixers/${venueId}`);
  return response.data;
};

export const getVenuePerks = async (venueId: string): Promise<{ perks: VIPPerk[] }> => {
  const response = await apiClient.get(`/vip/perks/${venueId}`);
  return response.data;
};

export const createVIPReservation = async (
  data: CreateVIPReservationRequest
): Promise<CreateVIPReservationResponse> => {
  const response = await apiClient.post('/vip/create', data);
  return response.data;
};

export const getVIPReservationByCode = async (
  managementCode: string
): Promise<{ reservation: VIPReservationDetails }> => {
  const response = await apiClient.get(`/vip/manage/${managementCode}`);
  return response.data;
};

export const getVIPReservationByPaymentLink = async (
  paymentLinkCode: string
): Promise<{ reservation: VIPReservationDetails }> => {
  const response = await apiClient.get(`/vip/payment/${paymentLinkCode}`);
  return response.data;
};

export const addGuestToReservation = async (
  managementCode: string,
  guestData: {
    name: string;
    last_name: string;
    email: string;
    gender?: string;
  }
): Promise<{ success: boolean; guest_id: string }> => {
  const response = await apiClient.post('/vip/add-guest', {
    management_code: managementCode,
    guest_data: guestData,
  });
  return response.data;
};

export const removeGuestFromReservation = async (
  managementCode: string,
  guestId: string
): Promise<{ success: boolean }> => {
  const response = await apiClient.post('/vip/remove-guest', {
    management_code: managementCode,
    guest_id: guestId,
  });
  return response.data;
};

export const cancelVIPReservation = async (
  managementCode: string
): Promise<{ success: boolean }> => {
  const response = await apiClient.post('/vip/cancel', {
    management_code: managementCode,
  });
  return response.data;
};

export const createVIPGuestCheckout = async (
  paymentLinkCode: string,
  guestId: string
): Promise<{ success: boolean; sessionId: string; url: string }> => {
  const response = await apiClient.post('/vip/checkout', {
    payment_link_code: paymentLinkCode,
    guest_id: guestId,
  });
  return response.data;
};

export const confirmVIPGuestPayment = async (
  sessionId: string
): Promise<{ success: boolean }> => {
  const response = await apiClient.get('/vip/confirm-payment', {
    params: { session_id: sessionId },
  });
  return response.data;
};

export const getEventDetailedInfo = async (eventId: string): Promise<EventDetailedInfo> => {
  const response = await apiClient.get(`/event/get-detailed-event-info/${eventId}`);
  return response.data;
};