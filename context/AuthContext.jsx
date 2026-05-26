import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/apiConfig';

const AuthContext = createContext(null);
const TOKEN_STORAGE_KEY = '@homeapp_auth_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  // Helper to get token for other contexts/services
  const getToken = useCallback(async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }, []);

  // Bootstrap session: check if a token is already stored
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (token && mounted) {
          // Verify token against backend
          const res = await fetch(`${API_BASE_URL}/me`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          const data = await res.json();

          if (res.status === 200 && data.success && mounted) {
            setUser({
              id: data.user.id || data.user._id,
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone,
              role: data.user.role,
              isLoggedIn: true,
            });
          } else {
            // Invalid or expired token
            await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.log('[Auth Bootstrap Error]', err);
      } finally {
        if (mounted) {
          setAuthReady(true);
        }
      }
    };

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const registerUser = useCallback(
    async ({ name, email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();
      const trimmedPassword = password.trim();

      if (trimmedName.length < 3) {
        return { success: false, message: 'Name must be at least 3 characters long.' };
      }
      if (!normalizedEmail || !trimmedPassword) {
        return { success: false, message: 'Please enter email and password.' };
      }
      if (trimmedPassword.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
      }

      try {
        const res = await fetch(`${API_BASE_URL}/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
            email: normalizedEmail,
            password: trimmedPassword,
            role: 'customer',
          }),
        });

        const data = await res.json();

        if (res.status === 201 && data.success) {
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          setUser({
            id: data.user.id || data.user._id,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            role: data.user.role,
            isLoggedIn: true,
          });
          return { success: true };
        } else {
          return { success: false, message: data.message || 'Could not register account.' };
        }
      } catch (err) {
        console.log('[Register Error]', err);
        return { success: false, message: 'Server is currently offline. Please try again later.' };
      }
    },
    [],
  );

  const loginUser = useCallback(
    async ({ email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (!normalizedEmail || !trimmedPassword) {
        return { success: false, message: 'Please enter email and password.' };
      }

      try {
        const res = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            password: trimmedPassword,
          }),
        });

        const data = await res.json();

        if (res.status === 200 && data.success) {
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          setUser({
            id: data.user.id || data.user._id,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            role: data.user.role,
            isLoggedIn: true,
          });
          return { success: true };
        } else {
          return { success: false, message: data.message || 'Invalid email or password.' };
        }
      } catch (err) {
        console.log('[Login Error]', err);
        return { success: false, message: 'Server is currently offline. Please try again later.' };
      }
    },
    [],
  );

  const logoutUser = useCallback(async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (err) {
      console.log('[Logout Error]', err);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      authReady,
      registerUser,
      loginUser,
      logoutUser,
      getToken,
    }),
    [user, authReady, registerUser, loginUser, logoutUser, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
