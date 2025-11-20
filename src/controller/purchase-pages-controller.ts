// controller/purchase-pages-controller.ts - CORREGIDO
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const getTicketInfo = async (eventSlug: string, ticketTypeId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/ticket-type/get-ticket-info/${eventSlug}/${ticketTypeId}`
  );
  return response.data;
};

export const getEventDetailedInfo = async (eventSlug: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/event/get-detailed-event-info/${eventSlug}`
  );
  return response.data;
};

export const createPendingOrder = async (
  ticketTypeId: string,
  slugId: string,
  formData: any
) => {
  const response = await axios.post(`${API_BASE_URL}/orders/create-pending-order`, {
    ticket_type_id: ticketTypeId,
    slug_id: slugId,
    usuarios: formData.usuarios,
  });
  return response.data;
};

export const simulateStripePayment = async (orderId: string) => {
  const response = await axios.post(`${API_BASE_URL}/orders/simulate-payment`, {
    order_id: orderId,
  });
  return response.data;
};

export const createCheckoutSession = async (orderId: string) => {
  const response = await axios.post(`${API_BASE_URL}/orders/create-checkout-session`, {
    order_id: orderId,
  });
  return response.data;
};

export const confirmPayment = async (sessionId: string) => {
  const response = await axios.get(`${API_BASE_URL}/orders/confirm-payment`, {
    params: {
      session_id: sessionId,
    },
  });
  return response.data;
};

export const cancelOrder = async (orderId: string) => {
  const response = await axios.get(`${API_BASE_URL}/orders/cancel-order`, {
    params: {
      order_id: orderId,
    },
  });
  return response.data;
};

export const getOrderDataAfterCancel = async (orderId: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/orders/cancelled/${orderId}`
  );
  return response.data;
};

export const getOrderByPaymentLink = async (paymentLinkCode: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/orders/by-payment-link/${paymentLinkCode}`
  );
  return response.data;
};

export const getTicketsByOrderId = async (orderId: string, eventSlug: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/orders/${orderId}/${eventSlug}`
  );
  return response.data;
};

export const validateTicketPurchase = async (
  eventSlug: string,
  ticketTypeId: string,
  quantity: number
) => {
  const response = await axios.post(`${API_BASE_URL}/stripe/validate-purchase`, {
    event_slug: eventSlug,
    ticket_type_id: ticketTypeId,
    quantity: quantity,
  });
  return response.data;
};