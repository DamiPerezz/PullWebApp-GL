// context/AuthContext.tsx
// SECURITY: Authentication state is determined by server-side HttpOnly cookies
// NO tokens are stored in localStorage to prevent XSS attacks
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';

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
  total_spent: number;
  average_spend: number;
  tags: string[];
  stats?: {
    total_tickets: number;
    validated_tickets: number;
  };
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone?: string;
  phone_prefix?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, code: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize auth by checking if there's a valid session cookie
   * SECURITY: We don't check localStorage, we ask the server directly
   */
  const initializeAuth = async () => {
    try {
      // Try to get the user profile - if we have a valid cookie, this will succeed
      const result = await authService.refreshProfile();

      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch {
      // No valid session - user is not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, code: string): Promise<void> => {
    try {
      setIsLoading(true);

      const result = await authService.verifyCode(email, code);

      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }

      if (!result.user) {
        throw new Error('No user data received');
      }

      setUser(result.user);

    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithToken = async (accessToken: string): Promise<void> => {
    try {
      setIsLoading(true);

      const result = await authService.loginWithAccessToken(accessToken);

      if (!result.success) {
        throw new Error(result.error || 'Token login failed');
      }

      if (!result.user) {
        throw new Error('No user data received');
      }

      setUser(result.user);

    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);

      const result = await authService.register(data);

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      if (!result.user) {
        throw new Error('No user data received');
      }

      setUser(result.user);

    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const result = await authService.refreshProfile();

      if (result.success && result.user) {
        setUser(result.user);
      } else {
        // Session expired or invalid
        setUser(null);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithToken,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
