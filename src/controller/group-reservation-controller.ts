// controllers/group-reservation-controller.ts
import type { VIPBottle, VIPMixer } from "../types/types";
import { apiClient } from "../utils/axios";

export const getAvailableBottles = async (venueSlug: string): Promise<VIPBottle[]> => {
  const response = await apiClient.get(`/group-reservations/bottles/${venueSlug}`);
  return response.data;
};

export const getAvailableMixers = async (venueSlug: string): Promise<VIPMixer[]> => {
  const response = await apiClient.get(`/group-reservations/mixers/${venueSlug}`);
  return response.data;
};

export interface CreateGroupReservationRequest {
  event_slug: string;
  guest_count: number;
  organizer_data: {
    name: string;
    last_name: string;
    email: string;
    phone?: string;
    phone_prefix?: string;
    birth_date?: string;
    gender: string;
  };
  guests: Array<{
    name: string;
    last_name: string;
    email?: string;
    gender: string;
    amount_due?: number;
    host_pays?: boolean;
  }>;
  bottles?: Array<{
    bottle_id: string;
    quantity: number;
  }>;
  mixers?: Array<{
    mixer_id: string;
    quantity: number;
  }>;
  total_amount?: number;
  special_requests?: string;
}

export interface CreateGroupReservationResponse {
  success: boolean;
  reservation_id: string;
  management_code: string;
  payment_link_code?: string;
  total_amount?: number;
  currency?: string;
  message: string;
}

export const createGroupReservation = async (
  data: CreateGroupReservationRequest
): Promise<CreateGroupReservationResponse> => {
  const response = await apiClient.post('/group-reservations/create', data);
  return response.data;
};

export const getGroupReservationByCode = async (managementCode: string) => {
  const response = await apiClient.get(`/group-reservations/manage/${managementCode}`);
  return response.data;
};

export const getGroupReservationByPaymentLink = async (paymentLinkCode: string) => {
  const response = await apiClient.get(`/group-reservations/track/${paymentLinkCode}`);
  return response.data;
};
