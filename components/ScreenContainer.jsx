import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/appTheme';
import { MAX_CONTENT_WIDTH } from '../utils/responsive';
import { useResponsive } from '../hooks/useResponsive';

export default function ScreenContainer({
  children,
  scroll = false,
  center = false,
  style,
  contentStyle,
  scrollContentStyle,
  showsVerticalScrollIndicator = false,
  topPadding,
  fill = false,
  keyboardShouldPersistTaps,
}) {
  const { paddingHorizontal, paddingTop: defaultPaddingTop } = useResponsive();
  const paddingTop = topPadding ?? defaultPaddingTop;

  const inner = (
    <View
      style={[
        styles.inner,
        { paddingHorizontal, paddingTop },
        center && styles.centeredInner,
        fill && styles.fill,
        contentStyle,
      ]}>
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={styles.outer}
        contentContainerStyle={[styles.scrollContent, style, scrollContentStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}>
        <View style={styles.centerWrap}>{inner}</View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.outer, style]}>
      <View style={styles.centerWrap}>{inner}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerWrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
  },
  centeredInner: {
    alignSelf: 'center',
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
