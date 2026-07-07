/**
 * SECURITY UTILITIES - PullWebApp-GL
 * Centralized security functions for input validation and sanitization
 *
 * OWASP Compliance:
 * - A03:2021 Injection Prevention
 * - A07:2021 Identification and Authentication Failures Prevention
 */

// ============================================
// REGEX PATTERNS
// ============================================

/** UUID validation - accepts any valid UUID format (v1-v5) */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID v4 validation (legacy) - 122 bits of entropy prevents IDOR enumeration */
export const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Email validation - RFC 5322 compliant */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Phone number - 6-15 digits only */
export const PHONE_REGEX = /^\d{6,15}$/;

/** Alphanumeric slug - safe for URLs */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Safe text - no HTML/script tags */
export const SAFE_TEXT_REGEX = /^[^<>]*$/;

/** Numeric only */
export const NUMERIC_REGEX = /^\d+$/;

/** Base64 validation - allows standard Base64 and URL-safe Base64 characters */
export const BASE64_REGEX = /^[A-Za-z0-9+/=_-]+$/;

/** VIP tracking code format: VIP-XXXXXXXX (alphanumeric) */
export const VIP_TRACKING_CODE_REGEX = /^VIP-[A-Z0-9]{8,16}$/i;

/** VIP edit code format: EDIT-XXXXXXXX (alphanumeric) */
export const VIP_EDIT_CODE_REGEX = /^EDIT-[A-Z0-9]{8,16}$/i;

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validates UUID format (any version)
 * @param input - Raw input string
 * @returns Validated UUID or null
 */
export const validateUUID = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const sanitized = input.trim().toLowerCase();
  return UUID_REGEX.test(sanitized) ? sanitized : null;
};

/**
 * Validates UUID v4 format specifically
 * @param input - Raw input string
 * @returns Validated UUID v4 or null
 */
export const validateUUIDv4 = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const sanitized = input.trim().toLowerCase();
  return UUID_V4_REGEX.test(sanitized) ? sanitized : null;
};

/**
 * Validates Base64 encoded string (used for encrypted IDs)
 * @param input - Raw input string
 * @returns Validated Base64 string or null
 */
export const validateBase64Id = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const sanitized = input.trim();
  if (sanitized.length > 200) return null; // Reasonable max length
  return BASE64_REGEX.test(sanitized) ? sanitized : null;
};

/**
 * Validates VIP tracking code format (VIP-XXXXXXXX)
 * @param input - Raw input string
 * @returns Validated tracking code or null
 */
export const validateVIPCode = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const sanitized = input.trim().toUpperCase();
  if (sanitized.length > 25) return null; // Reasonable max length
  return VIP_TRACKING_CODE_REGEX.test(sanitized) ? sanitized : null;
};

/**
 * Validates VIP edit code format (EDIT-XXXXXXXX)
 * @param input - Raw input string
 * @returns Validated edit code or null
 */
export const validateVIPEditCode = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const sanitized = input.trim().toUpperCase();
  if (sanitized.length > 25) return null; // Reasonable max length
  return VIP_EDIT_CODE_REGEX.test(sanitized) ? sanitized : null;
};

/**
 * Validates email format
 * @param input - Raw input string
 * @returns Validated email or null
 */
export const validateEmail = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const sanitized = input.trim().toLowerCase();
  if (sanitized.length > 254) return null; // RFC 5321
  return EMAIL_REGEX.test(sanitized) ? sanitized : null;
};

/**
 * Validates phone number (digits only)
 * @param input - Raw input string
 * @returns Validated phone or null
 */
export const validatePhone = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const digitsOnly = input.replace(/\D/g, '');
  return PHONE_REGEX.test(digitsOnly) ? digitsOnly : null;
};

/**
 * Validates URL slug format
 * @param input - Raw input string
 * @returns Validated slug or null
 */
export const validateSlug = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const sanitized = input.trim().toLowerCase();
  if (sanitized.length > 100) return null;
  return SLUG_REGEX.test(sanitized) ? sanitized : null;
};

/**
 * Validates numeric string
 * @param input - Raw input string
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns Validated number or null
 */
export const validateNumeric = (
  input: string | null | undefined,
  min?: number,
  max?: number
): number | null => {
  if (!input) return null;
  const sanitized = input.trim();
  if (!NUMERIC_REGEX.test(sanitized)) return null;
  const num = parseInt(sanitized, 10);
  if (isNaN(num)) return null;
  if (min !== undefined && num < min) return null;
  if (max !== undefined && num > max) return null;
  return num;
};

// ============================================
// SANITIZATION FUNCTIONS
// ============================================

/**
 * HTML entity encoding to prevent XSS
 * @param input - Raw input string
 * @returns HTML-safe string
 */
export const escapeHtml = (input: string | null | undefined): string => {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Sanitizes text input - removes HTML tags and trims
 * @param input - Raw input string
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string
 */
export const sanitizeText = (
  input: string | null | undefined,
  maxLength: number = 500
): string => {
  if (!input) return '';
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  // Trim whitespace
  sanitized = sanitized.trim();
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }
  return sanitized;
};

/**
 * Sanitizes name input - allows letters, spaces, hyphens, apostrophes
 * @param input - Raw input string
 * @returns Sanitized name
 */
export const sanitizeName = (input: string | null | undefined): string => {
  if (!input) return '';
  // Only allow letters (including accented), spaces, hyphens, apostrophes
  let sanitized = input.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, '');
  sanitized = sanitized.trim();
  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.slice(0, 100);
  }
  return sanitized;
};

/**
 * Sanitizes URL parameter to prevent injection
 * @param input - Raw input string
 * @returns URL-safe string
 */
export const sanitizeUrlParam = (input: string | null | undefined): string => {
  if (!input) return '';
  return encodeURIComponent(input.trim());
};

// ============================================
// URL PARAMETER VALIDATION
// ============================================

/**
 * Validates and extracts URL parameters safely
 * @param searchParams - URLSearchParams object
 * @param paramName - Parameter name to extract
 * @param validator - Validation function to apply
 * @returns Validated parameter or null
 */
export const getValidatedParam = <T>(
  searchParams: URLSearchParams,
  paramName: string,
  validator: (value: string | null) => T | null
): T | null => {
  const rawValue = searchParams.get(paramName);
  return validator(rawValue);
};

// ============================================
// SECURITY CONSTANTS
// ============================================

export const SECURITY_CONSTANTS = {
  /** Maximum email length per RFC 5321 */
  MAX_EMAIL_LENGTH: 254,
  /** Maximum name length */
  MAX_NAME_LENGTH: 100,
  /** Maximum text input length */
  MAX_TEXT_LENGTH: 500,
  /** Maximum URL slug length */
  MAX_SLUG_LENGTH: 100,
  /** Maximum phone length */
  MAX_PHONE_LENGTH: 15,
  /** Minimum phone length */
  MIN_PHONE_LENGTH: 6,
  /** Maximum quantity for tickets */
  MAX_TICKET_QUANTITY: 10,
  /** Minimum age for events */
  MIN_AGE: 18,
  /** Maximum guests for group reservation */
  MAX_GROUP_GUESTS: 30,
  /** Minimum guests for group reservation */
  MIN_GROUP_GUESTS: 4,
} as const;

// ============================================
// DATE VALIDATION
// ============================================

/**
 * Validates birthdate and calculates age
 * @param dateString - Date string in ISO format
 * @param minAge - Minimum required age
 * @returns Object with isValid, age, and error message
 */
export const validateBirthdate = (
  dateString: string | null | undefined,
  minAge: number = 18
): { isValid: boolean; age: number; error?: string } => {
  if (!dateString) {
    return { isValid: false, age: 0, error: 'Date of birth is required' };
  }

  const birthDate = new Date(dateString);
  const today = new Date();

  // Check if valid date
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, age: 0, error: 'Invalid date format' };
  }

  // Check if date is in the future
  if (birthDate > today) {
    return { isValid: false, age: 0, error: 'Date cannot be in the future' };
  }

  // Check if date is too old (over 120 years)
  const maxAge = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  if (birthDate < maxAge) {
    return { isValid: false, age: 0, error: 'Invalid birth date' };
  }

  // Calculate age
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // Check minimum age
  if (age < minAge) {
    return { isValid: false, age, error: `You must be at least ${minAge} years old` };
  }

  return { isValid: true, age };
};

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Sanitizes error messages to prevent information disclosure
 * @param error - Error object or message
 * @returns Safe error message for display
 */
export const getSafeErrorMessage = (error: unknown): string => {
  // Don't expose internal error details to users
  if (error instanceof Error) {
    // Only return safe, pre-approved error messages
    const safeMessages: Record<string, string> = {
      'Network Error': 'Connection failed. Please check your internet connection.',
      'Request failed with status code 401': 'Session expired. Please log in again.',
      'Request failed with status code 403': 'Access denied.',
      'Request failed with status code 404': 'The requested resource was not found.',
      'Request failed with status code 429': 'Too many requests. Please wait a moment.',
      'Request failed with status code 500': 'Server error. Please try again later.',
    };

    for (const [key, message] of Object.entries(safeMessages)) {
      if (error.message.includes(key)) {
        return message;
      }
    }
  }

  // Generic fallback - never expose raw error messages
  return 'An unexpected error occurred. Please try again.';
};

// ============================================
// LOGGING (Development only)
// ============================================

/**
 * Security-aware logging - only logs in development
 * @param message - Log message
 * @param data - Optional data (will be sanitized)
 */
export const secureLog = (message: string, data?: unknown): void => {
  if (import.meta.env.DEV) {
    // In development, log but sanitize sensitive fields
    if (data && typeof data === 'object') {
      const sanitizedData = { ...data as Record<string, unknown> };
      // SECURITY: Extended list of sensitive fields including PCI-DSS card data
      const sensitiveFields = [
        'password', 'token', 'secret', 'key', 'authorization',
        'card_number', 'card_cvv', 'cvv', 'cvc', 'card_expiry', 'card_expiry_date',
        'cardholder_name', 'ssn', 'credit_card', 'pan'
      ];
      for (const field of sensitiveFields) {
        if (field in sanitizedData) {
          sanitizedData[field] = '[REDACTED]';
        }
      }
      // eslint-disable-next-line no-console
      console.log(`[SECURITY] ${message}`, sanitizedData);
    } else {
      // eslint-disable-next-line no-console
      console.log(`[SECURITY] ${message}`);
    }
  }
  // In production, do nothing - logs are stripped by Vite
};
