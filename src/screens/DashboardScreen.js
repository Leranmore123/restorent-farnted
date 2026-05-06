import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboard, getOrders } from '../api/api';

const PRIMARY = '#1565C0';
const PRIMARY_DARK = '#0D47A1';
const PRIMARY_LIGHT = '#E3F2FD';
const SUCCESS = '#2E7D32';
const WARNING = '#E65100';

function StatCard({ label, value, color, bg }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg || '#FFFFFF' }]}>
      <Text style={[styles.statValue, { color: color || PRIMARY }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function OrderRow({ order }) {
  const statusColors = {
    pending: '#FF8F00',
    kot_generated: '#1565C0',
    billed: '#6A1B9A',
    paid: '#2E7D32',
    cancelled: '#C62828',
  };
  const statusLabels = {
    pending: 'Pending',
    kot_generated: 'KOT',
    billed: 'Billed',
    paid: 'Paid',
    cancelled: 'Cancelled',
  };
  const color = statusColors[order.status] || '#757575';
  const label = statusLabels[order.status] || order.status;

  return (
    <View style={styles.orderRow}>
      <View style={styles.orderRowLeft}>
        <Text style={styles.orderTable}>
          {order.table_name || order.table?.name || 'Take Away'}
        </Text>
        <Text style={styles.orderTime}>
          {order.created_at
            ? new Date(order.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
      <Text style={styles.orderTotal}>
        ₹{parseFloat(order.total_amount || 0).toFixed(2)}
      </Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    today_sale: 0,
    today_bills: 0,
    active_tables: 0,
    active_orders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, ordersRes] = await Promise.all([
        getDashboard().catch(() => ({ data: {} })),
        getOrders({ limit: 5, ordering: '-created_at' }).catch(() => ({ data: [] })),
      ]);

      const dash = dashRes.data || {};
      setStats({
        today_sale: dash.today_sale || 0,
        today_bills: dash.today_bills || 0,
        active_tables: dash.active_tables || 0,
        active_orders: dash.active_orders || 0,
      });

      const orders = Array.isArray(ordersRes.data)
        ? ordersRes.data
        : ordersRes.data?.results || [];
      setRecentOrders(orders.slice(0, 5));
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load dashboard data');
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Restaurant Billing</Text>
          <Text style={styles.headerSubtitle}>Point of Sale System</Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>LIVE</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY]}
            tintColor={PRIMARY}
          />
        }
      >
        {/* Stats Section */}
        <Text style={styles.sectionTitle}>TODAY'S OVERVIEW</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Today's Sale"
            value={`₹${parseFloat(stats.today_sale).toFixed(0)}`}
            color={SUCCESS}
            bg="#F1F8E9"
          />
          <StatCard
            label="Today's Bills"
            value={String(stats.today_bills)}
            color={PRIMARY}
            bg={PRIMARY_LIGHT}
          />
          <StatCard
            label="Active Tables"
            value={String(stats.active_tables)}
            color={WARNING}
            bg="#FFF3E0"
          />
          <StatCard
            label="Active Orders"
            value={String(stats.active_orders)}
            color="#6A1B9A"
            bg="#F3E5F5"
          />
        </View>

        {/* Recent Orders */}
        <Text style={styles.sectionTitle}>RECENT ORDERS</Text>
        <View style={styles.card}>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No recent orders</Text>
          ) : (
            recentOrders.map((order, idx) => (
              <View key={order.id || idx}>
                <OrderRow order={order} />
                {idx < recentOrders.length - 1 && <View style={styles.divider} />}
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* ── Bottom Bar ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, styles.reportBtn]}
          onPress={() => navigation.navigate('TodayReport')}
          activeOpacity={0.85}
        >
          <Text style={styles.reportBtnText}>📊 TODAY'S REPORT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBtn, styles.newBillButton]}
          onPress={() => navigation.navigate('Tables')}
          activeOpacity={0.85}
        >
          <Text style={styles.newBillIcon}>+</Text>
          <Text style={styles.newBillText}>NEW BILL</Text>
        </TouchableOpacity>
      </View>
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#BBDEFB',
    fontSize: 12,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#90A4AE',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  // inner card style applied inline via bg prop
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  orderRowLeft: {
    flex: 1,
  },
  orderTable: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  orderTime: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#212121',
    minWidth: 70,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9E9E9E',
    padding: 24,
    fontSize: 14,
  },
  bottomSpacer: {
    height: 20,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    gap: 8,
  },
  bottomBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  reportBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  reportBtnText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  newBillButton: {
    backgroundColor: PRIMARY,
  },
  newBillIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '300',
    marginRight: 6,
    lineHeight: 22,
  },
  newBillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
