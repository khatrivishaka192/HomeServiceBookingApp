import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOW } from '../../constants/appTheme';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const { getToken, logoutUser } = useAuth();
  const { isDesktop } = useResponsive();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All'); // All, customer, provider, admin
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Selected User for history modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsModalVisible, setBookingsModalVisible] = useState(false);

  const fetchUsers = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (pageNum === 1 && !isRefresh) setLoading(true);
    setError('');

    try {
      const token = await getToken();
      const roleQuery = roleFilter !== 'All' ? `&role=${roleFilter}` : '';
      const searchQuery = search ? `&query=${encodeURIComponent(search)}` : '';
      const url = `${API_BASE_URL}/admin/users?page=${pageNum}&limit=10${roleQuery}${searchQuery}`;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        if (pageNum === 1) {
          setUsers(data.users);
        } else {
          setUsers(prev => [...prev, ...data.users]);
        }
        setTotalPages(data.pagination.pages);
        setPage(pageNum);
      } else {
        setError(data.message || 'Failed to load users.');
        if (res.status === 401 || res.status === 403) {
          logoutUser();
        }
      }
    } catch (err) {
      console.error('[Fetch Users Error]', err);
      setError('Connection to backend failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, roleFilter, search, logoutUser]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(1, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchUsers(page + 1);
    }
  };

  // Block or Unblock user
  const handleToggleStatus = async (userItem) => {
    const nextStatus = userItem.status === 'blocked' ? 'active' : 'blocked';
    const alertMsg = `Are you sure you want to ${nextStatus === 'blocked' ? 'BLOCK' : 'UNBLOCK'} ${userItem.name}?`;

    const performToggle = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/admin/users/${userItem.id}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: nextStatus }),
        });

        const data = await res.json();
        if (res.status === 200 && data.success) {
          // Update local state
          setUsers(prev =>
            prev.map(u => (u.id === userItem.id ? { ...u, status: nextStatus } : u))
          );
        } else {
          Alert.alert('Error', data.message || 'Could not update user status.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to communicate with server.');
      }
    };

    Alert.alert('Confirm Status Change', alertMsg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, Proceed', onPress: performToggle },
    ]);
  };

  // Delete User
  const handleDeleteUser = async (userItem) => {
    const performDelete = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/admin/users/${userItem.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();
        if (res.status === 200 && data.success) {
          setUsers(prev => prev.filter(u => u.id !== userItem.id));
        } else {
          Alert.alert('Error', data.message || 'Could not delete user.');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to connect to server.');
      }
    };

    Alert.alert('DELETE USER', `This action is PERMANENT. Are you sure you want to delete ${userItem.name} (${userItem.email})?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'DELETE', style: 'destructive', onPress: performDelete },
    ]);
  };

  // View User Bookings History
  const handleViewBookings = async (userItem) => {
    setSelectedUser(userItem);
    setBookingsModalVisible(true);
    setLoadingBookings(true);
    setUserBookings([]);

    try {
      const token = await getToken();
      // Fetch all bookings and filter locally
      const res = await fetch(`${API_BASE_URL}/admin/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        const filtered = data.bookings.filter(b => b.userId === userItem.id);
        setUserBookings(filtered);
      }
    } catch (err) {
      console.error('[Fetch User Bookings Error]', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const renderUserItem = ({ item }) => {
    const isBlocked = item.status === 'blocked';
    return (
      <View style={styles.userCard}>
        <View style={styles.cardMain}>
          <View style={[styles.avatarBg, item.role === 'admin' && styles.avatarAdmin]}>
            <Ionicons
              name={item.role === 'provider' ? 'construct-outline' : item.role === 'admin' ? 'shield-outline' : 'person-outline'}
              size={20}
              color={item.role === 'admin' ? COLORS.accent : COLORS.primary}
            />
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.roleBadge, item.role === 'admin' && styles.roleAdmin]}>
                <Text style={styles.roleText}>{item.role}</Text>
              </View>
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
            {item.phone ? <Text style={styles.userPhone}>{item.phone}</Text> : null}
            <Text style={styles.joinDate}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.actionsBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewBookings(item)}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, isBlocked && styles.unblockAction]}
            onPress={() => handleToggleStatus(item)}>
            <Ionicons
              name={isBlocked ? 'lock-open-outline' : 'lock-closed-outline'}
              size={16}
              color={isBlocked ? COLORS.success : COLORS.warning}
            />
            <Text style={[styles.actionBtnText, { color: isBlocked ? COLORS.success : COLORS.warning }]}>
              {isBlocked ? 'Unblock' : 'Block'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteUser(item)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color={COLORS.subText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users name, email, phone..."
            placeholderTextColor={COLORS.subText}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close" size={18} color={COLORS.subText} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Role Filters Tabs */}
      <View style={styles.filterTabs}>
        {['All', 'customer', 'provider', 'admin'].map(role => (
          <TouchableOpacity
            key={role}
            style={[styles.tab, roleFilter === role && styles.tabActive]}
            onPress={() => setRoleFilter(role)}>
            <Text style={[styles.tabText, roleFilter === role && styles.tabTextActive]}>
              {role.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={[styles.listContent, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%' }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={48} color={COLORS.subText} />
              <Text style={styles.emptyText}>No users match your criteria.</Text>
            </View>
          }
        />
      )}

      {/* Bookings History Modal */}
      <Modal
        visible={bookingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBookingsModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, isDesktop && { maxWidth: 600 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Booking History</Text>
                <Text style={styles.modalSub}>{selectedUser?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setBookingsModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            {loadingBookings ? (
              <ActivityIndicator style={{ margin: 32 }} color={COLORS.primary} />
            ) : (
              <FlatList
                data={userBookings}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.bookingsList}
                renderItem={({ item }) => (
                  <View style={styles.bookingRow}>
                    <View style={styles.bookingRowHeader}>
                      <Text style={styles.bookingRowTitle}>{item.serviceType}</Text>
                      <Text style={styles.bookingRowAmount}>${item.price}</Text>
                    </View>
                    <Text style={styles.bookingRowDate}>Date: {item.date} at {item.time}</Text>
                    <View style={styles.bookingRowFooter}>
                      <Text style={styles.bookingRowId}>ID: {item.bookingId}</Text>
                      <View style={[styles.statusTextBadge, styles[`statusTextBadge${item.status}`]]}>
                        <Text style={styles.statusTextVal}>{item.status}</Text>
                      </View>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyText}>No bookings placed by this account yet.</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBarWrapper: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    color: COLORS.subText,
    fontSize: 11,
    fontWeight: '800',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
    ...SHADOW,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarAdmin: {
    backgroundColor: COLORS.accent + '20',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    marginRight: 6,
  },
  roleBadge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleAdmin: {
    backgroundColor: COLORS.accent + '20',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 2,
  },
  joinDate: {
    fontSize: 10,
    color: COLORS.subText,
    marginTop: 6,
  },
  actionsBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  unblockAction: {
    backgroundColor: 'transparent',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.subText,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 2,
  },
  bookingsList: {
    paddingBottom: 24,
  },
  bookingRow: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bookingRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  bookingRowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  bookingRowDate: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 4,
  },
  bookingRowFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  bookingRowId: {
    fontSize: 10,
    color: COLORS.subText,
  },
  statusTextBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusTextVal: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
  },
  statusTextBadgePending: { backgroundColor: COLORS.warning },
  statusTextBadgeConfirmed: { backgroundColor: COLORS.primary },
  statusTextBadgeAccepted: { backgroundColor: COLORS.primary },
  statusTextBadgeCompleted: { backgroundColor: COLORS.success },
  statusTextBadgeCancelled: { backgroundColor: COLORS.danger },
  statusTextBadgeInProgress: { backgroundColor: COLORS.accent },
});
