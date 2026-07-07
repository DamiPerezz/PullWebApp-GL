// controllers/venue-controller.ts
// PERFORMANCE: Uses API caching for frequently accessed venue data
import type { VenueEventInfo, VenueInfo } from "../types/types";
import { apiClient } from "../utils/axios";
import { apiCache, cacheKeys, CACHE_DURATIONS } from "../utils/apiCache";

export const getVenueEventInfo = async (venueId: string): Promise<VenueEventInfo> => {
  return apiCache.get(
    cacheKeys.venues.info(venueId),
    async () => {
      const response = await apiClient.get(`/venues/get-event-venue-info/${venueId}`);
      return response.data;
    },
    { ttl: CACHE_DURATIONS.MEDIUM, staleWhileRevalidate: true }
  );
};

export const getVenueInfo = async (venueSlug: string): Promise<VenueInfo> => {
  return apiCache.get(
    cacheKeys.venues.bySlug(venueSlug),
    async () => {
      const response = await apiClient.get(`/venues/events/get-venue-info/${venueSlug}`);
      return response.data;
    },
    { ttl: CACHE_DURATIONS.LONG, staleWhileRevalidate: true }
  );
};

export const getAllVenues = async (): Promise<VenueInfo[]> => {
  return apiCache.get(
    cacheKeys.venues.all(),
    async () => {
      const response = await apiClient.get<VenueInfo[]>('/venues/get-all-venues');
      return response.data;
    },
    { ttl: CACHE_DURATIONS.LONG, staleWhileRevalidate: true }
  );
};

export const getEventsByVenue = async (venueSlug: string) => {
  return apiCache.get(
    cacheKeys.venues.events(venueSlug),
    async () => {
      const response = await apiClient.get(`/venues/events/get-all-events/${venueSlug}`);
      return response.data;
    },
    { ttl: CACHE_DURATIONS.SHORT, staleWhileRevalidate: true }
  );
};
