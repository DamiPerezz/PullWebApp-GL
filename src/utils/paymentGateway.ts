/**
 * Payment Gateway Utilities
 *
 * This module provides utilities for handling multiple payment gateways
 * (Stripe and NeoNet) based on venue configuration.
 */

import type { PaymentGateway, VenueInfo } from '../types/types';
import { PAYMENT_GATEWAYS } from '../types/types';

/**
 * Determines which payment gateway to use for a venue
 */
export function getPaymentGateway(venue: VenueInfo | null): PaymentGateway {
  if (!venue || !venue.payment_gateway) {
    // Default to Stripe if no gateway is specified
    return PAYMENT_GATEWAYS.STRIPE;
  }
  return venue.payment_gateway;
}

/**
 * Checks if the venue uses Stripe
 */
export function isStripeVenue(venue: VenueInfo | null): boolean {
  return getPaymentGateway(venue) === PAYMENT_GATEWAYS.STRIPE;
}

/**
 * Checks if the venue uses NeoNet
 */
export function isNeoNetVenue(venue: VenueInfo | null): boolean {
  return getPaymentGateway(venue) === PAYMENT_GATEWAYS.NEONET;
}

/**
 * Payment checkout parameters
 */
export interface CheckoutParams {
  orderId: string;
  amount: number;
  currency: string;
  venueId: string;
  eventName: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Result from creating a checkout session
 */
export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  sessionId?: string;
  gateway: PaymentGateway;
  error?: string;
}

/**
 * Creates a checkout session based on the venue's payment gateway
 * This is a placeholder that will be connected to the actual API
 */
export async function createCheckoutSession(
  params: CheckoutParams,
  gateway: PaymentGateway
): Promise<CheckoutResult> {
  switch (gateway) {
    case PAYMENT_GATEWAYS.STRIPE:
      // Use existing Stripe checkout logic
      return createStripeCheckout(params);

    case PAYMENT_GATEWAYS.NEONET:
      // NeoNet checkout - to be implemented
      return createNeoNetCheckout(params);

    default:
      return {
        success: false,
        gateway,
        error: 'Unknown payment gateway',
      };
  }
}

/**
 * Creates a Stripe checkout session
 * Uses the existing API endpoint
 */
async function createStripeCheckout(_params: CheckoutParams): Promise<CheckoutResult> {
  // This will call the existing /api/v1/orders/create-checkout-session endpoint
  // The actual implementation is in the purchase-pages-controller.ts
  return {
    success: true,
    gateway: PAYMENT_GATEWAYS.STRIPE,
    // The actual URL will be returned by the API
    checkoutUrl: undefined,
    sessionId: undefined,
  };
}

/**
 * Creates a NeoNet checkout session
 * TODO: Implement when NeoNet API is integrated
 */
async function createNeoNetCheckout(_params: CheckoutParams): Promise<CheckoutResult> {
  // NeoNet checkout - to be implemented
  // This will call a new API endpoint: /api/v1/orders/create-neonet-checkout
  console.warn('NeoNet checkout not yet implemented');
  return {
    success: false,
    gateway: PAYMENT_GATEWAYS.NEONET,
    error: 'NeoNet integration pending',
  };
}

/**
 * Handles post-payment confirmation based on gateway
 */
export async function confirmPayment(
  _sessionId: string,
  gateway: PaymentGateway
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  switch (gateway) {
    case PAYMENT_GATEWAYS.STRIPE:
      // Use existing confirmation logic
      return { success: true };

    case PAYMENT_GATEWAYS.NEONET:
      // NeoNet confirmation - to be implemented
      return {
        success: false,
        error: 'NeoNet confirmation not yet implemented'
      };

    default:
      return {
        success: false,
        error: 'Unknown payment gateway'
      };
  }
}

/**
 * Returns display information for the payment gateway
 */
export function getGatewayDisplayInfo(gateway: PaymentGateway): {
  name: string;
  icon?: string;
  description: string;
} {
  switch (gateway) {
    case PAYMENT_GATEWAYS.STRIPE:
      return {
        name: 'Stripe',
        description: 'Pay securely with credit or debit card',
      };

    case PAYMENT_GATEWAYS.NEONET:
      return {
        name: 'NeoNet',
        description: 'Pay with local payment methods',
      };

    default:
      return {
        name: 'Payment',
        description: 'Complete your payment',
      };
  }
}

/**
 * Checks if a payment gateway is available/configured for a venue
 */
export function isGatewayConfigured(
  venue: VenueInfo | null,
  gateway: PaymentGateway
): boolean {
  if (!venue) return false;

  const config = venue.payment_gateway_config;
  if (!config) {
    // If no config, only Stripe is available (uses platform default)
    return gateway === PAYMENT_GATEWAYS.STRIPE;
  }

  switch (gateway) {
    case PAYMENT_GATEWAYS.STRIPE:
      // Stripe is always available (can use platform account)
      return true;

    case PAYMENT_GATEWAYS.NEONET:
      // NeoNet requires merchant configuration
      return !!(config.neonet_merchant_id && config.neonet_terminal_id);

    default:
      return false;
  }
}
