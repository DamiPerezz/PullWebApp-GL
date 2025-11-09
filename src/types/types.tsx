// types.tsx - Tipos completos corregidos

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
  owner_phone_prefix?: string;
  owner_gender?: string;
  owner_birthdate: string;
  owner_dpi?: string;
};

export type TicketResponse = {
  message: string;
  order_id: string;
};

// ✅ Tipo COMPLETO para información de tickets comprados
export type PurchasedTicketInfo = {
  // Información del titular
  owner_full_name: string;
  owner_email: string;
  
  // Información del evento
  event_name: string;
  event_date: string;
  start_time: string;
  location?: string;
  
  // Información del ticket
  qr_token: string;
  ticket_type?: string;
  benefits?: string;
  
  // Puede venir de la estructura de supabase
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
    id: number;
    created_at: string;
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

// ============================================================
// TIPOS PARA SISTEMA DE GENERACIÓN DE PDFs
// ============================================================

export interface TicketPurchaseResponse {
  tickets: PurchasedTicketInfo[];
}

export interface QrCardProps {
  info: PurchasedTicketInfo;
  onDownload?: () => void;
}

export interface PostPaymentParams {
  orderId: string;
  eventId: string;
}

export interface PDFTicketData {
  qr_token: string;
  owner_full_name: string;
  owner_email: string;
  event_name: string;
  event_date: string;
  start_time: string;
  location: string;
  benefits?: string;
  event_img?: string;
}

export interface QRCodeOptions {
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  scale: number;
  width?: number;
}

export interface Html2CanvasOptions {
  scale: number;
  useCORS: boolean;
  backgroundColor: string;
  allowTaint: boolean;
  logging?: boolean;
  width?: number;
  height?: number;
}

export interface JsPDFOptions {
  orientation: 'p' | 'portrait' | 'l' | 'landscape';
  unit: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
  format: string | [number, number];
  compress?: boolean;
}

// ============================================================
// CONSTANTES
// ============================================================

export const GENDER_OPTIONS = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
  { value: "prefer_not_to_say", label: "Prefiero no decir" },
] as const;

export const PHONE_PREFIX_OPTIONS = [
  { value: "+502", label: "+502 (Guatemala)", flag: "🇬🇹" },
  { value: "+1", label: "+1 (USA/Canadá)", flag: "🇺🇸" },
  { value: "+52", label: "+52 (México)", flag: "🇲🇽" },
  { value: "+503", label: "+503 (El Salvador)", flag: "🇸🇻" },
  { value: "+504", label: "+504 (Honduras)", flag: "🇭🇳" },
  { value: "+505", label: "+505 (Nicaragua)", flag: "🇳🇮" },
  { value: "+506", label: "+506 (Costa Rica)", flag: "🇨🇷" },
  { value: "+507", label: "+507 (Panamá)", flag: "🇵🇦" },
] as const;

// ============================================================
// DECLARACIONES DE MÓDULOS PARA LIBRERÍAS SIN TIPOS
// ============================================================

declare module 'qrcode' {
  export function toDataURL(
    text: string,
    options?: Partial<QRCodeOptions>
  ): Promise<string>;
  
  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: Partial<QRCodeOptions>
  ): Promise<void>;
  
  export function toString(
    text: string,
    options?: Partial<QRCodeOptions>
  ): Promise<string>;
}

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number;
    useCORS?: boolean;
    backgroundColor?: string;
    allowTaint?: boolean;
    logging?: boolean;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
  }
  
  function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>;
  
  export = html2canvas;
}

declare module 'jspdf' {
  export interface jsPDFOptions {
    orientation?: 'p' | 'portrait' | 'l' | 'landscape';
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
    format?: string | [number, number];
    compress?: boolean;
    precision?: number;
    userUnit?: number;
  }

  export default class jsPDF {
    constructor(options?: jsPDFOptions);
    
    addImage(
      imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number,
      alias?: string,
      compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW',
      rotation?: number
    ): jsPDF;
    
    save(filename: string): void;
    
    output(type: 'blob'): Blob;
    output(type: 'bloburi'): string;
    output(type: 'datauristring'): string;
    output(type: 'datauri'): void;
    output(type?: string): any;
    
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: {
        align?: 'left' | 'center' | 'right' | 'justify';
        baseline?: 'alphabetic' | 'ideographic' | 'bottom' | 'top' | 'middle' | 'hanging';
        angle?: number;
        maxWidth?: number;
      }
    ): jsPDF;
    
    setFontSize(size: number): jsPDF;
    setFont(fontName: string, fontStyle?: string): jsPDF;
    setTextColor(r: number, g?: number, b?: number): jsPDF;
    setTextColor(color: string): jsPDF;
    
    addPage(format?: string | [number, number], orientation?: 'p' | 'l'): jsPDF;
    
    internal: {
      pageSize: {
        width: number;
        height: number;
        getWidth(): number;
        getHeight(): number;
      };
    };
  }
}

// ============================================================
// EXTENSIONES DE TIPOS GLOBALES
// ============================================================

declare global {
  interface Navigator {
    share?: (data: ShareData) => Promise<void>;
  }
  
  interface ShareData {
    title?: string;
    text?: string;
    url?: string;
  }
}