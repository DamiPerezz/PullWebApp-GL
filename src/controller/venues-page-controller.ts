import type { VenueInfo } from "../types/types";
import { apiClient } from "../utils/axios";

export const getAllVenues = async (): Promise<VenueInfo[]> => {
    const response = await apiClient.get<VenueInfo[]>('/venues/get-all-venues');

    return response.data;
}