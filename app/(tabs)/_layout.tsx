import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/appTheme';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

export default function TabLayout() {
  const { user, authReady } = useAuth();
  const { isDesktop, isWeb } = useResponsive();

  if (!authReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user?.isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.mutedIcon,
        headerShown: false,
        tabBarStyle: {
          height: isDesktop ? 72 : 68,
          paddingBottom: Platform.OS === 'web' ? 10 : 8,
          paddingTop: 8,
          borderTopWidth: 0,
          backgroundColor: COLORS.white,
          ...(isWeb && isDesktop
            ? {
                maxWidth: 1100,
                alignSelf: 'center',
                width: '100%',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              }
            : {}),
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="grid-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
