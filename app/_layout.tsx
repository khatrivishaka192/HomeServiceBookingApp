import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { BookingsProvider } from '../context/BookingsContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <AuthProvider>
    <BookingsProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="category-services" options={{ title: 'Category Services' }} />
        <Stack.Screen name="service-details" options={{ title: 'Service Details' }} />
        <Stack.Screen name="booking" options={{ title: 'Book Service' }} />
        <Stack.Screen name="my-bookings" options={{ title: 'My Bookings' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="support" options={{ title: 'Help & Support' }} />
      </Stack>
      <StatusBar style="light" />
    </BookingsProvider>
    </AuthProvider>
    </SafeAreaProvider>
  );
}
