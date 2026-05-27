import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SHADOW } from '../constants/appTheme';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';

export default function NotificationsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setNotifications(data.notifications || []);
      } else {
        setError(data.message || 'Could not load notifications.');
      }
    } catch (err) {
      console.log('[Load Notifications Error]', err);
      setError('Server is offline. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setNotifications((prev) =>
          prev.map((item) => (item._id === id ? { ...item, read: true } : item))
        );
      }
    } catch (err) {
      console.log('[Mark Read Error]', err);
    }
  };

  const handleMarkAllRead = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      }
    } catch (err) {
      console.log('[Mark All Read Error]', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setNotifications((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (err) {
      console.log('[Delete Notification Error]', err);
    }
  };

  const getIconDetails = (type) => {
    switch (type) {
      case 'booking':
        return { name: 'calendar-outline', color: COLORS.primary, bg: COLORS.primaryLight };
      case 'cancellation':
        return { name: 'close-circle-outline', color: COLORS.danger, bg: 'rgba(239, 68, 68, 0.12)' };
      case 'assigned':
        return { name: 'people-outline', color: COLORS.success, bg: 'rgba(52, 211, 153, 0.15)' };
      default:
        return { name: 'notifications-outline', color: COLORS.subText, bg: COLORS.border };
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ' at ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScreenContainer fill topPadding={12}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>Stay updated with your home service status.</Text>
        </View>
        {notifications.some(item => !item.read) && (
          <TouchableOpacity style={styles.readAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.readAllBtnText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadNotifications}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={notifications}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.listContent, notifications.length === 0 && styles.listEmpty]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.mutedIcon} />
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>You will receive alerts here when booking status changes.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const icon = getIconDetails(item.type);
            return (
              <Pressable
                style={[styles.card, !item.read && styles.unreadCard]}
                onPress={() => !item.read && handleMarkAsRead(item._id)}>
                <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
                  <Ionicons name={icon.name} size={20} color={icon.color} />
                </View>
                <View style={styles.body}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, !item.read && styles.unreadText]}>{item.title}</Text>
                    {!item.read && <View style={styles.blueDot} />}
                  </View>
                  <Text style={styles.message}>{item.message}</Text>
                  <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteNotification(item._id)}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.subText} />
                </TouchableOpacity>
              </Pressable>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.subText,
    fontSize: 14,
  },
  readAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  readAllBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  listEmpty: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.subText,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'flex-start',
    gap: 12,
    ...SHADOW,
  },
  unreadCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  unreadText: {
    color: COLORS.primary,
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  message: {
    marginTop: 4,
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
  },
  timestamp: {
    marginTop: 6,
    color: COLORS.subText,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
    alignSelf: 'center',
  },
});
