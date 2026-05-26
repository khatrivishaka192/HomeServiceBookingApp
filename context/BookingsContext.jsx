import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';

const BookingsContext = createContext(null);

export function BookingsProvider({ children }) {
  const { user, getToken } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [bookingsReady, setBookingsReady] = useState(false);

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

  // Fetch user bookings when the user changes or logs in
  useEffect(() => {
    if (user?.isLoggedIn) {
      setBookingsReady(false);
      loadBookings();
    } else {
      setBookings([]);
      setBookingsReady(true);
    }
  }, [user, loadBookings]);

  const addBooking = useCallback(async (bookingInput) => {
    const token = await getToken();
    if (!token) {
      return { success: false, message: 'Please login to confirm a booking.' };
    }

    try {
      // Map properties exactly as expected by backend router:
      // backend expects: serviceType, bookingDate, bookingTime, price, contactNumber, address, paymentMethod, services, subtotal, serviceCharge, totalPayment, status
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
        // Prepend the new booking to the list
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

  // userBookings matches bookings since the backend handles filtering by logged in user
  const userBookings = useMemo(() => bookings, [bookings]);

  const value = useMemo(
    () => ({
      bookings,
      userBookings,
      bookingsReady,
      addBooking,
      refreshBookings: loadBookings,
    }),
    [bookings, userBookings, bookingsReady, addBooking, loadBookings],
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
