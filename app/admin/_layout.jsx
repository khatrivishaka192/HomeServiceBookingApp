import React from 'react';
import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/appTheme';

export default function AdminLayout() {
  const { user, authReady } = useAuth();
  const pathname = usePathname();

  if (!authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isLoginPage = pathname === '/admin/login' || pathname === '/admin';

  if (!isLoginPage) {
    if (!user?.isLoggedIn) {
      return <Redirect href="/admin/login" />;
    }
    if (user.role !== 'admin') {
      return <Redirect href="/(tabs)/home" />;
    }
  } else if (user?.isLoggedIn && user.role === 'admin') {
    return <Redirect href="/admin/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.white },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
        contentStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
      }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ title: 'Manage Users' }} />
      <Stack.Screen name="categories" options={{ title: 'Manage Categories' }} />
      <Stack.Screen name="services" options={{ title: 'Manage Services' }} />
      <Stack.Screen name="bookings" options={{ title: 'Manage Bookings' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Stack>
  );
}
