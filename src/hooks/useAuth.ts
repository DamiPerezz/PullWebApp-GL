// hooks/useAuth.ts - CUSTOM HOOKS ADICIONALES
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * Hook para proteger rutas que requieren autenticación
 */
export const useRequireAuth = (redirectTo: string = '/login') => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { 
        replace: true,
        state: { from: window.location.pathname }
      });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook para redirigir usuarios autenticados (ej: desde login)
 */
export const useRedirectIfAuthenticated = (redirectTo: string = '/wallet') => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  return { isAuthenticated, isLoading };
};

/**
 * Hook para obtener información del usuario actual
 */
export const useCurrentUser = () => {
  const { user, isLoading } = useAuth();
  
  return {
    user,
    isLoading,
    isVIP: user?.tier === 'vip',
    isRegular: user?.tier === 'regular',
    hasStats: !!user?.stats,
  };
};