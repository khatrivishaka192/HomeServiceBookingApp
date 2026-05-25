import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../constants/appTheme';
import ScreenContainer from '../components/ScreenContainer';
import { useBookings } from '../context/BookingsContext';
import { useResponsive } from '../hooks/useResponsive';

function getBookingTitle(booking) {
  if (!booking.services?.length) return 'Home Service';
  if (booking.services.length === 1) return booking.services[0].name;
  return `${booking.services.length} services`;
}

function formatCreatedAt(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyBookingsScreen() {
  const { userBookings, bookingsReady } = useBookings();
  const { isDesktop } = useResponsive();

  return (
    <ScreenContainer fill topPadding={12}>
      <Text style={styles.title}>Your Bookings</Text>
      <Text style={styles.subtitle}>All confirmed bookings are saved here.</Text>

      {!bookingsReady ? (
        <Text style={styles.emptyText}>Loading your bookings...</Text>
      ) : (
        <FlatList
          style={styles.list}
          data={userBookings}
          keyExtractor={(item) => item.id}
          numColumns={isDesktop ? 2 : 1}
          key={isDesktop ? 'bookings-grid' : 'bookings-list'}
          columnWrapperStyle={isDesktop ? styles.gridRow : undefined}
          contentContainerStyle={[styles.listContent, userBookings.length === 0 && styles.listEmpty]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={42} color={COLORS.mutedIcon} />
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>Confirm a service booking and it will appear in your history.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, isDesktop && styles.cardDesktop, isDesktop && styles.gridItem]}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="construct-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.service}>{getBookingTitle(item)}</Text>
                  <Text style={styles.bookedOn}>Booked on {formatCreatedAt(item.createdAt)}</Text>
                </View>
                <View style={styles.statusPill}>
                  <Text style={styles.status}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.subText} />
                <Text style={styles.meta}>
                  {item.date} at {item.time}
                </Text>
              </View>

              {item.contactNumber ? (
                <View style={styles.metaRow}>
                  <Ionicons name="call-outline" size={14} color={COLORS.subText} />
                  <Text style={styles.meta}>{item.contactNumber}</Text>
                </View>
              ) : null}

              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.subText} />
                <Text style={styles.meta} numberOfLines={2}>
                  {item.address}
                </Text>
              </View>

              {item.services?.map((service) => (
                <Text key={`${item.id}-${service.id}`} style={styles.serviceLine}>
                  {service.name} x{service.quantity} — Rs. {service.total}
                </Text>
              ))}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>Rs. {item.totalPayment}</Text>
              </View>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: COLORS.subText,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  gridRow: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.subText,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...SHADOW,
  },
  cardDesktop: {
    flex: 1,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  service: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
  bookedOn: {
    marginTop: 2,
    color: COLORS.subText,
    fontSize: 11,
  },
  statusPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  status: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 11,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  meta: {
    flex: 1,
    color: COLORS.subText,
    fontSize: 13,
  },
  serviceLine: {
    marginTop: 6,
    color: COLORS.subText,
    fontSize: 12,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: COLORS.subText,
    fontWeight: '600',
  },
  totalValue: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 16,
  },
});
