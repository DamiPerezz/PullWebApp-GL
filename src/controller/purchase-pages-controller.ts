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
// NeoNet / Cybersource — TARJETA EN NUESTRA PÁGINA (flujo vigente 18-ago-2026)
//
// El comprador teclea la tarjeta en nuestro formulario y el backend cobra
// contra la pasarela en la MISMA petición: cuando esto responde, el resultado
// ya es definitivo (no hay webhook de por medio, al revés que con dLocal).
//
// PÚBLICO   captura inmediata → la orden queda `confirmed` y salen las
//           entradas por correo.
// PRIVADO   NO se captura: se AUTORIZA y el dinero queda RETENIDO en la
//           tarjeta → la orden queda `payment_authorized`. El staff decide:
//           aprobar (captura y emite entradas), rechazar (reversa) o dejar
//           pasar 48 h (el job de caducidad reversa solo). NO hay enlace de
//           pago posterior: la tarjeta se pide UNA vez, al solicitar.
//
// UN SOLO COBRO POR COMPRA (decisión del 18-ago-2026): el comprador sigue
// pagando el 8% de recargo, pero como un único apunte. Desde la web se manda
// UN total (el que ya calcula `config/fees.ts` al crear la orden) y UNA
// llamada; cómo se reparte ese dinero entre venue y plataforma es cosa del
// backend. TRAMPA: si el backend vuelve a partirlo en dos cargos a la misma
// tarjeta, el comprador ve dos apuntes en su extracto y llama al local — y eso
// no se arregla desde aquí.
//
// `payment_link_code` es OBLIGATORIO (anti-carding): sin él el backend
// responde 403 y no toca la pasarela. Es la prueba de que quien paga es quien
// creó la orden. TRAMPA: viene de `create-pending-order`, no de la URL — si
// se pierde entre reintentos, el cobro no se puede completar.
//
// Respuestas del backend que hay que saber leer:
//   200 {success, pending_approval:true}  → privado: dinero RETENIDO, no cobrado
//   200 {success, message:"Payment confirmed", tickets} → público: cobrado
//   402 {error, declined:true}            → tarjeta rechazada, sin cargo
//   403 {error}                           → payment_link_code inválido
//   409 {error, status}                   → la orden ya no es pagable
//   429 {error}                           → demasiados intentos
//   501 {error, use_hosted_checkout:true} → la pasarela configurada NO acepta
//        tarjeta cruda (pasa si el venue vuelve a quedar apuntando a dLocal)
// ============================================================================

// `deviceFingerprintId` es la HUELLA DE DISPOSITIVO para el antifraude
// (Decision Manager). Va vacía mientras NeoNet no nos dé el `org_id` del script
// de profiling — ver utils/deviceFingerprint.ts, que es quien decide si hay algo
// que mandar. Aquí solo se reenvía si trae valor: con cadena vacía el cuerpo de
// la petición sale idéntico al de antes de que esto existiera.
//
// Es OPCIONAL en los dos sentidos: el backend lo valida y, si no le gusta la
// forma, lo DESCARTA y cobra igual (pay_controller.go). Ninguna compra se cae
// por la huella.
export const payOrder = async (
  orderId: string,
  paymentLinkCode: string,
  card: { number: string; exp_month: string; exp_year: string; cvv: string },
  turnstileToken?: string,
  deviceFingerprintId?: string
) => {
  const response = await apiClient.post(`/orders/pay`, {
    order_id: orderId,
    payment_link_code: paymentLinkCode,
    card,
    ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
    ...(deviceFingerprintId ? { device_fingerprint_id: deviceFingerprintId } : {}),
  });
  return response.data;
};

// ============================================================================
// UNIFIED CHECKOUT (widget nativo de Cybersource: Google Pay / Apple Pay /
// tarjeta) — detrás de interruptor, ver payment-page.tsx
//
// Son DOS llamadas y ninguna de las dos mueve dinero por sí sola:
//
//   1. `startUnifiedCheckoutSession` abre la sesión. El backend valida la orden
//      con el MISMO guard que el pago (`payment_link_code`) y devuelve un JWT
//      firmado con el importe dentro. El importe NO viaja desde aquí: sale de
//      la orden en el servidor.
//   2. `payOrderWithTransientToken` cobra. Es el MISMO endpoint `/orders/pay`
//      de siempre, con `transient_token` en lugar de `card`. Todo lo demás
//      —claim atómico, retención en evento privado, emisión de entradas— es
//      idéntico: el token solo sustituye al PAN.
//
// PÚBLICO vs PRIVADO lo decide el BACKEND leyendo el evento, igual que con
// tarjeta. `requires_approval` viene informativo, para poder avisar de que el
// importe se retiene; no es un permiso y la web no puede elegir.
//
// Respuestas propias de este carril:
//   200 {capture_context, amount, currency, order_number, requires_approval,
//        complete_mandate, wallets_eligible:true}
//   200 {success, already_paid:true, order_number} → la orden ya estaba pagada
//   501 {error, enabled:false}          → interruptor APAGADO en el backend
//   501 {error, wallets_eligible:false} → la pasarela del venue no ofrece wallets
//   502 {error}                         → Cybersource no abrió la sesión
// Cualquiera de esas es motivo para caerse al formulario de tarjeta, nunca para
// dejar al comprador sin forma de pagar.
// ============================================================================

export type UnifiedCheckoutSession = {
  captureContext: string;
  amount: number;
  currency: string;
  orderNumber?: string;
  /** El importe se RETENDRÁ en vez de cobrarse (evento privado). */
  requiresApproval: boolean;
  /** "CAPTURE" (cobrar ya) o "AUTH" (retener). Lo declara el backend. */
  completeMandate?: string;
  /** La orden ya estaba pagada: no hay nada que cobrar ni que pintar. */
  alreadyPaid?: boolean;
};

export const startUnifiedCheckoutSession = async (
  orderId: string,
  paymentLinkCode: string
): Promise<UnifiedCheckoutSession> => {
  const { data } = await apiClient.post('/payments/capture-context', {
    order_id: orderId,
    payment_link_code: paymentLinkCode,
  });

  if (data?.already_paid) {
    return {
      captureContext: '', amount: 0, currency: '',
      orderNumber: data.order_number, requiresApproval: false, alreadyPaid: true,
    };
  }
  if (!data?.capture_context) {
    // 200 sin JWT = integración mal configurada. Se trata como fallo para caer
    // al formulario de tarjeta, no como "sesión vacía pero válida".
    throw new Error('UC_SESSION_INCOMPLETE');
  }
  return {
    captureContext: String(data.capture_context),
    amount: Number(data.amount) || 0,
    currency: data.currency || 'GTQ',
    orderNumber: data.order_number,
    requiresApproval: data.requires_approval === true,
    completeMandate: data.complete_mandate,
  };
};

/**
 * Cobro con el token del widget. MISMO endpoint y MISMA semántica de respuesta
 * que `payOrder` (ver arriba): `pending_approval:true` = retenido, sin flag =
 * cobrado. La única diferencia es que aquí el PAN no ha pasado nunca por
 * nuestro servidor.
 *
 * `card` NO se manda: si viajaran las dos cosas, Cybersource rechazaría la
 * petición por ambigua.
 *
 * TAMPOCO se manda `device_fingerprint_id`, y es a propósito: con la sesión
 * abierta con `completeMandate.decisionManager: true`, Unified Checkout perfila
 * el dispositivo ÉL MISMO y mete su `fingerprintSessionId` dentro del transient
 * token. Añadir aquí una segunda huella —la nuestra, con otro id— sería mandarle
 * al antifraude dos identidades para el mismo dispositivo. La huella de este
 * carril ya está resuelta en el backend; la que falta es la del formulario de
 * tarjeta, y esa va en `payOrder`.
 */
export const payOrderWithTransientToken = async (
  orderId: string,
  paymentLinkCode: string,
  transientToken: string,
  turnstileToken?: string
) => {
  const response = await apiClient.post(`/orders/pay`, {
    order_id: orderId,
    payment_link_code: paymentLinkCode,
    transient_token: transientToken,
    ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
  });
  return response.data;
};

// ============================================================================
// dLocal Go — CHECKOUT ALOJADO  ·  FUERA DEL FLUJO desde el 18-ago-2026
//
// Se abandonó dLocal y se volvió a NeoNet (arriba). Nada de este bloque se
// llama ya desde la web. Se conserva a propósito, sin borrar, por si se
// retoma dLocal: volver a montarlo desde cero costaría días.
//
// Cómo funcionaba: dLocal Go NO acepta la tarjeta cruda — el backend creaba
// el pago (POST /v1/payments) y devolvía una `redirect_url` a la página de
// dLocal. El comprador pagaba ALLÍ y volvía a nuestro `success_url`. El pago
// nacía PENDING y se confirmaba por WEBHOOK, así que al volver la orden podía
// seguir en `pending`/`processing` unos segundos — la web no debía cantar
// victoria.
// ============================================================================

// Ruta canónica del checkout ALOJADO. Si el backend acaba exponiendo otro
// nombre, se cambia AQUÍ (una línea). Las alternativas solo se prueban ante un
// 404/405 — "ruta inexistente" garantiza que el backend no hizo nada, así que
// reintentar no puede duplicar un cobro.
// VERIFICADO en producción: el checkout alojado de dLocal vive en
// /orders/checkout (controllers.CreateCheckout) y devuelve checkout_url.
// OJO si alguien reactiva esto: `/orders/checkout` y `/orders/pay` NO son
// intercambiables. `/orders/pay` (el del flujo vigente) espera la tarjeta en el
// body y responde 400 "Datos de tarjeta incompletos" si se le llama con este
// payload — y como 400 no es 404/405, los fallbacks de abajo ni se probarían.
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

// ============================================================================
// SMARTFIELDS (dLocal) — FUERA DEL FLUJO desde el 18-ago-2026
//
// Ya no se llama desde ninguna página: el cobro vuelve a ser `payOrder` contra
// NeoNet. Se conserva junto a `components/smartfields-card` por si se retoma
// dLocal. Si alguien lo reactiva, ojo: los endpoints `/orders/smartfields/*`
// del backend siguen existiendo, pero el venue tiene que estar configurado con
// la pasarela dLocal o responderán con la pasarela equivocada.
//
// Cómo funcionaba: en Guatemala la cuenta de dLocal no ofrece tarjeta, solo
// efectivo, y su página alojada mostraba la lista de métodos VACÍA. SmartFields
// no consulta esa lista — pintábamos el formulario nosotros y la tarjeta se
// tokenizaba contra dLocal desde el navegador, dentro de un iframe suyo, sin
// pasar nunca por nuestro servidor.
// ============================================================================

export type SmartFieldsSession = {
  checkoutToken: string;
  apiKey: string;
  amount: number;
  currency: string;
  country: string;
  orderNumber?: string;
  /** Nombre del titular. El SDK lo EXIGE al tokenizar: sin él dLocal acepta
   *  el token pero luego rechaza el cobro con "Missing payment method". */
  clientName?: string;
  /** true si el backend reutilizó un cobro que ya estaba abierto. */
  reused?: boolean;
  /** true si la orden ya estaba pagada: no hay que cobrar nada. */
  alreadyPaid?: boolean;
};

export const startSmartFieldsSession = async (
  orderId: string,
  paymentLinkCode: string
): Promise<SmartFieldsSession> => {
  const { data } = await apiClient.post('/orders/smartfields/session', {
    order_id: orderId,
    payment_link_code: paymentLinkCode,
  });
  if (data?.already_paid) {
    return {
      checkoutToken: '', apiKey: '', amount: 0, currency: '', country: '',
      orderNumber: data.order_number, alreadyPaid: true,
    };
  }
  if (!data?.checkout_token || !data?.api_key) {
    throw new Error('SMARTFIELDS_SESSION_INCOMPLETE');
  }
  return {
    checkoutToken: data.checkout_token,
    apiKey: data.api_key,
    amount: Number(data.amount) || 0,
    currency: data.currency || 'GTQ',
    clientName: data.client_name || '',
    country: data.country || 'GT',
    orderNumber: data.order_number,
    reused: Boolean(data.reused),
  };
};

export type SmartFieldsResult = {
  paid: boolean;
  status?: string;
  message: string;
  /** true si no se pudo saber el resultado: NO afirmar que falló. */
  indeterminate?: boolean;
  /** 3D Secure: el banco exige que el comprador se autentique antes de cobrar. */
  requiresAction?: boolean;
  /** A dónde hay que mandarlo para esa autenticación. */
  redirectUrl?: string;
};

export const confirmSmartFieldsPayment = async (
  orderId: string,
  paymentLinkCode: string,
  cardToken: string,
  installmentsId?: string
): Promise<SmartFieldsResult> => {
  const { data } = await apiClient.post('/orders/smartfields/confirm', {
    order_id: orderId,
    payment_link_code: paymentLinkCode,
    card_token: cardToken,
    ...(installmentsId ? { installments_id: installmentsId } : {}),
  });
  return {
    paid: Boolean(data?.paid),
    status: data?.status,
    message: data?.message || '',
    indeterminate: Boolean(data?.indeterminate),
    requiresAction: Boolean(data?.requires_action),
    redirectUrl: data?.redirect_url,
  };
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
