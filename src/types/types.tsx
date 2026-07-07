// types/types.tsx - ACTUALIZACIÓN COMPLETA

// =============================================================================
// PAYMENT GATEWAY TYPES
// =============================================================================
// Supported payment gateways for venue transactions
export type PaymentGateway = 'stripe' | 'neonet';

// Payment gateway configuration structure
export interface PaymentGatewayConfig {
  // Stripe configuration
  stripe_account_id?: string;
  stripe_publishable_key?: string;
  // NeoNet configuration
  neonet_merchant_id?: string;
  neonet_terminal_id?: string;
  neonet_environment?: 'sandbox' | 'production';
}

// Constants for payment gateways
export const PAYMENT_GATEWAYS = {
  STRIPE: 'stripe' as PaymentGateway,
  NEONET: 'neonet' as PaymentGateway,
} as const;

// Payment gateway display info for UI
export const PAYMENT_GATEWAY_INFO: Record<PaymentGateway, { name: string; description: string }> = {
  stripe: {
    name: 'Stripe',
    description: 'International payment processor with card support',
  },
  neonet: {
    name: 'NeoNet',
    description: 'Local payment processor',
  },
};

// =============================================================================
// VENUE TYPES
// =============================================================================
export type VenueInfo = {
  id: string;
  slug: string;
  name: string;
  venue_name: string;
  image: string;
  location: string;
  open_time: string;
  close_time: string;
  latitude?: number | null;
  longitude?: number | null;
  // Payment gateway configuration
  payment_gateway?: PaymentGateway;
  payment_gateway_config?: PaymentGatewayConfig;
  // VIP List flow - when true, venue uses VIP lists instead of regular ticket purchase
  use_vip_list_flow?: boolean;
  whatsapp_number?: string;
};

type Requirements = {
  name: string;
  description: string;
};

export type EventInfo = {
  event_id: string;
  event_slug: string;
  event_name: string;
  venue_name: string;
  start_time: string;
  end_time: string;
  event_date: string;
  custom_location: VenueInfo;
  event_img: string;
  requirements: Requirements[];
  min_price?: number;
  currency: string;
  dress_code?: string;
};

export type VenueEventInfo = {
  name: string;
  email: string;
  image: string;
  open_time: string;
  close_time: string;
  long_location: string;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
};

export type VenueDescription = {
  description: string;
};

export type EventDetailedInfo = {
  event_name: string;
  event_img: string;
  event_slug?: string;
  date: string;
  open_time: string;
  close_time: string;
  location: string;
  requirements: Requirements[];
  custom_location?: VenueInfo;
  currency: string;
  min_age?: number | string;
  dress_code?: string;
  description?: string;
};

export type TicketType = {
  ticket_type_id: string;
  slug: string;
  ticket_name: string;
  ticket_price: number;
  ticket_description: string;
  ticket_quantity: number;
  currency: string;
  is_group?: boolean;
  min_quantity?: number;
  max_quantity?: number;
  has_gender_pricing?: boolean;
  male_price?: number;
  female_price?: number;
  base_price?: number;
};

// Bottle types for group reservations
export type Bottle = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  description?: string;
  type?: string;
  brand?: string;
};

export type Mixer = {
  id: string;
  name: string;
  price: number;
  currency: string;
  image?: string;
  is_available?: boolean;
};

// Type aliases for backwards compatibility
export type VIPBottle = Bottle;
export type VIPMixer = Mixer;

export type UserInfoTicket = {
  owner_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_phone: string;
  owner_phone_prefix?: string;
  owner_gender?: string;
  owner_birthdate: string;
};

export type TicketResponse = {
  message: string;
  order_id: string;
};

export type PurchasedTicketInfo = {
  id: string;
  owner_full_name: string;
  owner_email: string;
  event_name: string;
  event_date: string;
  start_time: string;
  location?: string;
  qr_token: string;
  ticket_type?: string;
  benefits?: string;
  validated_at?: string;
  pdf_url?: string;
  public_users?: {
    name: string;
    surname: string;
    email: string;
  };
  ticket_types?: {
    name: string;
    benefits?: string;
  };
  orders?: {
    id: string;
    created_at: string;
  };
  events?: {
    name: string;
    event_date: string;
    start_time: string;
    image: string;
    venues?: {
      name: string;
      location: string;
    };
  };
};

export type UsuarioFormData = {
  owner_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_phone: string;
  owner_phone_prefix?: string;
  owner_gender?: string;
  owner_birthdate: string;
  confirmationMail?: string;
  start_time?: string;
  end_time?: string;
  total_assistant?: number;
  payment_type?: string;
  assistants?: string[];
};

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  surname: string;
  phone?: string;
  phone_prefix?: string;
  tier: 'regular' | 'vip';
  profile_image?: string;
  tags: string[];
  total_spent: number;
  average_spend: number;
  last_visit?: string;
  member_since?: string;
  stats?: {
    total_tickets: number;
    validated_tickets: number;
    total_orders: number;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone?: string;
  phone_prefix?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface UserProfileResponse {
  success: boolean;
  user: User;
}

export type ReservationData = {
  venue_id: string;
  event_id?: string;
  guest_count: number;
  booking_date: string;
  table_preferences?: Record<string, any>;
  special_requests?: string;
  user_data: {
    name: string;
    surname: string;
    email: string;
    phone?: string;
    phone_prefix?: string;
    birth_date?: string;
    gender?: string;
  };
};

export const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
] as const;

export const PHONE_PREFIX_OPTIONS = [
  { value: "+502", label: "+502 (Guatemala)", flag: "🇬🇹" },
  { value: "+34", label: "+34 (España)", flag: "🇪🇸" },
  { value: "+1", label: "+1 (USA/Canadá)", flag: "🇺🇸" },
  { value: "+52", label: "+52 (México)", flag: "🇲🇽" },
  { value: "+33", label: "+33 (France)", flag: "🇫🇷" },
  { value: "+44", label: "+44 (UK)", flag: "🇬🇧" },
  { value: "+49", label: "+49 (Germany)", flag: "🇩🇪" },
  { value: "+39", label: "+39 (Italy)", flag: "🇮🇹" },
  { value: "+351", label: "+351 (Portugal)", flag: "🇵🇹" },
] as const;

export const VIP_DEADLINE_MINUTES = 30;

export type ZoneType = 'vip-premium' | 'vip' | 'standard';

export type ZoneColorConfig = {
  border: string;
  background: string;
  text: string;
  label: string;
};

export const ZONE_COLORS: Record<ZoneType, ZoneColorConfig> = {
  'vip-premium': {
    border: 'rgb(236, 72, 153)',
    background: 'rgba(236, 72, 153, 0.2)',
    text: 'rgb(251, 113, 133)',
    label: 'VIP Premium',
  },
  'vip': {
    border: 'rgb(139, 92, 246)',
    background: 'rgba(139, 92, 246, 0.2)',
    text: 'rgb(196, 181, 253)',
    label: 'VIP',
  },
  'standard': {
    border: 'rgb(59, 130, 246)',
    background: 'rgba(59, 130, 246, 0.2)',
    text: 'rgb(147, 197, 253)',
    label: 'Standard',
  },
};

export const TIER_COLORS = {
  regular: {
    background: 'rgba(16, 185, 129, 0.2)',
    border: 'rgba(16, 185, 129, 0.3)',
    text: 'rgb(52, 211, 153)',
  },
  vip: {
    background: 'rgba(245, 158, 11, 0.2)',
    border: 'rgba(245, 158, 11, 0.3)',
    text: 'rgb(251, 191, 36)',
  },
};

export interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone?: string;
  phone_prefix?: string;
  tier: 'regular' | 'vip';
  profile_image?: string;
  birth_date?: string;
  gender?: string;
  total_spent: number;
  average_spend: number;
  tags: string[];
  stats?: UserStats;
}

export interface UserStats {
  total_tickets: number;
  validated_tickets: number;
  total_orders: number;
}

export interface LoginRequest {
  email: string;
  code: string;
}

export interface LoginWithTokenRequest {
  access_token: string;
}

export interface RequestCodeRequest {
  email: string;
}

export interface UpdateProfileRequest {
  name?: string;
  surname?: string;
  phone?: string;
  phone_prefix?: string;
  birth_date?: string;
  gender?: string;
  profile_image?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

// VIP Table types
export interface VIPTable {
  id: string;
  name: string;
  capacity: number;
  min_spend: number;
  zone: string;
  zone_type: ZoneType;
  position?: { x: number; y: number };
  is_available?: boolean;
}

// Booking management types
export interface AuthenticationResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ReservationDetailsResponse {
  success: boolean;
  booking: ReservationDetails;
  error?: string;
}

export interface PaymentSummary {
  totalPaid: number;
  totalAmount: number;
  totalPending: number;
  pendingPayments: number;
  totalGuests: number;
  paymentProgress: number;
  currency: string;
}

export interface ReservationDetails {
  id: string;
  reservation_number: string;
  status: string;
  type?: string;
  event_name: string;
  event_date: string;
  startDate?: string;
  endDate?: string;
  guest_count: number;
  total_amount: number;
  currency: string;
  guests: Guest[];
  assistants?: Assistant[];
  paymentSummary?: PaymentSummary;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender?: string;
  status: string;
}

export interface Assistant {
  id: string;
  name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  paidAt?: string | null;
  status?: string;
  isRegisteredUser?: boolean;
  isCreator?: boolean;
}

export interface GuestChange {
  guest_id?: string;
  guestId?: string;
  guestName?: string;
  action: 'add' | 'remove' | 'update' | 'delete';
  data?: Partial<Guest>;
}

export interface ModifyGuestsResponse {
  success: boolean;
  message?: string;
  updated_guests?: Guest[];
  error?: string;
}

// Group reservation types
export interface CreateGroupReservationResponse {
  success: boolean;
  reservation_id: string;
  payment_link_code: string;
  total_amount: number;
  currency: string;
  error?: string;
}

// =============================================================================
// GUEST LIST TYPES (Listas Gratis)
// =============================================================================

// Guest list type configuration for an event
export interface GuestListType {
  id: string;
  event_id: string;
  venue_id: string;
  name: string;
  description?: string;
  max_capacity?: number;
  current_count: number;
  is_active: boolean;
  allowed_gender?: 'male' | 'female' | null; // null = todos permitidos
}

// Request to sign up for a guest list
export interface GuestListSignupRequest {
  event_slug: string;
  guest_list_type_id: string;
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  phone_prefix?: string;
  gender: 'male' | 'female';
  guest_count: number; // Número de acompañantes
}

// Response after successful signup
export interface GuestListSignupResponse {
  success: boolean;
  signup_id: string;
  verification_code: string;
  message: string;
}

// Guest list signup status
export type GuestListSignupStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Full signup info for status check
export interface GuestListSignup {
  id: string;
  guest_list_type_id: string;
  guest_list_name: string;
  event_id: string;
  event_name: string;
  event_date: string;
  event_slug: string;
  venue_name: string;
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  gender: string;
  guest_count: number;
  status: GuestListSignupStatus;
  verification_code: string;
  created_at: string;
  processed_at?: string;
  reject_reason?: string;
  ticket_id?: string;
}

// Color scheme for guest list UI
export const GUEST_LIST_COLORS = {
  primary: 'rgb(20, 184, 166)',        // Teal
  primaryLight: 'rgb(94, 234, 212)',   // Light teal
  background: 'rgba(20, 184, 166, 0.15)',
  border: 'rgba(20, 184, 166, 0.4)',
  borderHover: 'rgba(20, 184, 166, 0.6)',
} as const;