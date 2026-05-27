import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBookings } from '../context/BookingsContext';
import { COLORS } from '../constants/appTheme';
import AppImage from '../components/AppImage';
import ScreenContainer from '../components/ScreenContainer';
import { useResponsive } from '../hooks/useResponsive';

export default function ServiceDetailsScreen() {
  const { serviceId } = useLocalSearchParams();
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const { services } = useBookings();

  const service = useMemo(() => {
    return services.map(s => ({
      id: s.serviceId,
      name: s.name,
      category: s.category,
      description: s.description,
      price: s.price,
      image: s.image
    })).find((item) => item.id === serviceId) || {
      id: '',
      name: 'Service Details',
      category: 'General',
      description: 'Loading service details...',
      price: 0,
      image: ''
    };
  }, [services, serviceId]);

  return (
    <ScreenContainer scroll topPadding={0} contentStyle={styles.contentWrap}>
      <AppImage uri={service.image} style={[styles.image, isDesktop && styles.imageDesktop]} />
      <View style={[styles.content, isDesktop && styles.contentDesktop]}>
        <Text style={styles.name}>{service.name}</Text>
        <Text style={styles.category}>{service.category}</Text>
        <Text style={styles.description}>{service.description}</Text>
        <Text style={styles.price}>Starting from Rs. {service.price}</Text>

        <TouchableOpacity
          style={[styles.bookBtn, isDesktop && styles.bookBtnDesktop]}
          onPress={() => router.push({ pathname: '/booking', params: { serviceId: service.id } })}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  image: {
    width: '100%',
    height: 250,
  },
  imageDesktop: {
    height: 360,
    borderRadius: 20,
    marginBottom: 16,
  },
  content: {
    marginTop: -18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  contentDesktop: {
    marginTop: 0,
    borderRadius: 20,
  },
  name: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
  },
  category: {
    marginTop: 6,
    color: COLORS.primary,
    fontWeight: '700',
  },
  ratingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rating: {
    color: COLORS.text,
    fontWeight: '600',
  },
  description: {
    marginTop: 14,
    color: COLORS.subText,
    lineHeight: 22,
  },
  price: {
    marginTop: 18,
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 19,
  },
  bookBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  bookBtnDesktop: {
    maxWidth: 280,
    alignSelf: 'flex-start',
  },
  bookBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
