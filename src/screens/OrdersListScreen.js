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
import { getOrders } from '../api/api';

const PRIMARY = '#1565C0';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'kot_generated', label: 'KOT' },
  { key: 'billed', label: 'Billed' },
  { key: 'paid', label: 'Paid' },
];

const STATUS_CONFIG = {
  pending: { color: '#FF8F00', bg: '#FFF8E1', label: 'Pending' },
  kot_generated: { color: '#1565C0', bg: '#E3F2FD', label: 'KOT' },
  billed: { color: '#6A1B9A', bg: '#F3E5F5', label: 'Billed' },
  paid: { color: '#2E7D32', bg: '#E8F5E9', label: 'Paid' },
  cancelled: { color: '#C62828', bg: '#FFEBEE', label: 'Cancelled' },
};

function OrderCard({ order, onPress }) {
  const status = STATUS_CONFIG[order.status] || {
    color: '#757575',
    bg: '#F5F5F5',
    label: order.status || 'Unknown',
  };

  const tableName = order.table_name || order.table?.name || 'Take Away';
  const total = parseFloat(order.total_amount || 0).toFixed(2);
  const timeStr = order.created_at
    ? new Date(order.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      })
    : '';

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.orderCardLeft}>
        <View style={styles.orderIdRow}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
        <Text style={styles.orderTable}>{tableName}</Text>
        <Text style={styles.orderTime}>
          {dateStr} {timeStr}
        </Text>
      </View>
      <View style={styles.orderCardRight}>
        <Text style={styles.orderTotal}>₹{total}</Text>
        <Text style={styles.orderArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersListScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchOrders = async (filter = activeFilter) => {
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      params.ordering = '-created_at';

      const res = await getOrders(params);
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setOrders(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders(activeFilter);
    }, [activeFilter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(activeFilter);
  };

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    setLoading(true);
    fetchOrders(key);
  };

  const handleOrderPress = (order) => {
    navigation.navigate('OrderDetails', { orderId: order.id });
  };

  const renderItem = ({ item }) => (
    <OrderCard order={item} onPress={() => handleOrderPress(item)} />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} orders</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
            onPress={() => handleFilterChange(f.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === f.key && styles.filterTabTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === 'all'
                  ? 'No orders have been placed yet'
                  : `No ${activeFilter} orders`}
              </Text>
            </View>
          }
        />
      )}
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
  headerSubtitle: { color: '#BBDEFB', fontSize: 13 },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: PRIMARY,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  filterTabTextActive: {
    color: PRIMARY,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  orderCardLeft: { flex: 1 },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderTable: {
    fontSize: 13,
    color: '#424242',
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  orderCardRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
    marginRight: 6,
  },
  orderArrow: {
    fontSize: 22,
    color: '#BDBDBD',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#424242', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#9E9E9E', textAlign: 'center' },
});
