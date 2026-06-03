import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getMenuItems,
  getCategories,
  createMenuItem,
  deleteMenuItem,
  patchMenuItem,
} from '../../api/api';

const PRIMARY = '#1565C0';
const DANGER  = '#C62828';

// ─── Add Item Modal ────────────────────────────────────────────────────────────

function AddItemModal({ visible, onClose, onSaved, categories }) {
  const [itemName, setItemName]     = useState('');
  const [price, setPrice]           = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [available, setAvailable]   = useState(true);
  const [saving, setSaving]         = useState(false);

  const reset = () => {
    setItemName('');
    setPrice('');
    setCategoryId(null);
    setAvailable(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!itemName.trim()) {
      Alert.alert('Validation', 'Item name is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Validation', 'Enter a valid price.');
      return;
    }
    if (!categoryId) {
      Alert.alert('Validation', 'Please select a category.');
      return;
    }
    setSaving(true);
    try {
      const res = await createMenuItem({
        name: itemName.trim(),
        price: parsedPrice,
        category: categoryId,
        is_available: available,
      });
      onSaved(res.data);
      reset();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={modalStyles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ width: '100%' }}
        >
          <View style={modalStyles.sheet}>
            {/* Modal header */}
            <View style={modalStyles.header}>
              <Text style={modalStyles.title}>Add Menu Item</Text>
              <TouchableOpacity onPress={handleClose} style={modalStyles.closeBtn}>
                <Text style={modalStyles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={modalStyles.body}
              keyboardShouldPersistTaps="handled"
            >
              {/* Item Name */}
              <Text style={modalStyles.label}>ITEM NAME</Text>
              <TextInput
                style={modalStyles.input}
                value={itemName}
                onChangeText={setItemName}
                placeholder="e.g. Butter Chicken"
                placeholderTextColor="#BDBDBD"
                autoCapitalize="words"
              />

              {/* Price */}
              <Text style={modalStyles.label}>PRICE (₹)</Text>
              <TextInput
                style={modalStyles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor="#BDBDBD"
                keyboardType="decimal-pad"
              />

              {/* Category chips */}
              <Text style={modalStyles.label}>CATEGORY</Text>
              <View style={modalStyles.chipsContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      modalStyles.chip,
                      categoryId === cat.id && modalStyles.chipSelected,
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        modalStyles.chipText,
                        categoryId === cat.id && modalStyles.chipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {categories.length === 0 && (
                  <Text style={modalStyles.noCatText}>
                    No categories found. Add categories first.
                  </Text>
                )}
              </View>

              {/* Available toggle */}
              <View style={modalStyles.toggleRow}>
                <Text style={modalStyles.toggleLabel}>Available</Text>
                <Switch
                  value={available}
                  onValueChange={setAvailable}
                  trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
                  thumbColor={available ? PRIMARY : '#BDBDBD'}
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[modalStyles.saveBtn, saving && modalStyles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={modalStyles.saveBtnText}>SAVE ITEM</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MenuItemManageScreen({ navigation }) {
  const [items, setItems]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        getMenuItems(),
        getCategories(),
      ]);
      // Handle both plain array and paginated {results:[]} responses
      const itemsData = itemsRes.data;
      const catsData  = catsRes.data;
      setItems(Array.isArray(itemsData) ? itemsData : (itemsData?.results || []));
      setCategories(Array.isArray(catsData) ? catsData : (catsData?.results || []));
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Item',
      `Delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMenuItem(item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete item.');
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailable = async (item) => {
    const newVal = !item.is_available;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_available: newVal } : i))
    );
    try {
      await patchMenuItem(item.id, { is_available: newVal });
    } catch (err) {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: !newVal } : i))
      );
      Alert.alert('Error', err.message || 'Failed to update availability.');
    }
  };

  const handleItemSaved = (newItem) => {
    setItems((prev) => [...prev, newItem]);
  };

  // Group items by category
  const grouped = categories.map((cat) => ({
    category: cat,
    items: items.filter((i) => i.category === cat.id || i.category_id === cat.id),
  })).filter((g) => g.items.length > 0);

  // Items with no matching category
  const uncategorized = items.filter(
    (i) => !categories.find((c) => c.id === i.category || c.id === i.category_id)
  );

  // Build flat list data with section headers
  const listData = [];
  grouped.forEach((g) => {
    listData.push({ type: 'header', id: `header-${g.category.id}`, name: g.category.name });
    g.items.forEach((item) => listData.push({ type: 'item', ...item }));
  });
  if (uncategorized.length > 0) {
    listData.push({ type: 'header', id: 'header-uncategorized', name: 'Uncategorized' });
    uncategorized.forEach((item) => listData.push({ type: 'item', ...item }));
  }

  const renderRow = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryHeaderText}>{item.name}</Text>
        </View>
      );
    }
    return (
      <View style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{parseFloat(item.price || 0).toFixed(2)}</Text>
        </View>
        <Switch
          value={item.is_available !== false}
          onValueChange={() => handleToggleAvailable(item)}
          trackColor={{ false: '#E0E0E0', true: '#90CAF9' }}
          thumbColor={item.is_available !== false ? PRIMARY : '#BDBDBD'}
          style={styles.toggle}
        />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Items</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              colors={[PRIMARY]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No menu items yet.</Text>
              <Text style={styles.emptySubText}>Tap + to add one.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Text>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Item Modal */}
      <AddItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={handleItemSaved}
        categories={categories}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 48,
    paddingBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  backBtn: {
    width: 80,
    paddingHorizontal: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  categoryHeader: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
    marginBottom: 4,
  },
  categoryHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  itemPrice: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '500',
    marginTop: 2,
  },
  toggle: {
    marginHorizontal: 8,
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 4,
  },
  deleteBtnText: {
    color: DANGER,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 13,
    color: '#BDBDBD',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 34,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  body: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#FAFAFA',
  },
  chipSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: 13,
    color: '#424242',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  noCatText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  saveBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 28,
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
