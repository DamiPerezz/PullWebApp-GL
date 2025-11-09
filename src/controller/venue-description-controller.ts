// venue-description-controller.ts
import type { VenueDescription } from "../types/types";
import { apiClient } from "../utils/axios";

export const getVenueDescription = async (venueName: string): Promise<VenueDescription> => {
  const response = await apiClient.get(`/venue/get-venue-description/${venueName}`);
  return response.data;
};