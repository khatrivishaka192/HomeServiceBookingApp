import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';

const BookingsContext = createContext(null);
const FAVORITES_STORAGE_KEY = '@homeapp_favorites';

export function BookingsProvider({ children }) {
  const { user, getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [bookingsReady, setBookingsReady] = useState(false);

  // Dynamic DB listings states
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);

  // 1. Fetch categories dynamically
  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.log('[Load Categories Error]', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // 2. Fetch services dynamically
  const loadServices = useCallback(async (queryParam = '') => {
    try {
      setLoadingServices(true);
      const res = await fetch(`${API_BASE_URL}/services${queryParam}`);
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setServices(data.services || []);
      }
    } catch (err) {
      console.log('[Load Services Error]', err);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  // 3. Fetch bookings from backend server
  const loadBookings = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setBookings([]);
      setBookingsReady(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setBookings(data.bookings || []);
      } else {
        setBookings([]);
      }
    } catch (err) {
      console.log('[Fetch Bookings Error]', err);
      setBookings([]);
    } finally {
      setBookingsReady(true);
    }
  }, [getToken]);

  // Load favorites locally
  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (err) {
      console.log('[Load Favorites Error]', err);
    }
  }, []);

  // Run dynamic fetch on context initialization
  useEffect(() => {
    loadCategories();
    loadServices();
  }, [loadCategories, loadServices]);

  // Sync bookings & favorites when user session starts
  useEffect(() => {
    if (user?.isLoggedIn) {
      setBookingsReady(false);
      loadBookings();
      loadFavorites();
    } else {
      setBookings([]);
      setFavorites([]);
      setBookingsReady(true);
    }
  }, [user, loadBookings, loadFavorites]);

  // 4. Add a service booking
  const addBooking = useCallback(async (bookingInput) => {
    const token = await getToken();
    if (!token) {
      return { success: false, message: 'Please login to confirm a booking.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          serviceType: bookingInput.serviceType || bookingInput.services?.[0]?.category || 'Home Service',
          bookingDate: bookingInput.date,
          bookingTime: bookingInput.time,
          price: bookingInput.totalPayment || bookingInput.price || 0,
          contactNumber: bookingInput.contactNumber,
          address: bookingInput.address,
          paymentMethod: bookingInput.paymentMethod || 'Cash on Service',
          services: bookingInput.services || [],
          subtotal: bookingInput.subtotal || 0,
          serviceCharge: bookingInput.serviceCharge || 0,
          totalPayment: bookingInput.totalPayment || 0,
        }),
      });

      const data = await res.json();
      if (res.status === 201 && data.success) {
        setBookings((prev) => [data.booking, ...prev]);
        return { success: true, booking: data.booking };
      } else {
        return { success: false, message: data.message || 'Could not complete booking request.' };
      }
    } catch (err) {
      console.log('[Add Booking Error]', err);
      return { success: false, message: 'Server is currently offline. Please try again later.' };
    }
  }, [getToken]);

  // 5. Cancel a service booking
  const cancelBooking = useCallback(async (bookingId, reason) => {
    const token = await getToken();
    if (!token) {
      return { success: false, message: 'Please login to cancel a booking.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setBookings((prev) =>
          prev.map((item) => (item.bookingId === bookingId ? data.booking : item))
        );
        return { success: true, booking: data.booking };
      } else {
        return { success: false, message: data.message || 'Could not cancel booking.' };
      }
    } catch (err) {
      console.log('[Cancel Booking Error]', err);
      return { success: false, message: 'Server is currently offline. Please try again later.' };
    }
  }, [getToken]);

  // 6. Toggle a service favorite status
  const toggleFavoriteService = useCallback(async (serviceId) => {
    try {
      let nextFavorites;
      if (favorites.includes(serviceId)) {
        nextFavorites = favorites.filter((id) => id !== serviceId);
      } else {
        nextFavorites = [...favorites, serviceId];
      }
      setFavorites(nextFavorites);
      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
    } catch (err) {
      console.log('[Toggle Favorite Error]', err);
    }
  }, [favorites]);

  const isFavorite = useCallback((serviceId) => favorites.includes(serviceId), [favorites]);

  const userBookings = useMemo(() => bookings, [bookings]);

  const value = useMemo(
    () => ({
      bookings,
      userBookings,
      favorites,
      bookingsReady,
      categories,
      services,
      loadingCategories,
      loadingServices,
      addBooking,
      cancelBooking,
      toggleFavoriteService,
      isFavorite,
      refreshBookings: loadBookings,
      refreshCategories: loadCategories,
      refreshServices: loadServices,
    }),
    [
      bookings,
      userBookings,
      favorites,
      bookingsReady,
      categories,
      services,
      loadingCategories,
      loadingServices,
      addBooking,
      cancelBooking,
      toggleFavoriteService,
      isFavorite,
      loadBookings,
      loadCategories,
      loadServices,
    ],
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
