import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW } from '../constants/appTheme';
import { COMPANY, SUPPORT_OFFICE_IMAGE } from '../constants/images';
import ScreenContainer from '../components/ScreenContainer';
import { useResponsive } from '../hooks/useResponsive';

const contactItems = [
  {
    id: 'phone',
    icon: 'call-outline',
    title: 'Customer Support',
    value: COMPANY.phoneDisplay,
    action: () => Linking.openURL(`tel:${COMPANY.phone}`),
    hint: 'Call us for booking help',
  },
  {
    id: 'whatsapp',
    icon: 'logo-whatsapp',
    title: 'WhatsApp',
    value: COMPANY.phoneDisplay,
    action: () => Linking.openURL(`https://wa.me/${COMPANY.whatsapp.replace(/\D/g, '')}`),
    hint: 'Chat with our support team',
  },
  {
    id: 'email',
    icon: 'mail-outline',
    title: 'Email',
    value: COMPANY.email,
    action: () => Linking.openURL(`mailto:${COMPANY.email}`),
    hint: 'We reply within 24 hours',
  },
  {
    id: 'address',
    icon: 'location-outline',
    title: 'Office Address',
    value: COMPANY.address,
    action: null,
    hint: 'Visit by appointment only',
  },
];

export default function SupportScreen() {
  const { isDesktop } = useResponsive();

  return (
    <ScreenContainer scroll topPadding={12}>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>Get in touch with {COMPANY.name}</Text>

      <View style={styles.heroCard}>
        <Image source={{ uri: SUPPORT_OFFICE_IMAGE }} style={styles.heroImage} contentFit="cover" transition={250} />
        <View style={styles.heroOverlay}>
          <Text style={styles.companyName}>{COMPANY.name}</Text>
          <Text style={styles.companyTagline}>{COMPANY.tagline}</Text>
        </View>
      </View>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>About our company</Text>
        <Text style={styles.aboutText}>{COMPANY.description}</Text>
        <View style={styles.hoursBox}>
          <Ionicons name="time-outline" size={18} color={COLORS.primary} />
          <View style={styles.hoursTextWrap}>
            <Text style={styles.hoursLine}>{COMPANY.hours}</Text>
            <Text style={styles.hoursLineSub}>{COMPANY.sundayHours}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Contact information</Text>

      <View style={[styles.cards, isDesktop && styles.cardsDesktop]}>
        {contactItems.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.card, pressed && item.action && styles.cardPressed]}
            onPress={item.action || undefined}
            disabled={!item.action}>
            <View style={styles.cardIconWrap}>
              <Ionicons name={item.icon} size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSub}>{item.value}</Text>
            <Text style={styles.itemHint}>{item.hint}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
        <Text style={styles.noteText}>
          For urgent service requests, please call or WhatsApp us. Mention your booking ID from My Bookings for
          faster support.
        </Text>
      </View>
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
  heroCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    ...SHADOW,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: 'rgba(10, 14, 28, 0.5)',
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  companyTagline: {
    marginTop: 4,
    color: COLORS.bannerSubText,
    fontSize: 14,
  },
  aboutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...SHADOW,
  },
  aboutTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  aboutText: {
    color: COLORS.subText,
    fontSize: 14,
    lineHeight: 21,
  },
  hoursBox: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hoursTextWrap: {
    flex: 1,
  },
  hoursLine: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  hoursLineSub: {
    marginTop: 4,
    color: COLORS.subText,
    fontSize: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  cards: {
    gap: 12,
  },
  cardsDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    ...SHADOW,
    flex: 1,
    minWidth: 260,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    marginTop: 10,
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 16,
  },
  itemSub: {
    marginTop: 4,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  itemHint: {
    marginTop: 4,
    color: COLORS.subText,
    fontSize: 12,
  },
  noteCard: {
    marginTop: 16,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noteText: {
    flex: 1,
    color: COLORS.subText,
    fontSize: 13,
    lineHeight: 19,
  },
});
