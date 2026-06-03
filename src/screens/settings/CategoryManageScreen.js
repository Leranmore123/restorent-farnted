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
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories, deleteCategory, createCategory } from '../../api/api';

const PRIMARY = '#1565C0';
const DANGER  = '#C62828';

export default function CategoryManageScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newName, setNewName]       = useState('');
  const [adding, setAdding]         = useState(false);

  const fetchCategories = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getCategories();
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.results || []);
      setCategories(list);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Category',
      `Delete "${item.name}"? This may affect menu items in this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(item.id);
              setCategories((prev) => prev.filter((c) => c.id !== item.id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete category.');
            }
          },
        },
      ]
    );
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Category name cannot be empty.');
      return;
    }
    setAdding(true);
    try {
      const res = await createCategory({ name: trimmed });
      const newCat = res.data?.id ? res.data : (res.data?.results?.[0] ?? res.data);
      setCategories((prev) => [...prev, newCat]);
      setNewName('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add category.');
    } finally {
      setAdding(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.rowIcon}>🏷️</Text>
      <Text style={styles.rowName}>{item.name}</Text>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Main content: list takes remaining space, add form is fixed at bottom */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Category list */}
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={PRIMARY} />
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchCategories(true)}
                  colors={[PRIMARY]}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No categories yet.</Text>
                  <Text style={styles.emptySubText}>Add one below.</Text>
                </View>
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                <Text style={styles.listHeader}>
                  {categories.length} {categories.length === 1 ? 'category' : 'categories'}
                </Text>
              }
            />
          )}
        </View>

        {/* ADD form — always visible above keyboard */}
        <View style={styles.addSection}>
          <Text style={styles.addSectionTitle}>ADD NEW CATEGORY</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="Category name"
              placeholderTextColor="#BDBDBD"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <TouchableOpacity
              style={[styles.addBtn, adding && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={adding}
              activeOpacity={0.8}
            >
              {adding ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.addBtnText}>ADD</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 8,
  },
  listHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
  },
  rowIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#212121',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: DANGER,
    fontSize: 14,
    fontWeight: '700',
  },
  separator: {
    height: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
  addSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  addSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 1,
    marginBottom: 10,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  addBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
