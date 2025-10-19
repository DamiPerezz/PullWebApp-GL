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
};

export type VenueEventInfo = {
  name: string;
  capacity: number;
  email: string;
  image: string;
  open_time: string;
  close_time: string;
  long_location: string;
  latitude: number;
  longitude: number;
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
};

export type TicketType = {
  ticket_type_id: string;
  slug: string;
  ticket_name: string;
  ticket_price: number;
  ticket_description: string;
  ticket_quantity: number;
};

export type UserInfoTicket = {
  owner_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_phone: string;
  owner_dpi: string;
  owner_birthdate: string;
};

export type TicketResponse = {
  message: string;
  order_id: string;
};

export type PurchasedTicketInfo = {
  owner_full_name: string;
  owner_email: string;
  event_name: string;
  event_date: string;
  qr_token: string;
  benefits: string;
  start_time: string;
};

export type UsuarioFormData = {
  owner_name: string;
  owner_last_name: string;
  owner_dpi: string;
  owner_phone: string;
  owner_email: string;
  confirmationMail: string;
  owner_birthdate: string;
  start_time?: string;
  end_time?: string;
  total_assistant?: number;
  payment_type?: string;
  assistants?: string[];
};

export type ReservationData = {
  user: {
    name: string;
    surname: string;
    email: string;
    dpi: string;
  };
  booking: {
    venueId: string;
    date: string;
    startTime?: string;
    endTime?: string;
    guests?: number;
    table: boolean;
    paymentTerm: number;
  };
  guestNames?: string[];
};

export interface ReservationDetails {
  id: string;
  venueId: string;
  venueName: string;
  venueAddress: string;
  customerName: string;
  email: string;
  guests: number;
  totalAmount: number;
  status: string;
  type: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  assistants: Assistant[];
  paymentSummary: PaymentSummary;
}

export interface Assistant {
  id: string;
  name: string;
  email?: string;
  paidAt: string | null;
  status: string;
  isRegisteredUser: boolean;
  isCreator: boolean;
}

export interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalAmount: number;
  paymentProgress: number;
}

export interface ReservationDetailsResponse {
  success: boolean;
  booking: ReservationDetails;
}

export interface AuthenticationResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    name: string;
    email: string;
  };
}

export interface AuthenticationError {
  error: string;
}

export interface GuestChange {
  action: "add" | "delete" | "restore";
  guestId?: string;
  guestName?: string;
}

export interface ModifyGuestsResponse {
  success: boolean;
  message: string;
  data: {
    reservationStatus: string;
    changes: string[];
    note: string;
  };
}
