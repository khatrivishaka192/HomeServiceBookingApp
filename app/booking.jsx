import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { services } from '../data/services';
import { COLORS, SHADOW } from '../constants/appTheme';
import BookingSuccessModal from '../components/BookingSuccessModal';
import ScreenContainer from '../components/ScreenContainer';
import { useBookings } from '../context/BookingsContext';
import { useResponsive } from '../hooks/useResponsive';
import { Ionicons } from '@expo/vector-icons';

function parseTimeToMinutes(value) {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)\s?(AM|PM)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  if (hour < 1 || hour > 12) return null;
  if (period === 'AM' && hour === 12) hour = 0;
  if (period === 'PM' && hour !== 12) hour += 12;
  return hour * 60 + minute;
}

function isValidContactNumber(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('03')) return true;
  if (digits.length === 12 && digits.startsWith('923')) return true;
  if (digits.length === 10 && digits.startsWith('3')) return true;
  return false;
}

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const serviceIdParam = Array.isArray(params.serviceId) ? params.serviceId[0] : params.serviceId;
  const router = useRouter();
  const { addBooking } = useBookings();
  const { isDesktop } = useResponsive();

  const service = services.find((item) => item.id === serviceIdParam) || services[0];
  const additionalOptions = services.filter((item) => item.id !== service.id).slice(0, 6);

  const [date, setDate] = useState('2026-05-10');
  const [time, setTime] = useState('10:30 AM');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState([{ serviceId: service.id, quantity: 1 }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);

  // New Modern App States (Promo codes removed)
  const [paymentMethod, setPaymentMethod] = useState('Cash on Service');

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^(\d{1,2}):[0-5]\d\s?(AM|PM)$/i;

  const toggleService = (selectedServiceId) => {
    setSelectedItems((prev) => {
      const exists = prev.some((entry) => entry.serviceId === selectedServiceId);
      if (exists) return prev.filter((entry) => entry.serviceId !== selectedServiceId);
      return [...prev, { serviceId: selectedServiceId, quantity: 1 }];
    });
  };

  const changeQuantity = (selectedServiceId, delta) => {
    setSelectedItems((prev) =>
      prev.map((entry) =>
        entry.serviceId === selectedServiceId
          ? { ...entry, quantity: Math.max(1, entry.quantity + delta) }
          : entry,
      ),
    );
  };

  const selectedServiceDetails = useMemo(
    () =>
      selectedItems
        .map((entry) => {
          const selectedService = services.find((item) => item.id === entry.serviceId);
          if (!selectedService) return null;
          return {
            id: selectedService.id,
            name: selectedService.name,
            category: selectedService.category,
            price: selectedService.price,
            quantity: entry.quantity,
            total: selectedService.price * entry.quantity,
          };
        })
        .filter(Boolean),
    [selectedItems, services],
  );

  const subtotal = selectedServiceDetails.reduce((sum, item) => sum + item.total, 0);
  const serviceCharge = selectedServiceDetails.length > 0 ? 99 : 0;
  
  const gstTax = useMemo(() => {
    return Math.round(subtotal * 0.05); // 5% GST Tax
  }, [subtotal]);

  const totalPayment = useMemo(() => {
    return Math.max(0, subtotal + serviceCharge + gstTax);
  }, [subtotal, serviceCharge, gstTax]);

  const handleConfirm = async () => {
    setError('');
    const trimmedContact = contactNumber.trim();
    const trimmedAddress = address.trim();
    const trimmedDate = date.trim();
    const trimmedTime = time.trim();

    if (!dateRegex.test(trimmedDate)) {
      setError('Use date format YYYY-MM-DD (example: 2026-05-10).');
      return;
    }

    if (!timeRegex.test(trimmedTime)) {
      setError('Use time format like 10:30 AM or 9:00 PM.');
      return;
    }

    const minutes = parseTimeToMinutes(trimmedTime);
    const startMinutes = 8 * 60;
    const endMinutes = 21 * 60;
    if (minutes === null || minutes < startMinutes || minutes > endMinutes) {
      setError('Services are available only from 8:00 AM to 9:00 PM.');
      return;
    }

    if (!trimmedContact) {
      setError('Please enter your contact number.');
      return;
    }

    if (!isValidContactNumber(trimmedContact)) {
      setError('Enter a valid contact number (example: 03001234567).');
      return;
    }

    if (!trimmedAddress) {
      setError('Please enter your address before confirming booking.');
      return;
    }

    if (trimmedAddress.length < 10) {
      setError('Please enter a complete address (at least 10 characters).');
      return;
    }

    if (selectedServiceDetails.length === 0) {
      setError('Please add at least one service to continue.');
      return;
    }

    setLoading(true);
    try {
      const result = await addBooking({
        date: trimmedDate,
        time: trimmedTime,
        contactNumber: trimmedContact,
        address: trimmedAddress,
        paymentMethod,
        services: selectedServiceDetails,
        subtotal,
        serviceCharge,
        totalPayment,
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccessBooking(result.booking);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScreenContainer scroll topPadding={12} scrollContentStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.layout, isDesktop && styles.layoutDesktop]}>
          <View style={styles.mainColumn}>
            <Text style={styles.title}>Booking Details</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.card}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>Rs. {service.price}</Text>
            </View>

            <Text style={styles.label}>Select Multiple Services (optional)</Text>
            <View style={styles.selectWrap}>
              {additionalOptions.map((option) => {
                const isSelected = selectedItems.some((entry) => entry.serviceId === option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.selectChip, isSelected && styles.selectChipActive]}
                    onPress={() => toggleService(option.id)}
                    disabled={loading}>
                    <Text style={[styles.selectChipText, isSelected && styles.selectChipTextActive]}>{option.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Quantity</Text>
            <View style={styles.summaryBox}>
              {selectedServiceDetails.map((item) => (
                <View key={item.id} style={styles.quantityRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quantityService}>{item.name}</Text>
                    <Text style={styles.quantityPrice}>Rs. {item.price} each</Text>
                  </View>
                  <View style={styles.stepperWrap}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => changeQuantity(item.id, -1)}
                      disabled={loading}>
                      <Text style={styles.stepperText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepperValue}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => changeQuantity(item.id, 1)}
                      disabled={loading}>
                      <Text style={styles.stepperText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.label}>Select Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.subText}
              cursorColor={COLORS.primary}
              selectionColor={COLORS.primary}
              editable={!loading}
            />

            <Text style={styles.label}>Select Time</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="10:30 AM"
              placeholderTextColor={COLORS.subText}
              cursorColor={COLORS.primary}
              selectionColor={COLORS.primary}
              editable={!loading}
            />
            <Text style={styles.hintText}>Available timing: 8:00 AM to 9:00 PM</Text>

            <Text style={styles.label}>Contact Number</Text>
            <TextInput
              style={styles.input}
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="03001234567"
              placeholderTextColor={COLORS.subText}
              keyboardType="phone-pad"
              cursorColor={COLORS.primary}
              selectionColor={COLORS.primary}
              editable={!loading}
            />
            <Text style={styles.hintText}>We'll call this number for booking updates.</Text>

            <Text style={styles.label}>Service Address</Text>
            <TextInput
              style={[styles.input, styles.multiInput]}
              value={address}
              onChangeText={setAddress}
              multiline
              placeholder="House, street, city"
              placeholderTextColor={COLORS.subText}
              cursorColor={COLORS.primary}
              selectionColor={COLORS.primary}
              editable={!loading}
            />

            {/* Payment Method Selector */}
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.paymentSelectorWrap}>
              {[
                { id: 'Cash on Service', label: 'Cash', icon: 'cash-outline' },
                { id: 'Card', label: 'Card Payment', icon: 'card-outline' },
                { id: 'Wallet', label: 'Digital Wallet', icon: 'wallet-outline' }
              ].map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[styles.paymentChip, isSelected && styles.paymentChipActive]}
                    onPress={() => setPaymentMethod(method.id)}
                    disabled={loading}>
                    <Ionicons name={method.icon} size={15} color={isSelected ? COLORS.white : COLORS.subText} />
                    <Text style={[styles.paymentChipText, isSelected && styles.paymentChipTextActive]}>{method.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Cancellation Policy Notice */}
            <View style={styles.policyBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.policyTitle}>Cancellation Policy</Text>
                <Text style={styles.policyText}>Bookings can be cancelled up to 2 hours before the scheduled time for a 100% refund.</Text>
              </View>
            </View>
          </View>

          <View style={[styles.sideColumn, isDesktop && styles.sideColumnDesktop]}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Detailed Tax Invoice</Text>
              <Text style={styles.summaryLine}>Services Selected: {selectedServiceDetails.length}</Text>
              <Text style={styles.summaryLine}>Scheduled Date: {date}</Text>
              <Text style={styles.summaryLine}>Scheduled Time: {time}</Text>
              <Text style={styles.summaryLine}>Contact Phone: {contactNumber || '—'}</Text>
              <Text style={styles.summaryLine}>Payment: {paymentMethod}</Text>
              <View style={styles.invoiceDivider} />
              <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Subtotal</Text><Text style={styles.invoiceValue}>Rs. {subtotal}</Text></View>
              <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>Service Fee</Text><Text style={styles.invoiceValue}>Rs. {serviceCharge}</Text></View>
              <View style={styles.invoiceRow}><Text style={styles.invoiceLabel}>GST Tax (5%)</Text><Text style={styles.invoiceValue}>Rs. {gstTax}</Text></View>
              <View style={styles.invoiceDivider} />
              <View style={styles.invoiceRow}><Text style={styles.totalLabel}>Total Payment</Text><Text style={styles.totalValue}>Rs. {totalPayment}</Text></View>
            </View>

            <Pressable
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Booking</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScreenContainer>

      <BookingSuccessModal
        visible={Boolean(successBooking)}
        booking={successBooking}
        onViewBookings={() => {
          setSuccessBooking(null);
          router.replace('/my-bookings');
        }}
        onGoHome={() => {
          setSuccessBooking(null);
          router.replace('/(tabs)/home');
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 26,
  },
  layout: {
    gap: 12,
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  mainColumn: {
    flex: 1,
  },
  sideColumn: {
    width: '100%',
  },
  sideColumnDesktop: {
    width: 340,
    flexShrink: 0,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...SHADOW,
  },
  serviceName: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
  servicePrice: {
    marginTop: 5,
    color: COLORS.primary,
    fontWeight: '700',
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: COLORS.text,
    fontWeight: '700',
  },
  selectWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  selectChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  selectChipText: {
    color: COLORS.subText,
    fontSize: 12,
    fontWeight: '600',
  },
  selectChipTextActive: {
    color: COLORS.text,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quantityService: {
    color: COLORS.text,
    fontWeight: '700',
  },
  quantityPrice: {
    color: COLORS.subText,
    marginTop: 2,
    fontSize: 12,
  },
  stepperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 18,
  },
  stepperValue: {
    color: COLORS.text,
    fontWeight: '700',
    minWidth: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.white,
    color: COLORS.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  multiInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  hintText: {
    marginTop: 5,
    color: COLORS.subText,
    fontSize: 12,
  },
  summaryBox: {
    marginTop: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
  },
  summaryTitle: {
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: 7,
  },
  summaryLine: {
    color: COLORS.subText,
    marginBottom: 4,
    fontSize: 13,
  },
  totalLine: {
    color: COLORS.text,
    marginTop: 6,
    fontWeight: '800',
  },
  confirmBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  paymentSelectorWrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  paymentChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
  },
  paymentChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentChipText: {
    fontSize: 12,
    color: COLORS.subText,
    fontWeight: '700',
  },
  paymentChipTextActive: {
    color: COLORS.white,
  },
  promoInputWrap: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  promoInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    color: COLORS.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  promoBtn: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  promoBtnApplied: {
    backgroundColor: COLORS.success,
  },
  promoBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  policyBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  policyText: {
    fontSize: 11,
    color: COLORS.subText,
    lineHeight: 15,
    marginTop: 2,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  invoiceLabel: {
    fontSize: 13,
    color: COLORS.subText,
    fontWeight: '600',
  },
  invoiceValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '800',
  },
});
