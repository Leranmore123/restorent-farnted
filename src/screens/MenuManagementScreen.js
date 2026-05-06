import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getMenuItemsGrouped,
  getCategories,
  createMenuItem,
  updateMenuItem,
} from '../api/api';

const PRIMARY = '#1565C0';

const EMPTY_FORM = {
  name: '',
  price: '',
  category: '',
  description: '',
  is_available: true,
};

function MenuItemRow({ item, onEdit }) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </View>
      <Text style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>
      <View
        style={[
          styles.availBadge,
          { backgroundColor: item.is_available ? '#E8F5E9' : '#FFEBEE' },
        ]}
      >
        <Text
          style={[
            styles.availText,
            { color: item.is_available ? '#2E7D32' : '#C62828' },
          ]}
        >
          {item.is_available ? 'ON' : 'OFF'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onEdit(item)} style={styles.editBtn}>
        <Text style={styles.editBtnText}>✎</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MenuManagementScreen({ navigation }) {
  const [groupedItems, setGroupedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const fetchData = async () => {
    try {
      const [menuRes, catRes] = await Promise.all([
        getMenuItemsGrouped().catch(() => ({ data: [] })),
        getCategories().catch(() => ({ data: [] })),
      ]);
      const grouped = Array.isArray(menuRes.data)
        ? menuRes.data
        : menuRes.data?.results || [];
      setGroupedItems(grouped);

      const cats = Array.isArray(catRes.data)
        ? catRes.data
        : catRes.data?.results || [];
      setCategories(cats);

      // Expand all by default
      const expanded = {};
      grouped.forEach((g) => {
        if (g.category?.id) expanded[g.category.id] = true;
      });
      setExpandedCategories(expanded);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || '',
      price: String(item.price || ''),
      category: String(item.category?.id || item.category || ''),
      description: item.description || '',
      is_available: item.is_available !== false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validation', 'Item name is required');
      return;
    }
    if (!form.price || isNaN(parseFloat(form.price))) {
      Alert.alert('Validation', 'Valid price is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        description: form.description.trim(),
        is_available: form.is_available,
      };
      if (form.category) payload.category = parseInt(form.category);

      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
        Alert.alert('Success', 'Item updated successfully');
      } else {
        await createMenuItem(payload);
        Alert.alert('Success', 'Item added successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (catId) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
          <Text style={styles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {/* Menu List */}
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
      >
        {groupedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🍽</Text>
            <Text style={styles.emptyTitle}>No Menu Items</Text>
            <Text style={styles.emptySubtitle}>
              Add items using the button above
            </Text>
          </View>
        ) : (
          groupedItems.map((group) => {
            const catId = group.category?.id;
            const isExpanded = expandedCategories[catId] !== false;
            const items = group.items || [];

            return (
              <View key={catId || Math.random()} style={styles.categorySection}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(catId)}
                >
                  <Text style={styles.categoryName}>
                    {group.category?.name?.toUpperCase() || 'UNCATEGORIZED'}
                  </Text>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryCount}>{items.length} items</Text>
                    <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded &&
                  items.map((item) => (
                    <MenuItemRow key={item.id} item={item} onEdit={handleEdit} />
                  ))}
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Name */}
              <Text style={styles.fieldLabel}>Item Name *</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="e.g. Butter Chicken"
                placeholderTextColor="#BDBDBD"
              />

              {/* Price */}
              <Text style={styles.fieldLabel}>Price (₹) *</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.price}
                onChangeText={(v) => setForm((p) => ({ ...p, price: v }))}
                placeholder="e.g. 250"
                placeholderTextColor="#BDBDBD"
                keyboardType="decimal-pad"
              />

              {/* Category */}
              <Text style={styles.fieldLabel}>Category ID</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.category}
                onChangeText={(v) => setForm((p) => ({ ...p, category: v }))}
                placeholder="Category ID (number)"
                placeholderTextColor="#BDBDBD"
                keyboardType="number-pad"
              />
              {categories.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.catPills}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catPill,
                        form.category === String(cat.id) && styles.catPillActive,
                      ]}
                      onPress={() =>
                        setForm((p) => ({ ...p, category: String(cat.id) }))
                      }
                    >
                      <Text
                        style={[
                          styles.catPillText,
                          form.category === String(cat.id) && styles.catPillTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Description */}
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={form.description}
                onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
                placeholder="Optional description"
                placeholderTextColor="#BDBDBD"
                multiline
                numberOfLines={3}
              />

              {/* Availability */}
              <View style={styles.availRow}>
                <Text style={styles.fieldLabel}>Available</Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    form.is_available ? styles.toggleOn : styles.toggleOff,
                  ]}
                  onPress={() =>
                    setForm((p) => ({ ...p, is_available: !p.is_available }))
                  }
                >
                  <Text style={styles.toggleText}>
                    {form.is_available ? 'YES' : 'NO'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {editingItem ? 'Update' : 'Add Item'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#757575', fontSize: 14 },
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  addBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: { color: PRIMARY, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1 },
  categorySection: {
    marginBottom: 2,
  },
  categoryHeader: {
    backgroundColor: '#37474F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  categoryRight: { flexDirection: 'row', alignItems: 'center' },
  categoryCount: { color: '#B0BEC5', fontSize: 11, marginRight: 8 },
  expandIcon: { color: '#B0BEC5', fontSize: 12 },
  itemRow: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#212121' },
  itemDesc: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    marginRight: 10,
    minWidth: 60,
    textAlign: 'right',
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  availText: { fontSize: 10, fontWeight: '700' },
  editBtn: { padding: 6 },
  editBtnText: { fontSize: 18, color: '#757575' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#424242', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9E9E9E', textAlign: 'center' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#212121' },
  modalClose: { fontSize: 18, color: '#9E9E9E', padding: 4 },
  modalScroll: { padding: 16, maxHeight: 500 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  fieldInputMulti: {
    height: 80,
    textAlignVertical: 'top',
  },
  catPills: { marginTop: 8, marginBottom: 4 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  catPillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  catPillText: { fontSize: 12, fontWeight: '600', color: '#757575' },
  catPillTextActive: { color: '#FFFFFF' },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  toggle: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleOn: { backgroundColor: '#2E7D32' },
  toggleOff: { backgroundColor: '#C62828' },
  toggleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: 24,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelBtnText: { color: '#757575', fontSize: 14, fontWeight: '600' },
  saveBtn: { backgroundColor: PRIMARY },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
