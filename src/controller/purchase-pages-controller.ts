// purchase-pages-controller.ts - COMPLETO Y CORREGIDO
import type { TicketResponse, TicketType, UserInfoTicket } from "../types/types";
import { apiClient } from "../utils/axios";
import { loadStripe } from "@stripe/stripe-js";

// Inicializar Stripe con tu publishable key
// IMPORTANTE: Asegúrate de que VITE_STRIPE_PUBLISHABLE_KEY esté definida en tu archivo .env
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error("⚠️ VITE_STRIPE_PUBLISHABLE_KEY no está definida en las variables de entorno");
}

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export const getEventDetailedInfo = async (eventId: string): Promise<any> => {
  const response = await apiClient.get<any>(
    `/event/get-detailed-event-info/${eventId}`
  );
  return response.data;
};

export const getEventTicketsTypes = async (
  eventId: string
): Promise<TicketType[]> => {
  const response = await apiClient.get<TicketType[]>(
    `/event/get-tickets-types/${eventId}`
  );
  return response.data;
};

export const getTicketInfo = async (
  slug: string,
  ticketTypeId: string
): Promise<TicketType> => {
  const response = await apiClient.get<TicketType>(
    `/event/get-ticket-info/${slug}/${ticketTypeId}`
  );
  return response.data;
};

/**
 * Crea una orden pendiente y valida todos los datos
 */
export const createPendingOrder = async (
  ticket_type_id: string,
  slug_id: string,
  tickets: { usuarios: UserInfoTicket[] }
): Promise<{
  success: boolean;
  order_id: string;
  event_name: string;
  ticket_type_name: string;
  quantity: number;
  subtotal: number;
  service_fee: number;
  total: number;
}> => {
  try {
    const ticketsMapped = tickets.usuarios.map((t) => ({
      owner_name: t.owner_name,
      owner_last_name: t.owner_last_name,
      owner_email: t.owner_email,
      owner_phone: t.owner_phone,
      owner_phone_prefix: t.owner_phone_prefix || "+502",
      owner_gender: t.owner_gender || null,
      owner_birth_date: t.owner_birthdate
        ? new Date(t.owner_birthdate).toISOString().substring(0, 10)
        : "",
      owner_dpi: t.owner_dpi || null,
    }));

    const response = await apiClient.post(`/orders/create-pending-order`, {
      ticket_type_id,
      slug_id,
      tickets: ticketsMapped,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error creating pending order:", error);
    // Extraer el mensaje de error del backend
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to create pending order. Please try again.");
  }
};

/**
 * Crea una sesión de Stripe Checkout y redirige al usuario
 */
export const proceedToStripeCheckout = async (
  order_id: string
): Promise<void> => {
  try {
    console.log("Creating checkout session for order:", order_id);

    // 1. Crear la sesión de checkout en el backend
    const response = await apiClient.post(`/orders/create-checkout-session`, {
      order_id,
    });

    console.log("Checkout session response:", response.data);

    // Verificar la respuesta del backend
    if (!response.data) {
      throw new Error("No response from server");
    }

    // El backend devuelve { sessionId, url } - no tiene campo "success"
    if (!response.data.url) {
      throw new Error("No checkout URL received from server");
    }

    // 2. Redirigir al usuario a Stripe Checkout
    console.log("Redirecting to Stripe Checkout:", response.data.url);
    window.location.href = response.data.url;
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    
    // Si es un error de axios, extraer el mensaje del backend
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    
    // Si ya es un Error con mensaje, propagarlo
    if (error.message) {
      throw error;
    }
    
    // Error genérico como fallback
    throw new Error("Failed to create checkout session. Please try again.");
  }
};

/**
 * Verifica el pago después de que Stripe redirija de vuelta
 */
export const verifyPayment = async (
  session_id: string,
  order_id: string
): Promise<{
  success: boolean;
  message: string;
  order_id: string;
}> => {
  try {
    const response = await apiClient.get(`/orders/payment-success`, {
      params: {
        session_id,
        order_id,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to verify payment");
  }
};

/**
 * Confirma el pago de Stripe después de la redirección
 * CORREGIDO: Solo necesita session_id, el backend lo procesa todo
 */
export const confirmStripePayment = async (
  session_id: string
): Promise<{
  success: boolean;
  order_id: string;
  event_slug: string;
  order_status: string;
}> => {
  try {
    const response = await apiClient.get(`/orders/confirm-payment`, {
      params: {
        session_id,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error confirming payment:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to confirm payment");
  }
};

/**
 * Cancela una orden pendiente
 */
export const cancelOrder = async (
  order_id: string
): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await apiClient.get(`/orders/cancel-order`, {
      params: {
        order_id,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error canceling order:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to cancel order");
  }
};

/**
 * Obtiene los datos de una orden cancelada para rellenar el formulario
 */
export const getOrderDataAfterCancel = async (
  order_id: string
): Promise<{
  success: boolean;
  message: string;
  order_data: {
    tickets_data: any[];
    quantity: number;
  };
}> => {
  try {
    const response = await apiClient.get(`/orders/payment-cancel`, {
      params: {
        order_id,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error getting cancelled order data:", error);
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error("Failed to retrieve order data");
  }
};

/**
 * Método legacy - mantener por compatibilidad
 * @deprecated Use createPendingOrder + proceedToStripeCheckout instead
 */
export const postTicketPurchase = async (
  ticket_type_id: string,
  slug_id: string,
  tickets: { usuarios: UserInfoTicket[] }
): Promise<TicketResponse> => {
  const ticketsMapped = tickets.usuarios.map((t) => ({
    owner_name: t.owner_name,
    owner_last_name: t.owner_last_name,
    owner_email: t.owner_email,
    owner_phone: t.owner_phone,
    owner_phone_prefix: t.owner_phone_prefix || "+502",
    owner_gender: t.owner_gender || null,
    owner_birth_date: t.owner_birthdate
      ? new Date(t.owner_birthdate).toISOString().substring(0, 10)
      : "",
    owner_dpi: t.owner_dpi || null,
  }));

  const response = await apiClient.post<TicketResponse>(`/orders/reserve`, {
    ticket_type_id,
    slug_id,
    tickets: ticketsMapped,
  });

  return response.data;
};