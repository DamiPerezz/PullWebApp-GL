// controller/vip-list-controller.ts
import { apiClient } from "../utils/axios";

export interface VIPListGuest {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  phone_prefix?: string;
  birth_date?: string;
  gender: string;
  rsvp_status: 'confirmed' | 'declined' | 'removed';
  rsvp_at: string;
  amount_due: number;
  paid_at: string | null;
  ticket_id: string | null;
  added_by: 'host' | 'self';
}

// Simplified guest info for public tracking page
export interface VIPListTrackingGuest {
  id: string;
  name: string;
  last_name: string;
  email?: string;
  gender: string;
  rsvp_status: string;
  added_by: 'host' | 'self';
  created_at: string;
  // Payment fields (only present when list is closed)
  paid_at?: string | null;
  amount_due?: number;
}

export interface VIPListReservation {
  id: string;
  event_id: string;
  event_name: string;
  event_date: string;
  event_image?: string;
  venue_id: string;
  venue_name: string;
  host_name: string;
  host_last_name: string;
  host_email: string;
  reservation_name?: string;
  description?: string;
  table_or_bar: 'table' | 'bar';
  expected_men: number;
  expected_women: number;
  price_per_person: number;
  male_price?: number;
  female_price?: number;
  currency: string;
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  tracking_link_code: string;
  host_edit_code: string;
  payment_deadline?: string;
  closed_at?: string;
  created_at: string;
  guests: VIPListGuest[];
  confirmed_count: number;
  paid_count: number;
  // Nested event data from API
  events?: {
    id: string;
    name: string;
    description?: string;
    event_date: string;
    start_time?: string;
    end_time?: string;
    image?: string;
    dress_code?: string;
    min_age?: number | string;
    custom_location?: string;
    ticket_limit?: number;
    venues?: {
      id: string;
      name: string;
      location?: string;
    };
  };
}

export interface VIPListStats {
  confirmed_men: number;
  confirmed_women: number;
  confirmed_total: number;
  paid_count: number;
  price_per_person: number;
  male_price: number;
  female_price: number;
  male_price_with_fee: number;
  female_price_with_fee: number;
  fee_percentage: number;
  fee_label: string;
}

export interface VIPListTrackResponse {
  success: boolean;
  reservation: VIPListReservation;
  guests: VIPListTrackingGuest[];
  stats: VIPListStats;
}

export interface VIPListEditResponse {
  success: boolean;
  reservation: VIPListReservation;
}

export interface RSVPRequest {
  name: string;
  last_name: string;
  email: string;
  phone: string;
  phone_prefix: string;
  birth_date: string;
  gender: string;
}

export interface RSVPResponse {
  success: boolean;
  message: string;
  guest_id?: string;
}

export interface UpdateReservationRequest {
  reservation_name?: string;
  description?: string;
}

export interface AddGuestRequest {
  name: string;
  last_name: string;
  email: string;
  gender: string;
}

export interface PaymentRequest {
  card_number: string;
  card_expiry_date: string;
  card_cvv: string;
  cardholder_name: string;
  billing_address?: string;
  billing_city?: string;
  billing_country?: string;
  billing_postal_code?: string;
  device_fingerprint?: string;
  accept_terms: boolean;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  ticket_id?: string;
  ticket_code?: string;
  qr_token?: string;
  transaction_id?: string;
  amount_paid?: number;
  currency?: string;
  error_message?: string;
}

// Get VIP list by tracking code (public)
export const getVIPListByTrackingCode = async (trackingCode: string): Promise<VIPListTrackResponse> => {
  const response = await apiClient.get(`/vip-lists/track/${trackingCode}`);
  return response.data;
};

// Get VIP list by edit code (for host)
export const getVIPListByEditCode = async (editCode: string): Promise<VIPListEditResponse> => {
  const response = await apiClient.get(`/vip-lists/edit/${editCode}`);
  return response.data;
};

// RSVP to a VIP list
export const rsvpToVIPList = async (reservationId: string, data: RSVPRequest): Promise<RSVPResponse> => {
  const response = await apiClient.post(`/vip-lists/rsvp/${reservationId}`, data);
  return response.data;
};

// Update reservation (by host)
export const updateVIPListReservation = async (editCode: string, data: UpdateReservationRequest): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.put(`/vip-lists/edit/${editCode}`, data);
  return response.data;
};

// Update expected counts (men/women)
export const updateExpectedCounts = async (
  editCode: string,
  data: { expected_men?: number; expected_women?: number }
): Promise<{ success: boolean; message: string; expected_men?: number; expected_women?: number }> => {
  const response = await apiClient.put(`/vip-lists/edit/${editCode}/expected`, data);
  return response.data;
};

// Mark guest as not coming (for metrics - keeps data in DB)
export const markGuestNotComing = async (editCode: string, guestId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.put(`/vip-lists/edit/${editCode}/guests/${guestId}/not-coming`);
  return response.data;
};

// Get guest details for payment
export const getVIPListGuestForPayment = async (guestId: string): Promise<{
  success: boolean;
  guest: VIPListGuest;
  reservation: VIPListReservation;
}> => {
  const url = `/vip-lists/pay/${guestId}`;
  const response = await apiClient.get(url);
  return response.data;
};

// Process payment with card data
export const processVIPListPayment = async (guestId: string, paymentData?: PaymentRequest): Promise<PaymentResponse> => {
  const url = `/vip-lists/pay/${guestId}`;

  // Ensure paymentData is defined
  if (!paymentData) {
    throw new Error('Payment data is required');
  }

  // SECURITY: Never log payment data - PCI-DSS compliance
  const response = await apiClient.post<PaymentResponse>(url, paymentData);
  return response.data;
};

// Find guest by email for payment link
export const findGuestByEmail = async (trackingCode: string, email: string): Promise<{
  success: boolean;
  guest_id?: string;
  payment_url?: string;
  error?: string;
  already_paid?: boolean;
}> => {
  const url = `/vip-lists/track/${trackingCode}/find-guest`;
  const response = await apiClient.get(url, {
    params: { email }
  });
  return response.data;
};

// ============================================
// Bottle Selection (for host after list closes)
// ============================================

export interface VIPBottle {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  size_ml?: number;
  image_url?: string;
  stock?: number;
}

export interface VIPListBottleSelectionData {
  success: boolean;
  reservation_id: string;
  event_name: string;
  event_date: string;
  event_image?: string;
  venue_name: string;
  host_name: string;
  budget: number;
  currency: string;
  bottles: VIPBottle[];
  bottles_already_selected: boolean;
  selected_bottles?: {
    bottle_id: string;
    bottle_name: string;
    quantity: number;
    price: number;
  }[];
}

export interface BottleSelectionRequest {
  bottle_id: string;
  quantity: number;
  name: string;
  brand: string;
  price: number;
}

// Get bottle selection data by voucher token
export const getVIPListBottleSelectionData = async (token: string): Promise<VIPListBottleSelectionData> => {
  const url = `/vip-lists/bottles/${token}`;
  const response = await apiClient.get(url);
  return response.data;
};

// Save bottle selection
export const saveVIPListBottleSelection = async (
  token: string,
  bottles: BottleSelectionRequest[]
): Promise<{ success: boolean; message: string }> => {
  const url = `/vip-lists/bottles/${token}`;
  const response = await apiClient.post(url, { bottles });
  return response.data;
};

// ============================================
// Roulette Gamification Feature
// ============================================

export interface RouletteBottle {
  id: string;
  name: string;
  brand: string;
  type: string;
  price: number;
  image: string;
  description?: string;
}

export interface RouletteBottlesResponse {
  success: boolean;
  bottles: RouletteBottle[];
  currency: string;
}

// Get bottles for roulette gamification
export const getRouletteBottles = async (trackingCode: string): Promise<RouletteBottlesResponse> => {
  const url = `/vip-lists/track/${trackingCode}/roulette-bottles`;
  const response = await apiClient.get(url);
  return response.data;
};
