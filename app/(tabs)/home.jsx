import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { banners, categories, services } from '../../data/services';
import { COLORS } from '../../constants/appTheme';
import CategoryCard from '../../components/CategoryCard';
import ServiceCard from '../../components/ServiceCard';
import AppImage from '../../components/AppImage';
import BannerSlider from '../../components/BannerSlider';
import { HERO_HOME_IMAGE } from '../../constants/images';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { categoryColumns, categoryGap, heroHeight } = useResponsive();
  const [searchText, setSearchText] = useState('');
  const popularServices = useMemo(
    () =>
      [
        services.find((item) => item.id === 's2'),
        services.find((item) => item.id === 's3'),
        services.find((item) => item.id === 's1'),
        ...services.filter((item) => !['s1', 's2', 's3'].includes(item.id)).slice(0, 5),
      ].filter(Boolean),
    [],
  );
  const normalizedQuery = searchText.trim().toLowerCase();
  const matchesQuery = (item) =>
    item.name.toLowerCase().includes(normalizedQuery) ||
    item.category.toLowerCase().includes(normalizedQuery) ||
    item.description.toLowerCase().includes(normalizedQuery);

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return categories;
    return categories.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
  }, [normalizedQuery]);

  const filteredPopularServices = useMemo(() => {
    if (!normalizedQuery) return popularServices;
    return popularServices.filter((item) => matchesQuery(item));
  }, [normalizedQuery, popularServices]);

  const filteredRecommendedServices = useMemo(() => {
    if (!normalizedQuery) return services.slice(0, 2);
    return services.filter((item) => matchesQuery(item));
  }, [normalizedQuery]);

  const openService = (item) => {
    router.push({ pathname: '/service-details', params: { serviceId: item.id } });
  };
  const openCategory = (item) => {
    router.push({ pathname: '/category-services', params: { categoryId: item.id, categoryName: item.name } });
  };

  return (
    <ScreenContainer scroll showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeBar}>
        <View>
          <Text style={styles.welcomeSmall}>Welcome back</Text>
          <Text style={styles.welcomeName}>{user?.name ?? 'Guest'}</Text>
        </View>
        <View style={styles.welcomeIcon}>
          <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
        </View>
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.locationLabel}>Current Location</Text>
          <Text style={styles.location}>Lahore, Pakistan</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.heroCard, { height: heroHeight }]}>
        <AppImage uri={HERO_HOME_IMAGE} style={styles.heroImageFill} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTitle}>Clean Home, Happy You</Text>
          <Text style={styles.heroSub}>Book verified professionals for every home need.</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => router.push('/(tabs)/categories')}>
            <Text style={styles.heroBtnText}>Explore Services</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={COLORS.subText} />
        <TextInput
          placeholder="Search category, service, or keyword..."
          placeholderTextColor={COLORS.subText}
          cursorColor={COLORS.primary}
          selectionColor={COLORS.primary}
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {normalizedQuery ? (
        <View>
          <Text style={styles.searchingText}>Showing results for "{searchText.trim()}"</Text>
          {filteredRecommendedServices.map((item) => (
            <ServiceCard key={item.id} item={item} compact onPress={openService} />
          ))}
          {filteredRecommendedServices.length === 0 && (
            <Text style={styles.emptyText}>No services match your search.</Text>
          )}
        </View>
      ) : (
        <>
          <BannerSlider banners={banners} />

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
              <Text style={styles.linkText}>View all</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            scrollEnabled={false}
            data={filteredCategories}
            keyExtractor={(item) => item.id}
            numColumns={categoryColumns}
            key={`categories-${categoryColumns}`}
            columnWrapperStyle={[styles.columnWrap, { gap: categoryGap }]}
            renderItem={({ item }) => <CategoryCard item={item} onPress={openCategory} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No categories match your search.</Text>}
          />

          <Text style={styles.sectionTitle}>Popular Services</Text>
          <FlatList
            horizontal
            data={filteredPopularServices}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <ServiceCard item={item} onPress={openService} />}
            ListEmptyComponent={<Text style={styles.emptyText}>No popular services found.</Text>}
          />

          <Text style={styles.sectionTitle}>Recommended For You</Text>
          {filteredRecommendedServices.map((item) => (
            <ServiceCard key={item.id} item={item} compact onPress={openService} />
          ))}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  welcomeBar: {
    marginBottom: 14,
    borderRadius: 18,
    padding: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSmall: {
    color: COLORS.subText,
    fontSize: 12,
  },
  welcomeName: {
    marginTop: 3,
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '800',
  },
  welcomeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationLabel: {
    color: COLORS.subText,
    fontSize: 12,
  },
  location: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroImageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 28, 0.46)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSub: {
    color: '#D5DEEE',
    marginTop: 5,
    marginBottom: 10,
  },
  heroBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    paddingVertical: 12,
    marginLeft: 8,
  },
  sectionHead: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  columnWrap: {
    justifyContent: 'flex-start',
  },
  emptyText: {
    color: COLORS.subText,
    paddingVertical: 8,
  },
  searchingText: {
    color: COLORS.subText,
    fontSize: 13,
    marginBottom: 10,
    fontStyle: 'italic',
  },
});
