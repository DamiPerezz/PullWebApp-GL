// utils/orderStatus.ts
//
// Con dLocal Go el pago ya NO se confirma en la misma petición HTTP: el
// comprador paga en la página de dLocal y la orden pasa a `confirmed` por
// WEBHOOK, segundos después. Por eso la web tiene que saber leer el estado
// de la orden y decir la verdad en cada uno.
//
// Estados de `orders.status` (enum order_status del backend):
//   pending            → creada, sin pagar todavía  → se puede pagar
//   awaiting_approval  → evento privado: solicitud enviada. SIN dinero.
//   approved_unpaid    → el local la aprobó; falta que el cliente pague
//   processing         → hay un pago en curso / esperando el webhook
//   confirmed          → pagada, tickets emitidos
//   checked_in         → pagada y ya escaneada en puerta
//   payment_authorized → LEGACY NeoNet (retención 48h). Ya no se genera.
//   failed | payment_failed | cancelled | expired | refunded → sin retorno
export type OrderStage =
  | 'payable'
  | 'awaitingApproval'
  | 'processing'
  | 'confirmed'
  | 'legacyHold'
  | 'dead'
  | 'unknown';

export const classifyOrderStatus = (status?: string | null): OrderStage => {
  switch ((status || '').toLowerCase()) {
    case 'pending':
    case 'approved_unpaid':
      return 'payable';
    case 'awaiting_approval':
      return 'awaitingApproval';
    case 'processing':
      return 'processing';
    case 'confirmed':
    case 'completed':
    case 'checked_in':
      return 'confirmed';
    // Órdenes viejas de NeoNet: el importe quedó RETENIDO en la tarjeta a la
    // espera de aprobación. Con dLocal ya no existe, pero el histórico sí.
    case 'payment_authorized':
      return 'legacyHold';
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
