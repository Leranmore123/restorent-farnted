import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import apiClient from '../api/api';

const PRIMARY = '#1565C0';

export default function ItemSalesReportScreen({ navigation }) {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiClient.get('/reports/item-sales/?date=today');
      setData(res.data);
    } catch (err) {
      console.error('Item sales report error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReport();
    }, [])
  );

  const renderItem = ({ item, index }) => (
    <View style={[styles.row, index % 2 === 0 && styles.rowAlt]}>
      <View style={styles.rankWrap}>
        <Text style={styles.rank}>#{index + 1}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.itemCat}>{item.category}</Text>
      </View>
      <View style={styles.qtyWrap}>
        <Text style={styles.qty}>{item.quantity}</Text>
        <Text style={styles.qtyLabel}>qty</Text>
      </View>
      <View style={styles.amountWrap}>
        <Text style={styles.amount}>₹{parseFloat(item.total_amount).toFixed(2)}</Text>
      </View>
    </View>
  );

  const today = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Item Sales Report</Text>
          <Text style={styles.headerDate}>{today}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading report...</Text>
        </View>
      ) : !data || data.items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No sales today yet.</Text>
        </View>
      ) : (
        <FlatList
          data={data.items}
          keyExtractor={(item) => String(item.item_id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchReport(true)}
              colors={[PRIMARY]}
            />
          }
          ListHeaderComponent={
            <>
              {/* Summary cards */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryValue}>{data.grand_total_qty}</Text>
                  <Text style={styles.summaryLabel}>Total Items Sold</Text>
                </View>
                <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                  <Text style={[styles.summaryValue, styles.summaryValueGreen]}>
                    ₹{parseFloat(data.grand_total_amount).toFixed(2)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                </View>
              </View>

              {/* Table header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: 36 }]}>#</Text>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>ITEM</Text>
                <Text style={[styles.tableHeaderText, { width: 50, textAlign: 'center' }]}>QTY</Text>
                <Text style={[styles.tableHeaderText, { width: 90, textAlign: 'right' }]}>AMOUNT</Text>
              </View>
            </>
          }
          ListFooterComponent={<View style={{ height: 32 }} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F4F8' },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { marginTop: 12, color: '#9E9E9E', fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#9E9E9E', fontWeight: '500' },

  /* Header */
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 48,
    paddingBottom: 14,
    elevation: 4,
  },
  backBtn: { width: 70, paddingHorizontal: 8 },
  backText: { color: '#FFF', fontSize: 17, fontWeight: '500' },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'center',
  },
  headerDate: {
    fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 2,
  },

  listContent: { padding: 16 },

  /* Summary */
  summaryRow: {
    flexDirection: 'row', gap: 12, marginBottom: 16,
  },
  summaryCard: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 12,
    padding: 16, alignItems: 'center',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  summaryCardGreen: { backgroundColor: '#E8F5E9' },
  summaryValue: {
    fontSize: 24, fontWeight: '800', color: PRIMARY,
  },
  summaryValueGreen: { color: '#2E7D32' },
  summaryLabel: {
    fontSize: 11, color: '#9E9E9E', marginTop: 4,
    fontWeight: '600', letterSpacing: 0.5,
  },

  /* Table header */
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#E3F2FD', borderRadius: 8, marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 11, fontWeight: '700', color: PRIMARY, letterSpacing: 0.8,
  },

  /* Rows */
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 12,
    borderRadius: 8, marginBottom: 3,
  },
  rowAlt: { backgroundColor: '#FAFAFA' },
  rankWrap: { width: 36 },
  rank: { fontSize: 12, color: '#BDBDBD', fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#212121' },
  itemCat: { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  qtyWrap: { width: 50, alignItems: 'center' },
  qty: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  qtyLabel: { fontSize: 10, color: '#9E9E9E' },
  amountWrap: { width: 90, alignItems: 'flex-end' },
  amount: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
});
