import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, SHADOW } from '../constants/appTheme';
import { DEFAULT_SERVICE_IMAGE } from '../constants/images';
import { useResponsive } from '../hooks/useResponsive';

export default function BannerSlider({ banners }) {
  const { bannerWidth, isDesktop } = useResponsive();

  return (
    <FlatList
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      data={banners}
      keyExtractor={(item) => item.id}
      snapToInterval={bannerWidth + 12}
      decelerationRate="fast"
      renderItem={({ item }) => (
        <View style={[styles.banner, { width: bannerWidth }, isDesktop && styles.bannerDesktop]}>
          {(() => {
            const rawSource = item.image || DEFAULT_SERVICE_IMAGE;
            const imgSource = typeof rawSource === 'string' ? { uri: rawSource } : rawSource;
            return (
              <Image
                source={imgSource}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={250}
                placeholder={{ color: COLORS.primaryLight }}
              />
            );
          })()}
          <View style={[styles.overlay, isDesktop && styles.overlayDesktop]}>
            <Text style={styles.bannerTitle}>{item.title}</Text>
            <Text style={styles.bannerSub}>{item.subtitle}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    marginRight: 12,
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 150,
    ...SHADOW,
  },
  bannerDesktop: {
    minHeight: 250,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    backgroundColor: 'rgba(10, 14, 28, 0.55)',
    minHeight: 150,
  },
  overlayDesktop: {
    minHeight: 250,
    padding: 24,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  bannerSub: {
    color: COLORS.bannerSubText,
    marginTop: 8,
    fontSize: 13,
  },
});
