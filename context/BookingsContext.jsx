import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const BOOKINGS_STORAGE_KEY = '@homeapp_bookings';

const BookingsContext = createContext(null);

export function BookingsProvider({ children }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [bookingsReady, setBookingsReady] = useState(false);
  const bookingsRef = useRef([]);

  useEffect(() => {
    let mounted = true;

    const loadBookings = async () => {
      try {
        const stored = await AsyncStorage.getItem(BOOKINGS_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        const safeList = Array.isArray(parsed) ? parsed : [];
        if (mounted) {
          bookingsRef.current = safeList;
          setBookings(safeList);
        }
      } catch {
        if (mounted) {
          bookingsRef.current = [];
          setBookings([]);
        }
      } finally {
        if (mounted) {
          setBookingsReady(true);
        }
      }
    };

    loadBookings();
    return () => {
      mounted = false;
    };
  }, []);

  const addBooking = useCallback(async (bookingInput) => {
    const userEmail = user?.email?.toLowerCase?.();
    if (!userEmail) {
      return { success: false, message: 'Please login to confirm a booking.' };
    }

    const booking = {
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userEmail,
      status: 'Upcoming',
      createdAt: new Date().toISOString(),
      ...bookingInput,
    };

    const nextBookings = [booking, ...bookingsRef.current];

    try {
      await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(nextBookings));
      bookingsRef.current = nextBookings;
      setBookings(nextBookings);
      return { success: true, booking };
    } catch {
      return { success: false, message: 'Could not save booking. Please try again.' };
    }
  }, [user?.email]);

  const userBookings = useMemo(() => {
    const email = user?.email?.toLowerCase?.();
    if (!email) return [];
    return bookings.filter((item) => item.userEmail === email);
  }, [bookings, user?.email]);

  const value = useMemo(
    () => ({
      bookings,
      userBookings,
      bookingsReady,
      addBooking,
    }),
    [bookings, userBookings, bookingsReady, addBooking],
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingsContext);
  if (!context) {
    throw new Error('useBookings must be used inside BookingsProvider');
  }
  return context;
}
