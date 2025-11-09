// venue-controller.ts
import type { VenueEventInfo } from "../types/types";
import { apiClient } from "../utils/axios";

export const getVenueEventInfo = async (venueId: string): Promise<VenueEventInfo> => {
  const response = await apiClient.get(`/venue/get-event-venue-info/${venueId}`);
  return response.data;
};