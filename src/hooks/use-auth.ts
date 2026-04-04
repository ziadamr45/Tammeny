"use client";

import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  gender: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.user) {
        setState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setState({
        user: null,
        loading: false,
        error: 'فشل في تحميل بيانات المستخدم',
        isAuthenticated: false,
      });
    }
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'فشل في تسجيل الدخول',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'فشل في الاتصال بالخادم';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Register
  const register = useCallback(async (userData: {
    name: string;
    email: string;
    password: string;
    gender?: string;
    phone?: string;
  }) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setState({
          user: data.user,
          loading: false,
          error: null,
          isAuthenticated: true,
        });
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'فشل في التسجيل',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'فشل في الاتصال بالخادم';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setState({
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  // Fetch user on mount
  useEffect(() => {
    let mounted = true;
    
    async function loadUser() {
      try {
        if (mounted) {
          setState(prev => ({ ...prev, loading: true, error: null }));
        }

        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (mounted) {
          if (data.success && data.user) {
            setState({
              user: data.user,
              loading: false,
              error: null,
              isAuthenticated: true,
            });
          } else {
            setState({
              user: null,
              loading: false,
              error: null,
              isAuthenticated: false,
            });
          }
        }
      } catch (error) {
        if (mounted) {
          setState({
            user: null,
            loading: false,
            error: 'فشل في تحميل بيانات المستخدم',
            isAuthenticated: false,
          });
        }
      }
    }
    
    loadUser();
    
    return () => {
      mounted = false;
    };
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refetch: fetchUser,
  };
}
