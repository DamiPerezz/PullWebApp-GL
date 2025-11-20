// controllers/venue-controller.ts
import type { VenueEventInfo, VenueInfo } from "../types/types";
import { apiClient } from "../utils/axios";

export const getVenueEventInfo = async (venueId: string): Promise<VenueEventInfo> => {
  const response = await apiClient.get(`/venues/get-event-venue-info/${venueId}`);
  return response.data;
};

export const getVenueInfo = async (venueSlug: string): Promise<VenueInfo> => {
  const response = await apiClient.get(`/venues/events/get-venue-info/${venueSlug}`);
  return response.data;
};

export const getAllVenues = async (): Promise<VenueInfo[]> => {
  const response = await apiClient.get<VenueInfo[]>('/venues/get-all-venues');
  return response.data;
};

export const getEventsByVenue = async (venueSlug: string) => {
  const response = await apiClient.get(`/venues/events/get-all-events/${venueSlug}`);
  return response.data;
};