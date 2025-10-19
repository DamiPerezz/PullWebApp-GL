import type { EventInfo, VenueDescription, VenueEventInfo } from "../types/types";
import { apiClient } from "../utils/axios";

export const getAllEvents = async (): Promise<EventInfo[]> => {
    const response = await apiClient.get<EventInfo[]>('/event/get-all-events');
    return response.data;
}

export const getEventsByVenue = async (slugId: string): Promise<EventInfo[]> => {
    const response = await apiClient.get<EventInfo[]>(`/venues/events/get-all-events/${slugId}`);
    return response.data;
}

export const getVenueInfo = async (slugId: string): Promise<VenueEventInfo> => {
    const response = await apiClient.get<VenueEventInfo>(`/venues/events/get-venue-info/${slugId}`);
    return response.data;
}

export const getVenueDescription = async (slugId: string): Promise<VenueDescription> => {
    const response = await apiClient.get<VenueDescription>(`/venues/events/get-venue-description/${slugId}`);
    return response.data;
}