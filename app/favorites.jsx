import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SHADOW } from '../constants/appTheme';
import ScreenContainer from '../components/ScreenContainer';
import { useBookings } from '../context/BookingsContext';
import { services } from '../data/services';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, toggleFavoriteService } = useBookings();

  // Filter static services to display saved favorites
  const favoriteServices = services.filter((item) => favorites.includes(item.id));

  return (
    <ScreenContainer fill topPadding={12}>
      <Text style={styles.title}>Saved Services</Text>
      <Text style={styles.subtitle}>Quick-access list of your favorite home repairs and cleaning services.</Text>

      <FlatList
        style={styles.list}
        data={favoriteServices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, favoriteServices.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="heart-dislike-outline" size={48} color={COLORS.mutedIcon} />
            <Text style={styles.emptyTitle}>No saved services yet</Text>
            <Text style={styles.emptyText}>Tap the heart icon on any service details card to save it here for quick rebooking.</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.replace('/(tabs)/home')}>
              <Text style={styles.exploreBtnText}>Explore Services</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150' }} style={styles.image} />
            <View style={styles.body}>
              <View style={styles.cardHeader}>
                <Text style={styles.category}>{item.category.toUpperCase()}</Text>
                <TouchableOpacity onPress={() => toggleFavoriteService(item.id)}>
                  <Ionicons name="heart" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.description} numberOfLines={2}>{item.description || 'Professional home service completed by our verified expert experts.'}</Text>
              <View style={styles.bottomRow}>
                <Text style={styles.price}>Rs. {item.price}</Text>
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => router.push({ pathname: '/booking', params: { serviceId: item.id } })}>
                  <Text style={styles.bookBtnText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
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
  listContent: {
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
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
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    ...SHADOW,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
    ...SHADOW,
  },
  image: {
    width: 90,
    height: '100%',
    minHeight: 110,
    borderRadius: 12,
    backgroundColor: COLORS.border,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  description: {
    color: COLORS.subText,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
