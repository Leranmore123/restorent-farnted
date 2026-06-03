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
import { getTables, createTable, deleteTable } from '../../api/api';

const PRIMARY = '#1565C0';
const DANGER  = '#C62828';

export default function TableManageScreen({ navigation }) {
  const [tables, setTables]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tableName, setTableName] = useState('');
  const [capacity, setCapacity]   = useState('4');
  const [adding, setAdding]       = useState(false);

  const fetchTables = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getTables();
      const data = res.data;
      setTables(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load tables.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTables();
    }, [])
  );

  const handleDelete = (table) => {
    Alert.alert(
      'Delete Table',
      `Delete "${table.name}"? Active orders on this table may be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTable(table.id);
              setTables((prev) => prev.filter((t) => t.id !== table.id));
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete table.');
            }
          },
        },
      ]
    );
  };

  const handleAdd = async () => {
    const trimmedName = tableName.trim();
    if (!trimmedName) {
      Alert.alert('Validation', 'Table name cannot be empty.');
      return;
    }
    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1) {
      Alert.alert('Validation', 'Capacity must be at least 1.');
      return;
    }
    setAdding(true);
    try {
      const res = await createTable({ name: trimmedName, capacity: cap });
      const newTable = res.data?.id ? res.data : (res.data?.results?.[0] ?? res.data);
      setTables((prev) => [...prev, newTable]);
      setTableName('');
      setCapacity('4');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add table.');
    } finally {
      setAdding(false);
    }
  };

  const getStatusBadge = (table) => {
    const isOccupied = table.is_occupied || table.occupied;
    return {
      label: isOccupied ? 'Occupied' : 'Free',
      color: isOccupied ? '#C62828' : '#2E7D32',
      bg: isOccupied ? '#FFEBEE' : '#E8F5E9',
    };
  };

  const renderItem = ({ item }) => {
    const badge = getStatusBadge(item);
    return (
      <View style={styles.row}>
        <Text style={styles.rowIcon}>🪑</Text>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.name}</Text>
          <Text style={styles.rowCapacity}>Capacity: {item.capacity || '—'}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
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
        <Text style={styles.headerTitle}>Tables</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : (
          <FlatList
            data={tables}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchTables(true)}
                colors={[PRIMARY]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tables yet.</Text>
                <Text style={styles.emptySubText}>Add one below.</Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <Text style={styles.listHeader}>
                {tables.length} {tables.length === 1 ? 'table' : 'tables'}
              </Text>
            }
            ListFooterComponent={
              <View style={styles.addSection}>
                <Text style={styles.addSectionTitle}>ADD NEW TABLE</Text>

                <Text style={styles.fieldLabel}>TABLE NAME</Text>
                <TextInput
                  style={styles.input}
                  value={tableName}
                  onChangeText={setTableName}
                  placeholder="e.g. Table 11"
                  placeholderTextColor="#BDBDBD"
                  autoCapitalize="words"
                />

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>CAPACITY</Text>
                <TextInput
                  style={styles.input}
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholder="4"
                  placeholderTextColor="#BDBDBD"
                  keyboardType="number-pad"
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
                    <Text style={styles.addBtnText}>ADD TABLE</Text>
                  )}
                </TouchableOpacity>
              </View>
            }
          />
        )}
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
    paddingBottom: 32,
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
  },
  rowIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212121',
  },
  rowCapacity: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  deleteBtnText: {
    color: DANGER,
    fontSize: 13,
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
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  addSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E9E9E',
    letterSpacing: 0.8,
    marginBottom: 6,
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
  addBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    elevation: 2,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
