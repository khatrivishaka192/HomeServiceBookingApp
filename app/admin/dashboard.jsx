import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOW } from '../../constants/appTheme';
import ScreenContainer from '../../components/ScreenContainer';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logoutUser, getToken } = useAuth();
  const { isDesktop, formMaxWidth } = useResponsive();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setError('');
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to fetch admin stats.');
        if (res.status === 401 || res.status === 403) {
          logoutUser();
        }
      }
    } catch (err) {
      console.error('[Dashboard Stats Error]', err);
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, logoutUser]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatCurrency = (value) => {
    return `$` + Number(value || 0).toLocaleString();
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const sections = [
    { label: 'Users', icon: 'people-outline', route: '/admin/users', color: '#3B82F6' },
    { label: 'Categories', icon: 'grid-outline', route: '/admin/categories', color: '#10B981' },
    { label: 'Services', icon: 'briefcase-outline', route: '/admin/services', color: '#F59E0B' },
    { label: 'Bookings', icon: 'calendar-outline', route: '/admin/bookings', color: '#8B5CF6' },
    { label: 'Alerts', icon: 'notifications-outline', route: '/admin/notifications', color: '#EF4444' },
  ];

  return (
    <View style={[styles.mainContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Admin Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Console</Text>
          <Text style={styles.headerSub}>Control panel & statistics</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, styles.logoutBtn]} onPress={logoutUser}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isDesktop && { maxWidth: 1100, alignSelf: 'center', width: '100%' }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={24} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.grid}>
          <View style={[styles.card, styles.doubleWidth]}>
            <Text style={styles.cardHeader}>Total Revenue</Text>
            <Text style={[styles.cardVal, { color: COLORS.success }]}>{formatCurrency(stats?.revenueSummary)}</Text>
            <View style={styles.cardInfo}>
              <Ionicons name="trending-up-outline" size={14} color={COLORS.success} />
              <Text style={styles.cardInfoText}>Completed jobs earnings</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Bookings</Text>
            <Text style={styles.cardVal}>{stats?.totalBookings || 0}</Text>
            <View style={styles.cardInfo}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
              <Text style={styles.cardInfoText}>All requests</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Pending</Text>
            <Text style={[styles.cardVal, { color: COLORS.warning }]}>{stats?.pendingBookings || 0}</Text>
            <View style={styles.cardInfo}>
              <Ionicons name="time-outline" size={14} color={COLORS.warning} />
              <Text style={styles.cardInfoText}>Awaiting action</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Users</Text>
            <Text style={styles.cardVal}>{stats?.totalUsers || 0}</Text>
            <View style={styles.cardInfo}>
              <Ionicons name="people-outline" size={14} color={COLORS.accent} />
              <Text style={styles.cardInfoText}>Total members</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Services</Text>
            <Text style={styles.cardVal}>{stats?.totalServices || 0}</Text>
            <View style={styles.cardInfo}>
              <Ionicons name="briefcase-outline" size={14} color={COLORS.accent} />
              <Text style={styles.cardInfoText}>Active catalog</Text>
            </View>
          </View>
        </View>

        {/* Custom Visual Performance Charts */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Booking Breakdown</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.bullet, { backgroundColor: COLORS.success }]} />
                <Text style={styles.legendText}>Completed ({stats?.completedBookings || 0})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.bullet, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendText}>Pending ({stats?.pendingBookings || 0})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.bullet, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.legendText}>Cancelled ({stats?.cancelledBookings || 0})</Text>
              </View>
            </View>

            {/* Custom Bar Chart using Views */}
            {stats?.totalBookings > 0 ? (
              <View style={styles.barGraphContainer}>
                <View
                  style={[
                    styles.barSegment,
                    {
                      flex: stats.completedBookings || 0.001,
                      backgroundColor: COLORS.success,
                      borderTopLeftRadius: 8,
                      borderBottomLeftRadius: 8,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    {
                      flex: stats.pendingBookings || 0.001,
                      backgroundColor: COLORS.warning,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.barSegment,
                    {
                      flex: stats.cancelledBookings || 0.001,
                      backgroundColor: COLORS.danger,
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8,
                    },
                  ]}
                />
              </View>
            ) : (
              <Text style={styles.emptyText}>No booking statistics available yet.</Text>
            )}
          </View>
        </View>

        {/* Quick Access Grid Links */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Management Menu</Text>
          <View style={styles.menuGrid}>
            {sections.map((sec) => (
              <TouchableOpacity
                key={sec.label}
                style={styles.menuCard}
                onPress={() => router.push(sec.route)}>
                <View style={[styles.menuIconBg, { backgroundColor: sec.color + '15' }]}>
                  <Ionicons name={sec.icon} size={22} color={sec.color} />
                </View>
                <Text style={styles.menuLabel}>{sec.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/admin/bookings')}>
              <Text style={styles.seeAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {stats?.latestBookings && stats.latestBookings.length > 0 ? (
            stats.latestBookings.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.listItem}
                onPress={() => router.push({ pathname: '/admin/bookings', params: { highlightId: b.id } })}>
                <View style={styles.listIconBg}>
                  <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.listDetails}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {b.serviceType}
                  </Text>
                  <Text style={styles.listSub}>
                    ID: {b.bookingId} • {b.date}
                  </Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={styles.listAmount}>{formatCurrency(b.price)}</Text>
                  <View style={[styles.statusBadge, styles[`status${b.status}`]]}>
                    <Text style={[styles.statusText, styles[`statusText${b.status}`]]}>
                      {b.status}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent bookings found.</Text>
            </View>
          )}
        </View>

        {/* Recent Signups */}
        <View style={[styles.sectionWrap, { marginBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Users</Text>
            <TouchableOpacity onPress={() => router.push('/admin/users')}>
              <Text style={styles.seeAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {stats?.latestUsers && stats.latestUsers.length > 0 ? (
            stats.latestUsers.map((u) => (
              <View key={u.id} style={styles.listItem}>
                <View style={[styles.listIconBg, { backgroundColor: COLORS.primaryLight }]}>
                  <Ionicons name="person-outline" size={20} color={COLORS.accent} />
                </View>
                <View style={styles.listDetails}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {u.name}
                  </Text>
                  <Text style={styles.listSub} numberOfLines={1}>
                    {u.email}
                  </Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={styles.roleBadgeText}>{u.role.toUpperCase()}</Text>
                  <Text style={styles.userDate}>
                    {new Date(u.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent user signups found.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.subText,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  logoutBtn: {
    backgroundColor: COLORS.danger + '20',
  },
  scrollContent: {
    padding: 16,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  doubleWidth: {
    width: '100%',
  },
  cardHeader: {
    fontSize: 13,
    color: COLORS.subText,
    fontWeight: '600',
  },
  cardVal: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: 6,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfoText: {
    fontSize: 11,
    color: COLORS.subText,
    marginLeft: 4,
  },
  sectionWrap: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chartCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
  },
  barGraphContainer: {
    height: 16,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  barSegment: {
    height: '100%',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  menuIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW,
  },
  listIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listDetails: {
    flex: 1,
    marginLeft: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  listSub: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 2,
  },
  listRight: {
    alignItems: 'flex-end',
  },
  listAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPending: { backgroundColor: COLORS.warning + '20' },
  statusTextPending: { color: COLORS.warning },
  statusConfirmed: { backgroundColor: COLORS.primary + '20' },
  statusTextConfirmed: { color: COLORS.primary },
  statusAccepted: { backgroundColor: COLORS.primary + '20' },
  statusTextAccepted: { color: COLORS.primary },
  statusCompleted: { backgroundColor: COLORS.success + '20' },
  statusTextCompleted: { color: COLORS.success },
  statusCancelled: { backgroundColor: COLORS.danger + '20' },
  statusTextCancelled: { color: COLORS.danger },
  statusInProgress: { backgroundColor: COLORS.accent + '20' },
  statusTextInProgress: { color: COLORS.accent },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.accent,
  },
  userDate: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    color: COLORS.subText,
    fontSize: 13,
    fontWeight: '600',
  },
});
