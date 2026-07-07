// services/authService.ts
// SECURITY: Authentication is handled via HttpOnly cookies set by the server
// NO tokens are stored in localStorage to prevent XSS attacks
import { apiClient } from '../utils/axios';

interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone?: string;
  phone_prefix?: string;
  tier: 'regular' | 'vip';
  profile_image?: string;
  birth_date?: string;
  gender?: string;
  created_at?: string;
  total_spent: number;
  average_spend: number;
  tags: string[];
  stats?: {
    total_tickets: number;
    validated_tickets: number;
  };
}

interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  message?: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone?: string;
  phone_prefix?: string;
}

export const authService = {
  /**
   * Registra un nuevo usuario
   * SECURITY: El servidor establece una cookie HttpOnly tras registro exitoso
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/user-auth/register', data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }

      // SECURITY: El servidor establece la cookie HttpOnly
      const { user } = response.data;

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Registration failed',
      };
    }
  },

  /**
   * Solicita un código de verificación al email del usuario
   */
  requestLoginCode: async (email: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/user-auth/request-code', { email });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send verification code',
      };
    }
  },

  /**
   * Verifica el código de 6 dígitos y establece la sesión
   * SECURITY: El servidor establece una cookie HttpOnly, no guardamos tokens en cliente
   */
  verifyCode: async (email: string, code: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/user-auth/verify-code', {
        email,
        code
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Verification failed');
      }

      // SECURITY: El token viene en una HttpOnly cookie establecida por el servidor
      // No lo guardamos en localStorage para prevenir XSS
      const { user } = response.data;

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Invalid verification code',
      };
    }
  },

  /**
   * Inicia sesión usando el token de acceso del email (magic link)
   * SECURITY: El servidor establece una cookie HttpOnly
   */
  loginWithAccessToken: async (accessToken: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/user-auth/login-with-token', {
        token: accessToken
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Token login failed');
      }

      // SECURITY: El servidor establece la cookie HttpOnly
      const { user } = response.data;

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Invalid or expired access token',
      };
    }
  },

  /**
   * Obtiene el perfil actualizado del usuario
   * SECURITY: Usa la cookie HttpOnly para autenticación
   */
  refreshProfile: async (): Promise<AuthResponse> => {
    try {
      const response = await apiClient.get('/user-auth/profile');

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get profile');
      }

      return {
        success: true,
        user: response.data.user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to refresh profile',
      };
    }
  },

  /**
   * Actualiza la información del perfil del usuario
   */
  updateProfile: async (profileData: {
    name?: string;
    surname?: string;
    phone?: string;
    phone_prefix?: string;
    birth_date?: string;
    gender?: string;
    profile_image?: string;
  }): Promise<AuthResponse> => {
    try {
      const response = await apiClient.put('/user-auth/profile', profileData);

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile',
      };
    }
  },

  /**
   * Cierra sesión del usuario - Invalida sesión en servidor
   * SECURITY: El servidor limpia la cookie HttpOnly
   */
  logout: async (): Promise<void> => {
    try {
      // El servidor invalida la sesión y limpia la cookie HttpOnly
      await apiClient.post('/user-auth/logout');
    } catch {
      // Silently fail - the cookie will expire anyway
    }
  },

  /**
   * Renueva la sesión del usuario (extiende expiración)
   */
  refreshSession: async (): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/user-auth/refresh');
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to refresh session',
      };
    }
  },

  /**
   * Verifica autenticación llamando al servidor
   * SECURITY: Con HttpOnly cookies, esta es la única forma segura de verificar auth
   */
  checkAuthStatus: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get('/user-auth/profile');
      return response.data.success === true;
    } catch {
      return false;
    }
  },

  // ========================================
  // GOOGLE OAUTH METHODS
  // ========================================

  /**
   * Obtiene el Google Client ID del servidor
   * Esto permite que el frontend inicialice Google Sign-In sin hardcodear el client ID
   */
  getGoogleClientId: async (): Promise<{ success: boolean; client_id?: string; error?: string }> => {
    try {
      const response = await apiClient.get('/user-auth/google/client-id');
      return {
        success: true,
        client_id: response.data.client_id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Google OAuth not available',
      };
    }
  },

  /**
   * Genera un nonce para protección CSRF en el flujo OAuth
   * SECURITY: El nonce se almacena en una cookie HttpOnly del servidor
   */
  getGoogleNonce: async (): Promise<{ success: boolean; nonce?: string; error?: string }> => {
    try {
      const response = await apiClient.get('/user-auth/google/nonce');
      return {
        success: true,
        nonce: response.data.nonce,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to generate nonce',
      };
    }
  },

  /**
   * Inicia sesión con Google OAuth
   * SECURITY:
   * - El credential (ID token) de Google se envía al servidor para verificación
   * - El servidor verifica el token con Google antes de crear la sesión
   * - La sesión se establece mediante una cookie HttpOnly (no tokens en frontend)
   * - Email es el identificador único - los datos del usuario se asocian al email
   */
  loginWithGoogle: async (credential: string, nonce?: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post('/user-auth/google/login', {
        credential,
        nonce,
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Google login failed');
      }

      // SECURITY: El servidor establece la cookie HttpOnly
      const { user, is_new_user, message } = response.data;

      return {
        success: true,
        user,
        message: message || (is_new_user ? 'Account created successfully' : 'Login successful'),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Google login failed',
      };
    }
  },
};