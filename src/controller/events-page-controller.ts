// controllers/events-page-controller.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const getAllEvents = async () => {
  const response = await axios.get(`${API_URL}/event/get-all-events`);
  return response.data;
};

export const getEventsByVenue = async (venueSlug: string) => {
  const response = await axios.get(`${API_URL}/venues/events/get-all-events/${venueSlug}`);
  return response.data;
};

export const getVenueInfo = async (venueSlug: string) => {
  const response = await axios.get(`${API_URL}/venues/events/get-venue-info/${venueSlug}`);
  return response.data;
};

export const getEventDetailedInfo = async (eventSlugOrId: string) => {
  const response = await axios.get(`${API_URL}/event/get-detailed-event-info/${eventSlugOrId}`);
  return response.data;
};

export const getEventInfo = async (eventSlugOrId: string) => {
  const response = await axios.get(`${API_URL}/event/get-event-info/${eventSlugOrId}`);
  return response.data;
};

export const getTicketTypes = async (eventSlug: string) => {
  const response = await axios.get(`${API_URL}/ticket-type/get-ticket-types/${eventSlug}`);
  return response.data;
};