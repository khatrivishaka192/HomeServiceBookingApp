import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../../constants/appTheme';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useBookings } from '../../context/BookingsContext';
import { useResponsive } from '../../hooks/useResponsive';

const items = [
  { id: 'p1', label: 'My Bookings', icon: 'calendar-outline', route: '/my-bookings' },
  { id: 'p2', label: 'Settings', icon: 'settings-outline', route: '/settings' },
  { id: 'p3', label: 'Help & Support', icon: 'help-circle-outline', route: '/support' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logoutUser } = useAuth();
  const { userBookings } = useBookings();
  const { isDesktop } = useResponsive();
  const bookingCount = userBookings.length;

  return (
    <ScreenContainer scroll>
      <View style={[styles.userCard, isDesktop && styles.userCardDesktop]}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={[styles.menuList, isDesktop && styles.menuListDesktop]}>
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => router.push(item.route)}>
            <Ionicons name={item.icon} size={20} color={COLORS.primary} />
            <Text style={styles.menuText}>{item.label}</Text>
            {item.id === 'p1' && bookingCount > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{bookingCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, isDesktop && styles.logoutBtnDesktop]}
        onPress={() => {
          logoutUser();
          router.replace('/login');
        }}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    ...SHADOW,
  },
  userCardDesktop: {
    padding: 24,
  },
  name: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '700',
  },
  email: {
    color: COLORS.subText,
    marginTop: 4,
  },
  menuList: {
    marginTop: 4,
  },
  menuListDesktop: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    marginTop: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flex: 1,
    minWidth: 220,
  },
  menuText: {
    flex: 1,
    color: COLORS.text,
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutBtnDesktop: {
    maxWidth: 320,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
