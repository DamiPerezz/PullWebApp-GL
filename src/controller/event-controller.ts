// controllers/event-controller.ts
// SECURITY: Using apiClient for consistent cookie-based authentication
// PERFORMANCE: Uses API caching for frequently accessed event data
import { apiClient } from '../utils/axios';
import { apiCache, cacheKeys, CACHE_DURATIONS } from '../utils/apiCache';

export const getEventDetailedInfo = async (eventSlugOrId: string) => {
  return apiCache.get(
    cacheKeys.events.detailed(eventSlugOrId),
    async () => {
      const response = await apiClient.get(`/event/get-detailed-event-info/${eventSlugOrId}`);
      return response.data;
    },
    { ttl: CACHE_DURATIONS.MEDIUM, staleWhileRevalidate: true }
  );
};

export const getTicketTypes = async (eventSlug: string) => {
  return apiCache.get(
    cacheKeys.events.tickets(eventSlug),
    async () => {
      const response = await apiClient.get(`/ticket-type/get-ticket-types/${eventSlug}`);
      return response.data;
    },
    { ttl: CACHE_DURATIONS.SHORT } // Tickets may sell out, shorter cache
  );
};

export const getEventInfo = async (eventSlugOrId: string) => {
  return apiCache.get(
    cacheKeys.events.bySlug(eventSlugOrId),
    async () => {
      const response = await apiClient.get(`/event/get-event-info/${eventSlugOrId}`);
      return response.data;
    },
    { ttl: CACHE_DURATIONS.MEDIUM, staleWhileRevalidate: true }
  );
};

export const getAllEvents = async () => {
  return apiCache.get(
    cacheKeys.events.all(),
    async () => {
      const response = await apiClient.get(`/event/get-all-events`);
      return response.data;
    },
    { ttl: CACHE_DURATIONS.SHORT, staleWhileRevalidate: true }
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
