import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../utils/axios';

interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  surname: string;
  tier: 'regular' | 'vip';
  profile_image?: string;
  tags: string[];
  total_spent: number;
  average_spend: number;
  last_visit?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone?: string;
  phone_prefix?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('user_auth_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const loadUserProfile = async () => {
    try {
      const response = await apiClient.get('/user-auth/profile');
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/user-auth/login', { email, password });
      const { user, token } = response.data;
      
      setUser(user);
      setToken(token);
      localStorage.setItem('user_auth_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post('/user-auth/register', data);
      const { user, token } = response.data;
      
      setUser(user);
      setToken(token);
      localStorage.setItem('user_auth_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user_auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const refreshProfile = async () => {
    if (token) {
      await loadUserProfile();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshProfile
    }}>
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