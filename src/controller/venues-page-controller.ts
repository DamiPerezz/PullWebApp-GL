// controllers/venues-page-controller.ts
import type { VenueInfo } from "../types/types";
import { apiClient } from "../utils/axios";

export const getAllVenues = async (): Promise<VenueInfo[]> => {
  const response = await apiClient.get<VenueInfo[]>('/venues/get-all-venues');
  return response.data;
};

export const getVenueInfo = async (venueSlug: string): Promise<VenueInfo> => {
  const response = await apiClient.get(`/venues/events/get-venue-info/${venueSlug}`);
  return response.data;
};

export const getEventsByVenue = async (venueSlug: string) => {
  const response = await apiClient.get(`/venues/events/get-all-events/${venueSlug}`);
  return response.data;
};