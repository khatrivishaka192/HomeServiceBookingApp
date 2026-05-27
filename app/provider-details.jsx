import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOW } from '../constants/appTheme';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';

export default function ProviderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const providerIdParam = Array.isArray(params.providerId) ? params.providerId[0] : params.providerId;
  const { getToken } = useAuth();

  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProviderAndReviews = useCallback(async () => {
    if (!providerIdParam) return;

    try {
      setLoading(true);
      setError('');
      
      // 1. Fetch provider details
      const provRes = await fetch(`${API_BASE_URL}/providers/${providerIdParam}`);
      const provData = await provRes.json();
      
      if (provRes.status === 200 && provData.success) {
        setProvider(provData.provider);
      } else {
        setError(provData.message || 'Could not load provider profile.');
        setLoading(false);
        return;
      }

      // 2. Fetch provider reviews
      const revRes = await fetch(`${API_BASE_URL}/reviews/provider/${providerIdParam}`);
      const revData = await revRes.json();

      if (revRes.status === 200 && revData.success) {
        setReviews(revData.reviews || []);
      }
    } catch (err) {
      console.log('[Load Provider Details Error]', err);
      setError('Server is offline. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [providerIdParam]);

  useEffect(() => {
    loadProviderAndReviews();
  }, [loadProviderAndReviews]);

  const renderStars = (rating) => {
    const starArray = [];
    const floorRating = Math.floor(rating || 5);
    for (let i = 1; i <= 5; i++) {
      starArray.push(
        <Ionicons
          key={i}
          name={i <= floorRating ? 'star' : 'star-outline'}
          size={14}
          color="#FBBF24"
        />
      );
    }
    return starArray;
  };

  const getAvailabilityColor = (status) => {
    switch (status) {
      case 'Available':
        return COLORS.success;
      case 'Busy':
        return COLORS.danger;
      default:
        return COLORS.subText;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !provider) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Provider not found.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScreenContainer fill topPadding={12}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Provider Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <View style={styles.profileHeader}>
            <Image
              source={{ uri: provider.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150' }}
              style={styles.avatar}
            />
            <Text style={styles.name}>{provider.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.pillBadge}>
                <Text style={styles.pillBadgeText}>{provider.category}</Text>
              </View>
              <View style={[styles.pillBadge, { backgroundColor: getAvailabilityColor(provider.availability) + '18' }]}>
                <Text style={[styles.pillBadgeText, { color: getAvailabilityColor(provider.availability) }]}>
                  {provider.availability}
                </Text>
              </View>
            </View>

            <View style={styles.metricsBox}>
              <View style={styles.metricItem}>
                <View style={styles.metricIconWrap}>
                  <Ionicons name="star" size={16} color="#FBBF24" />
                </View>
                <Text style={styles.metricVal}>{provider.rating}</Text>
                <Text style={styles.metricLbl}>{provider.reviewsCount} Reviews</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metricItem}>
                <View style={styles.metricIconWrap}>
                  <Ionicons name="construct" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.metricVal}>{provider.experience.split(' ')[0]}+ Yrs</Text>
                <Text style={styles.metricLbl}>Experience</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.metricItem}>
                <View style={styles.metricIconWrap}>
                  <Ionicons name="checkmark-done" size={16} color="#34D399" />
                </View>
                <Text style={styles.metricVal}>{provider.completedJobs}</Text>
                <Text style={styles.metricLbl}>Jobs Done</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Specialized Skills</Text>
            <View style={styles.skillsWrap}>
              {provider.skills?.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Text style={styles.skillTagText}>{skill}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Recent Reviews ({reviews.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyReviews}>
            <Ionicons name="chatbox-ellipses-outline" size={32} color={COLORS.mutedIcon} />
            <Text style={styles.emptyReviewsTitle}>No reviews yet</Text>
            <Text style={styles.emptyReviewsText}>This provider has completed jobs recently. Rating reviews will appear here once submitted by users.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerCircle}>
                <Text style={styles.reviewerLetter}>{item.userName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewerName}>{item.userName}</Text>
                <Text style={styles.reviewTime}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.starsRow}>{renderStars(item.rating)}</View>
            </View>
            {item.comment ? <Text style={styles.reviewComment}>{item.comment}</Text> : null}
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => router.push({ pathname: '/booking', params: { serviceId: provider.category.toLowerCase() } })}>
          <Text style={styles.bookBtnText}>Book Services Now</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.border,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 10,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 16,
  },
  pillBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillBadgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    width: '100%',
    ...SHADOW,
    marginBottom: 20,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 99,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  metricLbl: {
    fontSize: 10,
    color: COLORS.subText,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: COLORS.border,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 8,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
    marginBottom: 20,
  },
  skillTag: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillTagText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    ...SHADOW,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerLetter: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 14,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  reviewTime: {
    fontSize: 10,
    color: COLORS.subText,
    marginTop: 1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 16,
  },
  emptyReviews: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    ...SHADOW,
  },
  emptyReviewsTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyReviewsText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.subText,
    textAlign: 'center',
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    ...SHADOW,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
