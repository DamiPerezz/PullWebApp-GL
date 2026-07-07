// controllers/guest-list-controller.ts
import type {
  GuestListType,
  GuestListSignupRequest,
  GuestListSignupResponse,
  GuestListSignup
} from "../types/types";
import { apiClient } from "../utils/axios";

/**
 * Get available guest lists for an event
 */
export const getGuestListsForEvent = async (eventSlug: string): Promise<GuestListType[]> => {
  const response = await apiClient.get(`/guest-lists/event/${eventSlug}`);
  return response.data;
};

/**
 * Sign up for a guest list
 */
export const signupForGuestList = async (
  data: GuestListSignupRequest
): Promise<GuestListSignupResponse> => {
  const response = await apiClient.post('/guest-lists/signup', data);
  return response.data;
};

/**
 * Get signup status by verification code
 */
export const getSignupStatus = async (verificationCode: string): Promise<GuestListSignup> => {
  const response = await apiClient.get(`/guest-lists/status/${verificationCode}`);
  return response.data;
};

/**
 * Cancel a pending signup
 */
export const cancelSignup = async (verificationCode: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post(`/guest-lists/cancel/${verificationCode}`);
  return response.data;
};
