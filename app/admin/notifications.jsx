import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOW } from '../../constants/appTheme';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function AdminNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { getToken, logoutUser } = useAuth();
  const { isDesktop } = useResponsive();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await getToken();
      
      // 1. Fetch all notifications
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setNotifications(data.notifications);
      } else {
        if (res.status === 401 || res.status === 403) {
          logoutUser();
        }
      }

      // 2. Fetch unread count
      const countRes = await fetch(`${API_BASE_URL}/notifications/unread/count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const countData = await countRes.json();
      if (countRes.status === 200 && countData.success) {
        setUnreadCount(countData.count);
      }
    } catch (err) {
      console.error('[Fetch Admin Notifications Error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, logoutUser]);

  useEffect(() => {
    fetchNotifications();

    // Auto-polling refresh every 30 seconds for live admin notification feeds!
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications(true);
  };

  const handleMarkAsRead = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        // Update local list
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[Mark Read Error]', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[Mark All Read Error]', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setNotifications(prev => {
          const removed = prev.find(n => n._id === id);
          if (removed && !removed.read) {
            setUnreadCount(c => Math.max(0, c - 1));
          }
          return prev.filter(n => n._id !== id);
        });
      }
    } catch (err) {
      console.error('[Delete Notification Error]', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return { name: 'calendar', color: COLORS.primary };
      case 'cancellation':
        return { name: 'close-circle', color: COLORS.danger };
      case 'assigned':
        return { name: 'people', color: COLORS.success };
      default:
        return { name: 'information-circle', color: COLORS.accent };
    }
  };

  const renderNotificationItem = ({ item }) => {
    const iconMeta = getNotificationIcon(item.type);
    return (
      <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
        <View style={[styles.iconBg, { backgroundColor: iconMeta.color + '15' }]}>
          <Ionicons name={iconMeta.name} size={20} color={iconMeta.color} />
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
            {!item.read ? <View style={styles.unreadDot} /> : null}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
        </View>

        <View style={styles.actionsWrap}>
          {!item.read ? (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleMarkAsRead(item._id)}>
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.success} />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteNotification(item._id)}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Alert Header Control */}
      <View style={styles.topControl}>
        <View style={styles.badgeRow}>
          <Ionicons name="notifications-outline" size={22} color={COLORS.primary} />
          <Text style={styles.topLabel}>
            {unreadCount > 0 ? `${unreadCount} Unread Notifications` : 'No Unread Notifications'}
          </Text>
        </View>
        
        {unreadCount > 0 ? (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderNotificationItem}
          contentContainerStyle={[styles.listContent, isDesktop && { maxWidth: 800, alignSelf: 'center', width: '100%' }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.subText} />
              <Text style={styles.emptyText}>No notifications found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topControl: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginLeft: 8,
  },
  markAllBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '800',
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
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    ...SHADOW,
  },
  unreadCard: {
    borderColor: COLORS.primary + '60',
    backgroundColor: COLORS.white,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.subText,
  },
  unreadText: {
    color: COLORS.text,
    fontWeight: '800',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  message: {
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 10,
    color: COLORS.subText,
    marginTop: 6,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: COLORS.subText,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
});
