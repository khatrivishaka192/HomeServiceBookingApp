import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);
const USERS_STORAGE_KEY = '@homeapp_registered_users';
const SESSION_STORAGE_KEY = '@homeapp_session_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const usersRef = useRef([]);

  const persistUsers = useCallback(async (users) => {
    await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    usersRef.current = users;
  }, []);

  const persistSession = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionUser));
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const [storedUsers, storedSession] = await Promise.all([
          AsyncStorage.getItem(USERS_STORAGE_KEY),
          AsyncStorage.getItem(SESSION_STORAGE_KEY),
        ]);

        const parsedUsers = storedUsers ? JSON.parse(storedUsers) : [];
        const safeList = Array.isArray(parsedUsers) ? parsedUsers : [];

        if (mounted) {
          usersRef.current = safeList;
        }

        if (storedSession && mounted) {
          const parsedSession = JSON.parse(storedSession);
          const sessionEmail = parsedSession?.email?.toLowerCase?.();
          const account = safeList.find((item) => item.email === sessionEmail);
          if (account) {
            setUser({
              name: account.name,
              email: account.email,
              isLoggedIn: true,
            });
          } else {
            await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch {
        if (mounted) {
          usersRef.current = [];
        }
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

  const setLoggedInUser = useCallback(
    async (account) => {
      const sessionUser = {
        name: account.name,
        email: account.email,
        isLoggedIn: true,
      };
      setUser(sessionUser);
      await persistSession({ email: account.email });
    },
    [persistSession],
  );

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

      const exists = usersRef.current.some((item) => item.email === normalizedEmail);
      if (exists) {
        return { success: false, message: 'An account with this email already exists.' };
      }

      const nextUsers = [
        ...usersRef.current,
        {
          name: trimmedName,
          email: normalizedEmail,
          password: trimmedPassword,
        },
      ];

      try {
        await persistUsers(nextUsers);
        const account = nextUsers.find((item) => item.email === normalizedEmail);
        await setLoggedInUser(account);
        return { success: true };
      } catch {
        return { success: false, message: 'Could not save account. Please try again.' };
      }
    },
    [persistUsers, setLoggedInUser],
  );

  const loginUser = useCallback(
    async ({ email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();
      const account = usersRef.current.find(
        (item) => item.email === normalizedEmail && item.password === trimmedPassword,
      );

      if (!account) {
        return { success: false, message: 'Invalid email or password. Please sign up first.' };
      }

      try {
        await setLoggedInUser(account);
        return { success: true };
      } catch {
        return { success: false, message: 'Could not start your session. Please try again.' };
      }
    },
    [setLoggedInUser],
  );

  const logoutUser = useCallback(async () => {
    setUser(null);
    try {
      await persistSession(null);
    } catch {
      // Session clear failed; user is already logged out in memory.
    }
  }, [persistSession]);

  const value = useMemo(
    () => ({
      user,
      authReady,
      registerUser,
      loginUser,
      logoutUser,
    }),
    [user, authReady, registerUser, loginUser, logoutUser],
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
