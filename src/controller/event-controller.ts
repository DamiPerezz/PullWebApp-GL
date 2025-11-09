// event-controller.ts
import type { EventDetailedInfo, TicketType } from "../types/types";
import { apiClient } from "../utils/axios";

export const getEventDetailedInfo = async (eventSlug: string): Promise<EventDetailedInfo> => {
  const response = await apiClient.get(`/event/get-detailed-event-info/${eventSlug}`);
  return response.data;
};

export const getTicketTypes = async (eventSlug: string): Promise<TicketType[]> => {
  const response = await apiClient.get(`/ticket-type/get-ticket-types/${eventSlug}`);
  return response.data;
};