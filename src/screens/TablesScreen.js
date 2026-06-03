import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTables } from '../api/api';
import TableCard from '../components/TableCard';

const PRIMARY = '#1565C0';

export default function TablesScreen({ navigation }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await getTables();
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setTables(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTables();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  const handleTablePress = (table) => {
    navigation.navigate('SelectItems', {
      tableId: table.id,
      tableName: table.name || `Table ${table.id}`,
      orderId: table.active_order_id || null,          // pass existing held/active order
      existingOrderStatus: table.active_order_status || null,
      isTakeAway: false,
    });
  };

  const handleTakeAway = (slot = 1) => {
    navigation.navigate('SelectItems', {
      tableId: null,
      tableName: `Take Away ${slot}`,
      orderId: null,
      isTakeAway: true,
    });
  };

  // Feature 7: 3 take away slots
  const TAKEAWAY_SLOTS = [
    { slot: 1, label: 'Take Away 1', icon: '🛍' },
    { slot: 2, label: 'Take Away 2', icon: '📦' },
    { slot: 3, label: 'Take Away 3', icon: '🥡' },
  ];

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <TableCard table={item} onPress={() => handleTablePress(item)} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading tables...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Table</Text>
        <Text style={styles.headerSubtitle}>{tables.length} tables</Text>
      </View>

      {/* Feature 7: 3 Take Away Buttons */}
      <View style={styles.takeAwaySection}>
        <Text style={styles.takeAwayHeader}>TAKE AWAY / PARCEL</Text>
        <View style={styles.takeAwayRow}>
          {TAKEAWAY_SLOTS.map(({ slot, label, icon }) => (
            <TouchableOpacity
              key={slot}
              style={styles.takeAwayButton}
              onPress={() => handleTakeAway(slot)}
              activeOpacity={0.8}
            >
              <Text style={styles.takeAwayIcon}>{icon}</Text>
              <Text style={styles.takeAwayTitle}>{label}</Text>
              <Text style={styles.takeAwaySubtitle}>No table</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🪑</Text>
          <Text style={styles.emptyTitle}>No Tables Found</Text>
          <Text style={styles.emptySubtitle}>
            Add tables from the backend admin panel
          </Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 14,
  },
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#BBDEFB',
    fontSize: 13,
  },
  takeAwaySection: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },
  takeAwayHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 8,
  },
  takeAwayRow: {
    flexDirection: 'row',
    gap: 8,
  },
  takeAwayButton: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  takeAwayIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  takeAwayTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
  },
  takeAwaySubtitle: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 2,
  },
  grid: {
    padding: 6,
    paddingBottom: 20,
  },
  cardWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
