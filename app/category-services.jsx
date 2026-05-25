import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ServiceCard from '../components/ServiceCard';
import ScreenContainer from '../components/ScreenContainer';
import { COLORS } from '../constants/appTheme';
import { getServicesByCategory } from '../data/services';
import { useResponsive } from '../hooks/useResponsive';

export default function CategoryServicesScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { isDesktop } = useResponsive();
  const categoryId = Array.isArray(params.categoryId) ? params.categoryId[0] : params.categoryId;
  const categoryName = Array.isArray(params.categoryName) ? params.categoryName[0] : params.categoryName;
  const filteredServices = getServicesByCategory(categoryId);

  const openService = (item) => {
    router.push({ pathname: '/service-details', params: { serviceId: item.id } });
  };

  return (
    <ScreenContainer fill topPadding={12}>
      <Text style={styles.title}>{categoryName}</Text>
      <Text style={styles.subtitle}>Choose a service option</Text>

      <FlatList
        style={styles.list}
        data={filteredServices}
        keyExtractor={(item) => item.id}
        numColumns={isDesktop ? 2 : 1}
        key={isDesktop ? 'grid' : 'list'}
        columnWrapperStyle={isDesktop ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) =>
          isDesktop ? (
            <View style={styles.gridItem}>
              <ServiceCard item={item} compact onPress={openService} />
            </View>
          ) : (
            <ServiceCard item={item} compact onPress={openService} />
          )
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No services found for this category.</Text>}
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
  gridRow: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    color: COLORS.subText,
    textAlign: 'center',
    marginTop: 40,
  },
});
