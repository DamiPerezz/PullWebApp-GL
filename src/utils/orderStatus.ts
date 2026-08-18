// utils/orderStatus.ts
//
// Un solo sitio donde traducir `orders.status` a "qué le enseño al comprador".
// Existe porque la página de pago y la de éxito tienen que decir LA VERDAD
// sobre si hay dinero cobrado, retenido o nada — y equivocarse aquí es
// decirle a alguien que pagó cuando no, o al revés.
//
// Estados que GENERA el flujo actual (NeoNet, retención — 18-ago-2026):
//   pending            → creada, sin pagar todavía        → se puede pagar
//   processing         → un cobro en curso la ha reclamado
//   payment_authorized → PRIVADO: importe RETENIDO en la tarjeta, sin cobrar.
//                        El staff decide; a las 48 h se libera solo.
//   confirmed          → cobrada y con entradas emitidas
//   checked_in         → cobrada y ya escaneada en puerta
//   cancelled          → el staff rechazó → retención liberada
//   expired            → 48 h sin decisión → retención liberada
//   failed | payment_failed | refunded → sin retorno
//
// Estados HISTÓRICOS del desvío de dLocal (agosto 2026). Ya NO se crean, pero
// hay órdenes reales con ellos en base de datos y tienen que poder leerse:
//   awaiting_approval  → solicitud enviada SIN tarjeta (no había retención)
//   approved_unpaid    → aprobada, pendiente de que el cliente pagase por
//                        enlace.
//
// OJO con `approved_unpaid`: aquí se sigue clasificando como 'payable' porque
// conceptualmente lo es (aprobada y sin cobrar), pero con NeoNet NADIE la puede
// cobrar desde la web: `POST /orders/pay` solo acepta órdenes `pending` y
// responde 409 "Order is not payable". La página de pago lo trata como enlace
// muerto a propósito — no le pide la tarjeta a alguien a quien no se le puede
// cobrar. Si el backend vuelve a aceptarlo, ese caso especial se quita allí.
export type OrderStage =
  | 'payable'
  | 'authorizedHold'
  | 'awaitingApproval'
  | 'processing'
  | 'confirmed'
  | 'dead'
  | 'unknown';

export const classifyOrderStatus = (status?: string | null): OrderStage => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
    // HISTÓRICO dLocal: aprobada y sin pagar. Pagable sobre el papel; ver el
    // aviso de arriba antes de ofrecerle un formulario de tarjeta.
    case 'approved_unpaid':
      return 'payable';
    // PRIVADO (flujo vigente): la tarjeta ya se cobró… a medias. El importe
    // está RETENIDO, no cobrado, esperando la decisión del local.
    case 'payment_authorized':
      return 'authorizedHold';
    // HISTÓRICO dLocal: solicitud sin tarjeta, sin un quetzal de por medio.
    case 'awaiting_approval':
      return 'awaitingApproval';
    case 'processing':
      return 'processing';
    case 'confirmed':
    case 'completed':
    case 'checked_in':
      return 'confirmed';
    case 'cancelled':
    case 'expired':
    case 'failed':
    case 'payment_failed':
    case 'refunded':
      return 'dead';
    default:
      return 'unknown';
  }
};

// El `code` del enlace de pago (payment_link_code): lo genera el backend con
// generateRandomCode(16) → hex. Se valida antes de mandarlo para no reenviar
// basura de la URL a la API.
const PAYMENT_LINK_CODE_REGEX = /^[A-Za-z0-9_-]{6,64}$/;

export const validatePaymentLinkCode = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  return PAYMENT_LINK_CODE_REGEX.test(trimmed) ? trimmed : null;
};
