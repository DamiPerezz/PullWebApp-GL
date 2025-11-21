// controller/purchase-pages-controller.ts - COMPLETO CORREGIDO
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

// ✅ CORREGIDO - Enviar datos en el formato correcto
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
    owner_phone_prefix: usuario.owner_phone_prefix || '+34',
    owner_gender: usuario.owner_gender,
    owner_birthdate: usuario.owner_birthdate,
  }));

  const totalAmount = ticketPrice * formData.usuarios.length;

  const requestData = {
    event_id: eventId,
    ticket_type_id: ticketTypeId,
    tickets_data: ticketsData,
    total: totalAmount,
    currency: currency,
    user_name: formData.usuarios[0].owner_name + ' ' + formData.usuarios[0].owner_last_name,
    user_email: formData.usuarios[0].owner_email,
  };

  console.log('📤 Sending order request:', requestData);

  const response = await axios.post(`${API_BASE_URL}/orders/create-pending-order`, requestData);
  return response.data;
};

// ✅ CORREGIDO - Simular pago que deja en pending_staff_approval
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