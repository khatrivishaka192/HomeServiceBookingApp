import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../constants/appTheme';

export default function BookingSuccessModal({ visible, booking, onViewBookings, onGoHome }) {
  if (!booking) return null;

  const serviceTitle =
    booking.services?.length > 1
      ? `${booking.services.length} services booked`
      : booking.services?.[0]?.name ?? 'Service booked';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onGoHome}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
          </View>

          <Text style={styles.title}>Booking Successful!</Text>
          <Text style={styles.subtitle}>Your home service has been scheduled.</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>{serviceTitle}</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.summaryText}>
                {booking.date} at {booking.time}
              </Text>
            </View>
            {booking.contactNumber ? (
              <View style={styles.summaryRow}>
                <Ionicons name="call-outline" size={16} color={COLORS.primary} />
                <Text style={styles.summaryText}>{booking.contactNumber}</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.primary} />
              <Text style={styles.summaryText} numberOfLines={2}>
                {booking.address}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
              <Text style={styles.summaryText}>{booking.paymentMethod}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total paid on service</Text>
              <Text style={styles.totalValue}>Rs. {booking.totalPayment}</Text>
            </View>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Saved to My Bookings</Text>
          </View>

          <Pressable style={styles.primaryBtn} onPress={onViewBookings}>
            <Text style={styles.primaryBtnText}>View My Bookings</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={onGoHome}>
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 10, 22, 0.82)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    ...SHADOW,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.subText,
    fontSize: 14,
    textAlign: 'center',
  },
  summaryCard: {
    width: '100%',
    marginTop: 18,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryHeading: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  summaryText: {
    flex: 1,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 18,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: COLORS.subText,
    fontSize: 12,
  },
  totalValue: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 18,
  },
  badge: {
    marginTop: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryBtn: {
    marginTop: 16,
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    marginTop: 10,
    width: '100%',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 15,
  },
});
