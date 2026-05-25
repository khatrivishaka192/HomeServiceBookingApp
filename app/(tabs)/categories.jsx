import React from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { categories } from '../../data/services';
import { COLORS } from '../../constants/appTheme';
import CategoryCard from '../../components/CategoryCard';
import ScreenContainer from '../../components/ScreenContainer';
import { useResponsive } from '../../hooks/useResponsive';

export default function CategoriesScreen() {
  const router = useRouter();
  const { categoryColumns, categoryGap } = useResponsive();

  const openCategory = (item) => {
    router.push({ pathname: '/category-services', params: { categoryId: item.id, categoryName: item.name } });
  };

  return (
    <ScreenContainer fill>
      <Text style={styles.title}>All Service Categories</Text>
      <FlatList
        style={styles.list}
        data={categories}
        numColumns={categoryColumns}
        key={`all-categories-${categoryColumns}`}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={[styles.columnWrap, { gap: categoryGap }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <CategoryCard item={item} onPress={openCategory} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 16,
  },
  columnWrap: {
    justifyContent: 'flex-start',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
});
