import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOW } from '../../constants/appTheme';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function AdminCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { getToken, logoutUser } = useAuth();
  const { isDesktop } = useResponsive();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Add / Edit Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null for "Add", Category object for "Edit"
  
  // Form fields
  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [icon, setIcon] = useState('grid-outline');

  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await getToken();
      const searchQuery = search ? `?query=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${API_BASE_URL}/categories${searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setCategories(data.categories);
      } else {
        if (res.status === 401 || res.status === 403) {
          logoutUser();
        }
      }
    } catch (err) {
      console.error('[Fetch Categories Error]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken, search, logoutUser]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCategories(true);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryId('');
    setName('');
    setDescription('');
    setImage('https://picsum.photos/seed/' + Math.random().toString(36).substring(7) + '/900/600');
    setIcon('grid-outline');
    setModalVisible(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryId(cat.categoryId);
    setName(cat.name);
    setDescription(cat.description || '');
    setImage(cat.image || '');
    setIcon(cat.icon || 'grid-outline');
    setModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryId.trim() || !name.trim()) {
      Alert.alert('Validation Error', 'Category ID and Category Name are required.');
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        categoryId: categoryId.trim(),
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
        icon: icon.trim(),
      };

      const isEdit = !!editingCategory;
      const url = isEdit
        ? `${API_BASE_URL}/categories/${editingCategory.categoryId}`
        : `${API_BASE_URL}/categories`;
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
        fetchCategories();
      } else {
        Alert.alert('Operation Failed', data.message || 'Error occurred saving category.');
      }
    } catch (err) {
      Alert.alert('Connection Error', 'Could not save. Please check network.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/categories/${cat.categoryId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.status === 200 && data.success) {
        setCategories(prev =>
          prev.map(c => (c.categoryId === cat.categoryId ? { ...c, status: data.category.status } : c))
        );
      } else {
        Alert.alert('Error', data.message || 'Could not toggle category status.');
      }
    } catch (err) {
      Alert.alert('Error', 'Connection failed.');
    }
  };

  const handleDeleteCategory = (cat) => {
    const performDelete = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE_URL}/categories/${cat.categoryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();
        if (res.status === 200 && data.success) {
          setCategories(prev => prev.filter(c => c.categoryId !== cat.categoryId));
        } else {
          Alert.alert('Error', data.message || 'Failed to delete category.');
        }
      } catch (err) {
        Alert.alert('Error', 'Connection to database failed.');
      }
    };

    Alert.alert(
      'DELETE CATEGORY',
      `Are you sure you want to delete Category "${cat.name}"? All services reference this Category ID will lose reference association.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]
    );
  };

  const renderCategoryItem = ({ item }) => {
    const isActive = item.status === 'active';
    return (
      <View style={styles.catCard}>
        <View style={styles.catImageWrap}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.catImage} />
          ) : (
            <View style={styles.catFallbackImage}>
              <Ionicons name="image-outline" size={32} color={COLORS.mutedIcon} />
            </View>
          )}
          <View style={[styles.statusTag, isActive ? styles.tagActive : styles.tagInactive]}>
            <Text style={styles.statusTagText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.catInfo}>
          <View style={styles.catTitleRow}>
            <Ionicons name={item.icon || 'grid-outline'} size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.catName} numberOfLines={1}>{item.name}</Text>
          </View>
          <Text style={styles.catIdText}>ID: {item.categoryId}</Text>
          {item.description ? (
            <Text style={styles.catDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(item)}>
            <Ionicons
              name={isActive ? 'eye-off-outline' : 'eye-outline'}
              size={16}
              color={isActive ? COLORS.warning : COLORS.success}
            />
            <Text style={[styles.actionBtnText, { color: isActive ? COLORS.warning : COLORS.success }]}>
              {isActive ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteCategory(item)}>
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Add Top Header */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color={COLORS.subText} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories name or description..."
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

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item.categoryId}
          renderItem={renderCategoryItem}
          contentContainerStyle={[styles.listContent, isDesktop && { maxWidth: 850, alignSelf: 'center', width: '100%' }]}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="grid-outline" size={48} color={COLORS.subText} />
              <Text style={styles.emptyText}>No categories found.</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, isDesktop && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={styles.label}>Unique Category ID</Text>
              <TextInput
                style={[styles.input, editingCategory && styles.inputDisabled]}
                placeholder="e.g. c5"
                placeholderTextColor={COLORS.subText}
                value={categoryId}
                onChangeText={setCategoryId}
                editable={!editingCategory} // Cannot change categoryId on editing
              />

              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Salon for Men"
                placeholderTextColor={COLORS.subText}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Service description details..."
                placeholderTextColor={COLORS.subText}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>Ionicons Icon Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. water-outline, spark-outline"
                placeholderTextColor={COLORS.subText}
                value={icon}
                onChangeText={setIcon}
              />

              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                placeholder="Image cover url link..."
                placeholderTextColor={COLORS.subText}
                value={image}
                onChangeText={setImage}
              />

              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : null}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveCategory}
                disabled={saving}>
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Category</Text>
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
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  catCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOW,
  },
  catImageWrap: {
    height: 150,
    width: '100%',
    backgroundColor: COLORS.primaryLight,
  },
  catImage: {
    width: '100%',
    height: '100%',
  },
  catFallbackImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagActive: {
    backgroundColor: COLORS.success,
  },
  tagInactive: {
    backgroundColor: COLORS.danger,
  },
  statusTagText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  catInfo: {
    padding: 14,
  },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  catIdText: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 4,
  },
  catDesc: {
    fontSize: 13,
    color: COLORS.subText,
    marginTop: 8,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
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
    paddingBottom: 16,
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
  textArea: {
    height: 72,
    textAlignVertical: 'top',
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
