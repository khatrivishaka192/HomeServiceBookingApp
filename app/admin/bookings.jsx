import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

import { COLORS, SHADOW } from '../../constants/appTheme';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function AdminBookingsScreen() {
  const insets = useSafeAreaInsets();
  const { getToken, logoutUser } = useAuth();
  const { isDesktop } = useResponsive();
  const params = useLocalSearchParams();
  const highlightId = Array.isArray(params.highlightId) ? params.highlightId[0] : params.highlightId;

  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Pending, Accepted, In Progress, Completed, Cancelled

  // Details Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Provider assignment select state
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/providers`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.success) {
        setProviders(data.providers);
      }
    } catch (err) {
      console.error('[Fetch Providers Error]', err);
    }
  }, [getToken]);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await getToken();
      const statusQuery = statusFilter !== 'All' ? `?status=${statusFilter}` : '';
      const searchQuery = search ? `${statusQuery ? '&' : '?'}query=${encodeURIComponent(search)}` : '';
      
      const res = await fetch(`${API_BASE_URL}/admin/bookings${statusQuery}${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setBookings(data.bookings);

        // Highlight modal pop up if highlightId is passed
        if (highlightId && !isRefresh) {
          const matched = data.bookings.find(b => b.id === highlightId || b.bookingId === highlightId);
          if (matched) {
            setSelectedBooking(matched);
            setDetailsModalVisible(true);
          }
        }
      } else {
        if (res.status === 401 || res.status === 403) {
          logoutUser();
        }
      }
    } catch (err) {
      console.error('[Fetch Admin Bookings Error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, statusFilter, search, highlightId, logoutUser]);

  useEffect(() => {
    fetchProviders();
    fetchBookings();
  }, [fetchBookings, fetchProviders]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings(true);
  };

  // Status transition triggers
  const handleUpdateBookingStatus = async (bookingId, payload) => {
    setUpdatingStatus(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        // Update local list
        setBookings(prev =>
          prev.map(b => (b.bookingId === bookingId ? data.booking : b))
        );
        setSelectedBooking(data.booking);
      } else {
        Alert.alert('Update Failed', data.message || 'Could not update booking status.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection failure.');
    } finally {
      setUpdatingStatus(false);
      setAssignDropdownOpen(false);
    }
  };

  const renderBookingItem = ({ item }) => {
    const formattedPrice = `$` + Number(item.price || 0).toLocaleString();
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => {
          setSelectedBooking(item);
          setDetailsModalVisible(true);
        }}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.serviceType}</Text>
          <Text style={styles.cardPrice}>{formattedPrice}</Text>
        </View>

        <Text style={styles.cardSub}>ID: {item.bookingId} • {item.date} • {item.time}</Text>
        
        {item.providerName ? (
          <View style={styles.assignedBadge}>
            <Ionicons name="person" size={12} color={COLORS.success} style={{ marginRight: 4 }} />
            <Text style={styles.assignedText}>Expert: {item.providerName}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <Text style={styles.cardAddress} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={COLORS.subText} /> {item.address}
          </Text>
          <View style={[styles.statusTag, styles[`tag${item.status}`]]}>
            <Text style={[styles.statusTagText, styles[`tagText${item.status}`]]}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
            placeholder="Search booking ID, address, contact..."
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

      {/* Tabs */}
      <View style={styles.tabsScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {['All', 'Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.tab, statusFilter === status && styles.tabActive]}
              onPress={() => setStatusFilter(status)}>
              <Text style={[styles.tabText, statusFilter === status && styles.tabTextActive]}>
                {status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item.bookingId}
          renderItem={renderBookingItem}
          contentContainerStyle={[styles.listContent, isDesktop && { maxWidth: 850, alignSelf: 'center', width: '100%' }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.subText} />
              <Text style={styles.emptyText}>No bookings found matching filters.</Text>
            </View>
          }
        />
      )}

      {/* Detailed Booking Inspection Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, isDesktop && { maxWidth: 600 }]}>
            
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedBooking?.serviceType}</Text>
                <Text style={styles.modalSub}>Booking ID: {selectedBooking?.bookingId}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            {updatingStatus ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                
                {/* Status Badge header */}
                <View style={styles.statusHeaderRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusTag, styles[`tag${selectedBooking?.status}`]]}>
                    <Text style={[styles.statusTagText, styles[`tagText${selectedBooking?.status}`]]}>
                      {selectedBooking?.status}
                    </Text>
                  </View>
                </View>

                {/* Assignment Provider Section */}
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>Assign Service Provider</Text>
                <TouchableOpacity
                  style={styles.providerSelector}
                  onPress={() => setAssignDropdownOpen(!assignDropdownOpen)}>
                  <Text style={styles.providerSelectorValue}>
                    {selectedBooking?.providerName || 'Select Expert Provider to Assign'}
                  </Text>
                  <Ionicons name={assignDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.text} />
                </TouchableOpacity>

                {assignDropdownOpen ? (
                  <View style={styles.providerDropdown}>
                    {providers.map(prov => (
                      <TouchableOpacity
                        key={prov.providerId}
                        style={styles.providerItem}
                        onPress={() =>
                          handleUpdateBookingStatus(selectedBooking.bookingId, {
                            providerId: prov.providerId,
                            providerName: prov.name,
                          })
                        }>
                        <Text style={styles.providerItemText}>{prov.name} ({prov.category})</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}

                {/* Detail Information Cards */}
                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailTitle}>Customer Email:</Text>
                    <Text style={styles.detailVal}>{selectedBooking?.userEmail || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailTitle}>Contact Number:</Text>
                    <Text style={styles.detailVal}>{selectedBooking?.contactNumber || 'N/A'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailTitle}>Service Date/Time:</Text>
                    <Text style={styles.detailVal}>{selectedBooking?.date} at {selectedBooking?.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailTitle}>Payment Method:</Text>
                    <Text style={styles.detailVal}>{selectedBooking?.paymentMethod}</Text>
                  </View>
                  <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                    <Text style={styles.detailTitle}>Service Address:</Text>
                    <Text style={[styles.detailVal, { flex: 1, textAlign: 'right' }]}>{selectedBooking?.address}</Text>
                  </View>
                </View>

                {/* Services Ordered */}
                <Text style={styles.sectionLabel}>Items Details</Text>
                {selectedBooking?.services && selectedBooking.services.map((item, index) => (
                  <View key={index} style={styles.serviceItemRow}>
                    <Text style={styles.serviceItemName}>{item.name} x {item.quantity || 1}</Text>
                    <Text style={styles.serviceItemPrice}>${item.price}</Text>
                  </View>
                ))}

                <View style={styles.pricingCard}>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingTitle}>Subtotal:</Text>
                    <Text style={styles.pricingValue}>${selectedBooking?.subtotal || selectedBooking?.price || 0}</Text>
                  </View>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingTitle}>Service Charge:</Text>
                    <Text style={styles.pricingValue}>${selectedBooking?.serviceCharge || 0}</Text>
                  </View>
                  <View style={[styles.pricingRow, { borderTopWidth: 1, borderColor: COLORS.border, paddingTop: 8, marginTop: 4 }]}>
                    <Text style={[styles.pricingTitle, { fontWeight: '800', color: COLORS.text }]}>Total Paid:</Text>
                    <Text style={[styles.pricingValue, { fontWeight: '800', color: COLORS.success }]}>${selectedBooking?.totalPayment || selectedBooking?.price || 0}</Text>
                  </View>
                </View>

                {/* Action status Buttons */}
                <Text style={styles.sectionLabel}>Administrative Action Controls</Text>
                <View style={styles.btnRow}>
                  {selectedBooking?.status === 'Pending' ? (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
                      onPress={() => handleUpdateBookingStatus(selectedBooking.bookingId, { status: 'Accepted' })}>
                      <Text style={styles.btnText}>Approve booking</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedBooking?.status === 'Accepted' ? (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: COLORS.accent }]}
                      onPress={() => handleUpdateBookingStatus(selectedBooking.bookingId, { status: 'In Progress' })}>
                      <Text style={styles.btnText}>Mark In Progress</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedBooking?.status === 'In Progress' ? (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                      onPress={() => handleUpdateBookingStatus(selectedBooking.bookingId, { status: 'Completed' })}>
                      <Text style={styles.btnText}>Complete booking</Text>
                    </TouchableOpacity>
                  ) : null}

                  {['Pending', 'Accepted', 'In Progress'].includes(selectedBooking?.status) ? (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: COLORS.danger, marginLeft: 8 }]}
                      onPress={() => handleUpdateBookingStatus(selectedBooking.bookingId, { status: 'Cancelled' })}>
                      <Text style={styles.btnText}>Cancel Service</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Dynamic Status Timeline History */}
                <Text style={styles.sectionLabel}>Booking Tracker Timeline</Text>
                <View style={styles.timelineCard}>
                  {selectedBooking?.statusHistory && selectedBooking.statusHistory.length > 0 ? (
                    selectedBooking.statusHistory.map((history, idx) => (
                      <View key={idx} style={styles.timelineItem}>
                        <View style={styles.timelineMarker}>
                          <View style={styles.timelineDot} />
                          {idx < selectedBooking.statusHistory.length - 1 ? (
                            <View style={styles.timelineLine} />
                          ) : null}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineStatus}>{history.status}</Text>
                          <Text style={styles.timelineTime}>
                            {new Date(history.timestamp).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.timelineItem}>
                      <View style={styles.timelineMarker}>
                        <View style={styles.timelineDot} />
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineStatus}>Placed Order (Pending)</Text>
                        <Text style={styles.timelineTime}>
                          {selectedBooking ? new Date(selectedBooking.createdAt).toLocaleString() : ''}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

              </ScrollView>
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
  tabsScrollWrap: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tabsContainer: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.subText,
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
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 14,
    ...SHADOW,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.success,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 4,
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.success + '15',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  assignedText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    marginTop: 12,
    paddingTop: 10,
  },
  cardAddress: {
    fontSize: 12,
    color: COLORS.subText,
    flex: 1,
    marginRight: 10,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tagPending: { backgroundColor: COLORS.warning + '20' },
  tagTextPending: { color: COLORS.warning },
  tagConfirmed: { backgroundColor: COLORS.primary + '20' },
  tagTextConfirmed: { color: COLORS.primary },
  tagAccepted: { backgroundColor: COLORS.primary + '20' },
  tagTextAccepted: { color: COLORS.primary },
  tagCompleted: { backgroundColor: COLORS.success + '20' },
  tagTextCompleted: { color: COLORS.success },
  tagCancelled: { backgroundColor: COLORS.danger + '20' },
  tagTextCancelled: { color: COLORS.danger },
  tagInProgress: { backgroundColor: COLORS.accent + '20' },
  tagTextInProgress: { color: COLORS.accent },
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 2,
  },
  loadingOverlay: {
    paddingVertical: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 14,
  },
  providerSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  providerSelectorValue: {
    color: COLORS.text,
    fontSize: 13,
  },
  providerDropdown: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
    maxHeight: 140,
    overflow: 'hidden',
  },
  providerItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  providerItemText: {
    color: COLORS.text,
    fontSize: 13,
  },
  detailsCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 12,
    color: COLORS.subText,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  serviceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  serviceItemName: {
    fontSize: 13,
    color: COLORS.text,
  },
  serviceItemPrice: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
  pricingCard: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pricingTitle: {
    fontSize: 12,
    color: COLORS.subText,
  },
  pricingValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  btnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  timelineCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginTop: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineMarker: {
    alignItems: 'center',
    marginRight: 12,
    width: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  timelineTime: {
    fontSize: 10,
    color: COLORS.subText,
    marginTop: 2,
  },
});
