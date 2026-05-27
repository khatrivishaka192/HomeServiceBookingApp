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
  Image,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOW } from '../../constants/appTheme';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function AdminServicesScreen() {
  const insets = useSafeAreaInsets();
  const { getToken, logoutUser } = useAuth();
  const { isDesktop } = useResponsive();

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form Fields
  const [serviceId, setServiceId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('60 mins');
  const [image, setImage] = useState('');
  const [featured, setFeatured] = useState(false);

  const [saving, setSaving] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  // Fetch categories & services
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await getToken();
      
      // 1. Fetch categories
      const catRes = await fetch(`${API_BASE_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const catData = await catRes.json();
      if (catRes.status === 200 && catData.success) {
        setCategories(catData.categories);
      }

      // 2. Fetch services with filters
      const catQuery = selectedCategoryFilter !== 'All' ? `&categoryId=${selectedCategoryFilter}` : '';
      const searchQuery = search ? `&query=${encodeURIComponent(search)}` : '';
      const servRes = await fetch(`${API_BASE_URL}/services?admin=true${catQuery}${searchQuery}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          // Passing admin mode returns inactive services as well
          'X-Admin-Request': 'true'
        },
      });
      const servData = await servRes.json();
      if (servRes.status === 200 && servData.success) {
        setServices(servData.services);
      } else {
        if (servRes.status === 401 || servRes.status === 403) {
          logoutUser();
        }
      }
    } catch (err) {
      console.error('[Services Load Error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, search, selectedCategoryFilter, logoutUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const openAddModal = () => {
    setEditingService(null);
    setServiceId('');
    setCategoryId(categories[0]?.categoryId || '');
    setName('');
    setDescription('');
    setPrice('');
    setDuration('60 mins');
    setImage('https://picsum.photos/seed/' + Math.random().toString(36).substring(7) + '/900/600');
    setFeatured(false);
    setCategoryDropdownOpen(false);
    setModalVisible(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setServiceId(service.serviceId);
    setCategoryId(service.categoryId);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(String(service.price));
    setDuration(service.duration || '60 mins');
    setImage(service.image || '');
    setFeatured(service.featured || false);
    setCategoryDropdownOpen(false);
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!serviceId.trim() || !categoryId.trim() || !name.trim() || !price.trim()) {
      Alert.alert('Validation Error', 'Service ID, Category, Name and Price are required.');
      return;
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      Alert.alert('Validation Error', 'Price must be a positive number.');
      return;
    }

    // Resolve Category Name
    const categoryObj = categories.find(c => c.categoryId === categoryId);
    const categoryName = categoryObj ? categoryObj.name : 'General';

    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        serviceId: serviceId.trim(),
        categoryId: categoryId.trim(),
        name: name.trim(),
        category: categoryName,
        description: description.trim(),
        price: Number(price),
        duration: duration.trim(),
        image: image.trim(),
        featured,
      };

      const isEdit = !!editingService;
      const url = isEdit
        ? `${API_BASE_URL}/services/${editingService.serviceId}`
        : `${API_BASE_URL}/services`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if ((res.status === 200 || res.status === 201) && data.success) {
        setModalVisible(false);
        fetchData();
      } else {
        Alert.alert('Operation Failed', data.message || 'Error occurred saving service.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Failed to communicate with API.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/services/${item.serviceId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setServices(prev =>
          prev.map(s => (s.serviceId === item.serviceId ? { ...s, status: data.service.status } : s))
        );
      } else {
        Alert.alert('Error', data.message || 'Could not toggle service status.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection failed.');
    }
  };

  const handleDeleteService = (item) => {
    const performDelete = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/services/${item.serviceId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();
        if (res.status === 200 && data.success) {
          setServices(prev => prev.filter(s => s.serviceId !== item.serviceId));
        } else {
          Alert.alert('Error', data.message || 'Could not delete service.');
        }
      } catch (err) {
        Alert.alert('Error', 'Connection error.');
      }
    };

    Alert.alert('DELETE SERVICE', `Are you sure you want to delete "${item.name}"? This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: performDelete },
    ]);
  };

  const renderServiceItem = ({ item }) => {
    const isActive = item.status === 'active';
    return (
      <View style={styles.servCard}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.servImage} />
        ) : (
          <View style={styles.servImageFallback}>
            <Ionicons name="construct-outline" size={24} color={COLORS.mutedIcon} />
          </View>
        )}

        <View style={styles.servInfo}>
          <View style={styles.servHeaderRow}>
            <Text style={styles.servName} numberOfLines={1}>{item.name}</Text>
            {item.featured ? (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredText}>★ Featured</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.servCatText}>{item.category} (ID: {item.serviceId})</Text>
          <Text style={styles.servPriceText}>Price: <Text style={{ color: COLORS.success }}>${item.price}</Text> • Duration: {item.duration || '60 mins'}</Text>
          
          <View style={styles.statusInfoRow}>
            <View style={[styles.statusBadge, isActive ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
              <Text style={styles.statusTextVal}>{item.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsColumn}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(item)}>
            <Ionicons
              name={isActive ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={isActive ? COLORS.warning : COLORS.success}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteService(item)}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
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
            placeholder="Search services name..."
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

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color={COLORS.white} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Category filters */}
      <View style={styles.categoryFiltersScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategoryFilter === 'All' && styles.filterChipActive]}
            onPress={() => setSelectedCategoryFilter('All')}>
            <Text style={[styles.filterChipText, selectedCategoryFilter === 'All' && styles.filterChipTextActive]}>
              ALL SERVICES
            </Text>
          </TouchableOpacity>

          {categories.map(cat => (
            <TouchableOpacity
              key={cat.categoryId}
              style={[styles.filterChip, selectedCategoryFilter === cat.categoryId && styles.filterChipActive]}
              onPress={() => setSelectedCategoryFilter(cat.categoryId)}>
              <Text style={[styles.filterChipText, selectedCategoryFilter === cat.categoryId && styles.filterChipTextActive]}>
                {cat.name.toUpperCase()}
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
          data={services}
          keyExtractor={item => item.serviceId}
          renderItem={renderServiceItem}
          contentContainerStyle={[styles.listContent, isDesktop && { maxWidth: 850, alignSelf: 'center', width: '100%' }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.subText} />
              <Text style={styles.emptyText}>No services found matching filters.</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit Service Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, isDesktop && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Edit Service' : 'Add Service'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Service Unique ID</Text>
              <TextInput
                style={[styles.input, editingService && styles.inputDisabled]}
                placeholder="e.g. s13"
                placeholderTextColor={COLORS.subText}
                value={serviceId}
                onChangeText={setServiceId}
                editable={!editingService}
              />

              <Text style={styles.label}>Category Association</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}>
                <Text style={styles.dropdownValue}>
                  {categories.find(c => c.categoryId === categoryId)?.name || 'Select Category'}
                </Text>
                <Ionicons name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.text} />
              </TouchableOpacity>

              {categoryDropdownOpen ? (
                <View style={styles.dropdownList}>
                  {categories.map(c => (
                    <TouchableOpacity
                      key={c.categoryId}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setCategoryId(c.categoryId);
                        setCategoryDropdownOpen(false);
                      }}>
                      <Text style={styles.dropdownItemText}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <Text style={styles.label}>Service Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sofa Cleaning"
                placeholderTextColor={COLORS.subText}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Price ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 1299"
                placeholderTextColor={COLORS.subText}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.label}>Duration</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 60 mins, 2 hours"
                placeholderTextColor={COLORS.subText}
                value={duration}
                onChangeText={setDuration}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Service details and specifications..."
                placeholderTextColor={COLORS.subText}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                placeholder="Cover image path URL link..."
                placeholderTextColor={COLORS.subText}
                value={image}
                onChangeText={setImage}
              />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Mark as Featured Item</Text>
                <Switch
                  value={featured}
                  onValueChange={setFeatured}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={Platform.OS === 'android' ? COLORS.primaryLight : ''}
                />
              </View>

              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : null}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveService}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Service</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    ...SHADOW,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
  categoryFiltersScroll: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  filterContent: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.subText,
  },
  filterChipTextActive: {
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
  servCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    padding: 12,
    alignItems: 'center',
    ...SHADOW,
  },
  servImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
  },
  servImageFallback: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  servHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  featuredBadge: {
    backgroundColor: '#F59E0B20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
  },
  servCatText: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 2,
  },
  servPriceText: {
    fontSize: 12,
    color: COLORS.subText,
    marginTop: 4,
    fontWeight: '600',
  },
  statusInfoRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeActive: {
    backgroundColor: COLORS.success + '20',
  },
  statusBadgeInactive: {
    backgroundColor: COLORS.danger + '20',
  },
  statusTextVal: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
  },
  actionsColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 90,
  },
  actionBtn: {
    padding: 4,
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
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
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
  formContainer: {
    paddingBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  dropdownSelector: {
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
  dropdownValue: {
    color: COLORS.text,
    fontSize: 14,
  },
  dropdownList: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 6,
    maxHeight: 120,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownItemText: {
    color: COLORS.text,
    fontSize: 13,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
    ...SHADOW,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
