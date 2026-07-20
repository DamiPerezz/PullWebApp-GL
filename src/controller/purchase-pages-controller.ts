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

// Direct-card payment (NeoNet/Cybersource): the backend performs the two
// atomic sales (venue share + service fee) and only then issues tickets.
// paymentLinkCode is the anti-carding proof returned by create-pending-order:
// the backend refuses to touch the gateway without it.
export const payOrder = async (
  orderId: string,
  paymentLinkCode: string,
  card: { number: string; exp_month: string; exp_year: string; cvv: string },
  turnstileToken?: string
) => {
  const response = await apiClient.post(`/orders/pay`, {
    order_id: orderId,
    payment_link_code: paymentLinkCode,
    card,
    ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
  });
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
