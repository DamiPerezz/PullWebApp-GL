// controllers/event-controller.ts
// SECURITY: Using apiClient for consistent cookie-based authentication
import { apiClient } from '../utils/axios';

export const getEventDetailedInfo = async (eventSlugOrId: string) => {
  const response = await apiClient.get(`/event/get-detailed-event-info/${eventSlugOrId}`);
  return response.data;
};

export const getTicketTypes = async (eventSlug: string) => {
  const response = await apiClient.get(`/ticket-type/get-ticket-types/${eventSlug}`);
  return response.data;
};

export const getEventInfo = async (eventSlugOrId: string) => {
  const response = await apiClient.get(`/event/get-event-info/${eventSlugOrId}`);
  return response.data;
};

export const getAllEvents = async () => {
  const response = await apiClient.get(`/event/get-all-events`);
  return response.data;
};

export const getEventsByVenue = async (venueSlug: string) => {
  const response = await apiClient.get(`/venues/events/get-all-events/${venueSlug}`);
  return response.data;
};
