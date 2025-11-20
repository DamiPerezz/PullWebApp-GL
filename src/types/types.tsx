// types/types.tsx - ACTUALIZACIÓN COMPLETA
export type VenueInfo = {
  id: string;
  slug: string;
  name: string;
  venue_name: string;
  image: string;
  location: string;
  open_time: string;
  close_time: string;
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
  custome_location: VenueInfo;
  event_img: string;
  requirements: Requirements[];
  vip_enabled: boolean;
  min_price?: number;
  currency: string;
};

export type VenueEventInfo = {
  name: string;
  email: string;
  image: string;
  open_time: string;
  close_time: string;
  long_location: string;
  latitude: number;
  longitude: number;
  description: string;
};

export type VenueDescription = {
  description: string;
};

export type EventDetailedInfo = {
  event_name: string;
  event_img: string;
  date: string;
  open_time: string;
  close_time: string;
  location: string;
  requirements: Requirements[];
  vip_enabled: boolean;
  custome_location?: VenueInfo;
  currency: string;
};

export type TicketType = {
  ticket_type_id: string;
  slug: string;
  ticket_name: string;
  ticket_price: number;
  ticket_description: string;
  ticket_quantity: number;
  currency: string;
};

export type UserInfoTicket = {
  owner_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_phone: string;
  owner_phone_prefix?: string;
  owner_gender?: string;
  owner_birthdate: string;
  owner_dpi?: string;
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
  owner_dpi?: string;
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

export interface VIPTable {
  id: string;
  venue_id: string;
  table_number: string;
  zone: string;
  zone_type: 'vip-premium' | 'vip' | 'standard';
  capacity: number;
  min_spend: number;
  is_active: boolean;
  is_available?: boolean;
  created_at: string;
}

export type VIPBottle = {
  id: string;
  venue_id: string;
  name: string;
  brand?: string;
  type?: string;
  price: number;
  is_available: boolean;
  image?: string;
  description?: string;
  created_at: string;
  generic_bottle_id?: string;
};

export type GenericBottle = {
  id: string;
  name: string;
  brand?: string;
  type?: string;
  image?: string;
  description?: string;
  typical_price: number;
  is_active: boolean;
  created_at: string;
};

export type VIPMixer = {
  id: string;
  venue_id: string;
  name: string;
  is_available: boolean;
  created_at: string;
};

export type VIPPerk = {
  id: string;
  venue_id: string;
  threshold: number;
  perk_description: string;
  is_active: boolean;
  created_at: string;
};

export type VIPReservationStatus = 'pending_staff_approval' | 'approved' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
export type VIPGuestStatus = 'pending' | 'paid' | 'cancelled';

export type VIPGuest = {
  id: string;
  reservation_id: string;
  user_id?: string;
  name: string;
  last_name: string;
  email: string;
  gender?: string;
  status: VIPGuestStatus;
  amount_due: number;
  paid_at?: string;
  is_organizer: boolean;
  stripe_payment_intent?: string;
  created_at: string;
  updated_at: string;
};

export type VIPReservation = {
  id: string;
  event_id: string;
  table_id: string;
  organizer_id: string;
  bottle_id: string;
  status: VIPReservationStatus;
  guest_count: number;
  total_amount: number;
  host_amount: number;
  paid_amount: number;
  management_code: string;
  payment_link_code: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  cancelled_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
};

export type VIPReservationDetails = {
  reservation_id: string;
  management_code: string;
  payment_link_code: string;
  guest_count: number;
  total_amount: number;
  host_amount: number;
  paid_amount: number;
  created_at: string;
  approved_at?: string;
  status: VIPReservationStatus;
  event_name: string;
  event_image: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_location: string;
  table_number: string;
  table_zone: string;
  table_capacity: number;
  min_spend: number;
  bottle_name: string;
  bottle_brand: string;
  bottle_price: number;
  organizer_name: string;
  organizer_surname: string;
  organizer_email: string;
  paid_guests_count: number;
  total_paid: number;
  payment_progress: number;
  guests: VIPGuest[];
  perks_achieved: VIPPerk[];
  available_perks: VIPPerk[];
};

export type CreateVIPReservationRequest = {
  event_slug: string;
  table_id: string;
  bottle_id: string;
  organizer_data: {
    name: string;
    last_name: string;
    email: string;
    phone: string;
    phone_prefix?: string;
    gender?: string;
    birth_date?: string;
  };
  guest_count: number;
  guests: Array<{
    name: string;
    last_name: string;
    email: string;
    gender?: string;
    host_pays: boolean;
  }>;
  special_requests?: string;
};

export type CreateVIPReservationResponse = {
  success: boolean;
  reservation_id: string;
  management_code: string;
  payment_link_code: string;
  message: string;
};

export type VIPGuestPaymentRequest = {
  payment_link_code: string;
  guest_email: string;
};

export type VIPManagementAction = {
  management_code: string;
  action: 'add_guest' | 'remove_guest' | 'cancel_reservation';
  guest_data?: {
    name: string;
    last_name: string;
    email: string;
    gender?: string;
  };
  guest_id?: string;
};

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
  { value: "other", label: "Otro" },
  { value: "prefer_not_to_say", label: "Prefiero no decir" },
] as const;

export const PHONE_PREFIX_OPTIONS = [
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