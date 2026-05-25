import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../constants/appTheme';
import { DEFAULT_CATEGORY_IMAGE } from '../constants/images';
import { useResponsive } from '../hooks/useResponsive';
import AppImage from './AppImage';

export default function CategoryCard({ item, onPress, fullWidth = false }) {
  const { categoryCardWidth, isDesktop } = useResponsive();

  return (
    <Pressable
      style={[
        styles.card,
        fullWidth ? styles.fullWidth : { width: categoryCardWidth },
        isDesktop && styles.cardDesktop,
      ]}
      onPress={() => onPress?.(item)}>
      <View style={styles.image}>
        <AppImage uri={item.image} style={styles.imageFill} fallbackUri={DEFAULT_CATEGORY_IMAGE} />
        <View style={styles.imageOverlay}>
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={18} color={COLORS.primary} />
          </View>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.title}>
        {item.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 10,
    marginBottom: 14,
    ...SHADOW,
  },
  fullWidth: {
    width: '100%',
  },
  cardDesktop: {
    padding: 12,
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  imageFill: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: 'rgba(10, 14, 28, 0.2)',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
