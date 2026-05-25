import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { COLORS } from '../constants/appTheme';
import ScreenContainer from '../components/ScreenContainer';
import { useResponsive } from '../hooks/useResponsive';

export default function SettingsScreen() {
  const { isDesktop } = useResponsive();

  return (
    <ScreenContainer topPadding={12}>
      <Text style={styles.title}>Settings</Text>

      <View style={[styles.item, isDesktop && styles.itemDesktop]}>
        <Text style={styles.label}>Push Notifications</Text>
        <Switch value />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  item: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDesktop: {
    maxWidth: 520,
  },
  label: {
    color: COLORS.text,
    fontWeight: '600',
  },
});
