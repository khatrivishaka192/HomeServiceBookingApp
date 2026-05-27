import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../constants/appTheme';
import { useResponsive } from '../hooks/useResponsive';
import AppImage from './AppImage';

export default function ServiceCard({ item, onPress, compact = false }) {
  const { serviceCardWidth } = useResponsive();

  return (
    <Pressable
      style={[styles.card, compact ? styles.compactCard : { width: serviceCardWidth }]}
      onPress={() => onPress?.(item)}>
      <AppImage uri={item.image} style={[styles.image, compact && styles.compactImage]} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.category}>
          {item.category}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>Rs. {item.price}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 14,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    ...SHADOW,
  },
  compactCard: {
    width: '100%',
    marginRight: 0,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 130,
  },
  compactImage: {
    height: 140,
  },
  content: {
    padding: 12,
  },
  name: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 15,
  },
  category: {
    color: COLORS.subText,
    fontSize: 12,
    marginTop: 3,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rating: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
