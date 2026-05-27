import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { COLORS, SHADOW } from '../constants/appTheme';

const FEATURES = [
  { icon: 'sparkles-outline', text: 'Deep cleaning, plumbing, electrical & more' },
  { icon: 'shield-checkmark-outline', text: 'Verified professionals at your doorstep' },
  { icon: 'time-outline', text: 'Quick booking with transparent pricing' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, authReady } = useAuth();
  const { formMaxWidth, height } = useResponsive();
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (user?.isLoggedIn) {
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/(tabs)/home');
      }
      return;
    }

    fade.setValue(0);
    slide.setValue(20);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [user, authReady, router, fade, slide]);

  if (!authReady) {
    return (
      <View style={[styles.loadingScreen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScreenContainer
      scroll
      topPadding={0}
      showsVerticalScrollIndicator={false}
      contentStyle={[styles.content, { maxWidth: formMaxWidth }]}
      scrollContentStyle={[
        styles.scrollContent,
        {
          minHeight: height - insets.top - insets.bottom,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        },
      ]}>
      <Animated.View style={[styles.animatedWrap, { opacity: fade, transform: [{ translateY: slide }] }]}>
        <View style={styles.logoWrap}>
          <Ionicons name="home" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Your Home, Our Care</Text>
        <Text style={styles.description}>
          Book trusted home service experts for cleaning, repairs, and maintenance — all in one simple app.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((item, index) => (
            <View
              key={item.text}
              style={[styles.featureRow, index < FEATURES.length - 1 && styles.featureRowSpacing]}>
              <Ionicons name={item.icon} size={18} color={COLORS.primary} />
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.ctaHint}>Login or sign up to explore the app</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/login')} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/signup')} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>Sign Up</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  animatedWrap: {
    width: '100%',
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    color: COLORS.text,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    marginTop: 12,
    textAlign: 'center',
    color: COLORS.subText,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  features: {
    marginTop: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureRowSpacing: {
    marginBottom: 12,
  },
  featureText: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  ctaHint: {
    marginTop: 28,
    marginBottom: 14,
    textAlign: 'center',
    color: COLORS.subText,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOW,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    marginTop: 12,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});
