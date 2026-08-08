// controller/purchase-pages-controller.ts
// SECURITY: Using apiClient for consistent cookie-based authentication and error handling
import { apiClient } from '../utils/axios';
import { SERVICE_FEE_MULTIPLIER } from '../config/fees';

export const getTicketInfo = async (eventSlug: string, ticketTypeId: string) => {
  const response = await apiClient.get(
    `/ticket-type/get-ticket-info/${eventSlug}/${ticketTypeId}`
  );
  return response.data;
};

export const getEventDetailedInfo = async (eventSlug: string) => {
  const response = await apiClient.get(
    `/event/get-detailed-event-info/${eventSlug}`
  );
  return response.data;
};

export const createPendingOrder = async (
  eventId: string,
  ticketTypeId: string,
  ticketTypeName: string,
  ticketPrice: number,
  currency: string,
  formData: any
) => {
  // Estructurar tickets_data como array de objetos
  const ticketsData = formData.usuarios.map((usuario: any) => ({
    ticket_type_id: ticketTypeId,
    ticket_type_name: ticketTypeName,
    quantity: 1,
    price: ticketPrice,
    owner_name: usuario.owner_name,
    owner_last_name: usuario.owner_last_name,
    owner_email: usuario.owner_email,
    owner_phone: usuario.owner_phone,
    owner_phone_prefix: usuario.owner_phone_prefix || '+502',
    owner_gender: usuario.owner_gender,
    owner_birthdate: usuario.owner_birthdate,
    owner_instagram: usuario.owner_instagram,
  }));

  // Total with the per-venue service fee (see config/fees.ts)
  const subtotal = ticketPrice * formData.usuarios.length;
  const totalAmount = subtotal * SERVICE_FEE_MULTIPLIER;

  return createOrderRequest(eventId, ticketTypeId, ticketsData, totalAmount, currency, formData);
};

const createOrderRequest = async (
  eventId: string,
  ticketTypeId: string,
  ticketsData: any[],
  totalAmount: number,
  currency: string,
  formData: any
) => {

  const requestData = {
    event_id: eventId,
    ticket_type_id: ticketTypeId,
    tickets_data: ticketsData,
    total: totalAmount,
    currency: currency,
    user_name: formData.usuarios[0].owner_name + ' ' + formData.usuarios[0].owner_last_name,
    user_email: formData.usuarios[0].owner_email,
  };

  const response = await apiClient.post(`/orders/create-pending-order`, requestData);
  return response.data;
};

export const simulateStripePayment = async (orderId: string) => {
  const response = await apiClient.post(`/orders/simulate-payment`, {
    order_id: orderId,
  });
  return response.data;
};

// ============================================================================
// dLocal Go — CHECKOUT ALOJADO
//
// dLocal Go NO acepta la tarjeta cruda: el backend crea el pago
// (POST /v1/payments) y devuelve una `redirect_url` a la página de dLocal.
// El comprador paga ALLÍ y vuelve a nuestro `success_url`. El pago nace
// PENDING y se confirma por WEBHOOK, así que al volver la orden puede seguir
// en `pending`/`processing` unos segundos — la web no debe cantar victoria.
//
// `payment_link_code` sigue siendo obligatorio (anti-carding): es la prueba
// de que quien paga es quien creó la orden (flujo público) o quien recibió el
// enlace de aprobación por correo (flujo privado).
// ============================================================================

// Ruta canónica. Si el backend acaba exponiendo otro nombre, se cambia AQUÍ
// (una línea). Las alternativas solo se prueban ante un 404/405 —
// "ruta inexistente" garantiza que el backend no hizo nada, así que reintentar
// no puede duplicar un cobro.
// VERIFICADO en producción: el checkout alojado de dLocal vive en
// /orders/checkout (controllers.CreateCheckout) y devuelve checkout_url.
// OJO: /orders/pay es el endpoint ANTIGUO de tarjeta cruda — llamarlo aquí
// devolvía "Datos de tarjeta incompletos" (400), y como no es 404/405 los
// fallbacks ni se probaban.
export const CHECKOUT_ENDPOINT = '/orders/checkout';
const CHECKOUT_ENDPOINT_FALLBACKS = [
  '/orders/create-checkout-session',
];

export type CheckoutStart = {
  redirectUrl: string;
  paymentId?: string;
  status?: string;
};

export type CheckoutUrls = {
  successUrl: string;
  backUrl: string;
};

export const startOrderCheckout = async (
  orderId: string,
  paymentLinkCode: string,
  urls: CheckoutUrls
): Promise<CheckoutStart> => {
  const body = {
    order_id: orderId,
    payment_link_code: paymentLinkCode,
    success_url: urls.successUrl,
    back_url: urls.backUrl,
    // Alias históricos: los handlers de checkout del backend usan
    // return_url/cancel_url. Mandar ambos evita un round-trip de integración.
    return_url: urls.successUrl,
    cancel_url: urls.backUrl,
  };

  let routeMissing: unknown = null;

  for (const path of [CHECKOUT_ENDPOINT, ...CHECKOUT_ENDPOINT_FALLBACKS]) {
    try {
      const response = await apiClient.post(path, body);
      const data = response.data || {};
      const redirectUrl: string | undefined =
        data.redirect_url || data.checkout_url || data.payment_url;

      if (!redirectUrl) {
        throw new Error(data.error || 'MISSING_REDIRECT_URL');
      }

      return {
        redirectUrl,
        paymentId: data.payment_id || data.dlocal_payment_id || data.session_id,
        status: data.status,
      };
    } catch (error: any) {
      const httpStatus = error?.response?.status;
      // 404/405 = esa ruta no existe en este backend → probar la siguiente.
      // Cualquier otro error (402 declinado, 403 código inválido, 409 ya
      // pagada, 429 rate limit) es una respuesta REAL: se propaga tal cual.
      if (httpStatus === 404 || httpStatus === 405) {
        routeMissing = error;
        continue;
      }
      throw error;
    }
  }

  throw routeMissing || new Error('CHECKOUT_UNAVAILABLE');
};

// Estado de una orden. Lo usan la página de pago (para retomar una orden del
// enlace de aprobación) y la de éxito (para saber si el webhook ya confirmó).
// Shape del backend: { order: {...fila...}, user, event, venue_id }
export const getOrderDetails = async (orderId: string) => {
  const response = await apiClient.get(`/orders/details/${orderId}`);
  return response.data;
};

export const createCheckoutSession = async (orderId: string) => {
  const response = await apiClient.post(`/orders/create-checkout-session`, {
    order_id: orderId,
  });
  return response.data;
};

export const confirmPayment = async (sessionId: string) => {
  const response = await apiClient.get(`/orders/confirm-payment`, {
    params: {
      session_id: sessionId,
    },
  });
  return response.data;
};

export const cancelOrder = async (orderId: string) => {
  const response = await apiClient.get(`/orders/cancel-order`, {
    params: {
      order_id: orderId,
    },
  });
  return response.data;
};

export const getOrderDataAfterCancel = async (orderId: string) => {
  const response = await apiClient.get(
    `/orders/cancelled/${orderId}`
  );
  return response.data;
};

export const getOrderByPaymentLink = async (paymentLinkCode: string) => {
  const response = await apiClient.get(
    `/orders/by-payment-link/${paymentLinkCode}`
  );
  return response.data;
};

export const getTicketsByOrderId = async (orderId: string, eventSlug: string) => {
  const response = await apiClient.get(
    `/orders/${orderId}/${eventSlug}`
  );
  return response.data;
};

export const validateTicketPurchase = async (
  eventSlug: string,
  ticketTypeId: string,
  quantity: number
) => {
  const response = await apiClient.post(`/stripe/validate-purchase`, {
    event_slug: eventSlug,
    ticket_type_id: ticketTypeId,
    quantity: quantity,
  });
  return response.data;
};
