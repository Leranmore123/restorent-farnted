import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  StatusBar, ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProfitLossReport } from '../api/api';

const PRIMARY = '#1565C0';
const GREEN   = '#2E7D32';
const RED     = '#C62828';

export default function ProfitLossScreen({ navigation }) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod]     = useState('monthly'); // 'daily' | 'monthly'

  const fetchReport = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const params = period === 'daily'
        ? { date: today.toISOString().split('T')[0] }
        : { month: currentMonth };
      const res = await getProfitLossReport(params);
      setData(res.data);
    } catch (err) {
      console.error(err.message);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchReport(); }, [period]));

  const renderItem = ({ item, index }) => {
    const profit = parseFloat(item.profit);
    const isProfit = profit >= 0;
    return (
      <View style={[styles.row, index % 2 === 0 && styles.rowAlt]}>
        <Text style={styles.rank}>#{index + 1}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <Text style={styles.itemSub}>Qty: {item.qty} · Cost: ₹{parseFloat(item.cost).toFixed(0)}</Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={styles.itemRev}>₹{parseFloat(item.revenue).toFixed(0)}</Text>
          <Text style={[styles.itemProfit, { color: isProfit ? GREEN : RED }]}>
            {isProfit ? '+' : ''}₹{profit.toFixed(0)}
          </Text>
        </View>
      </View>
    );
  };

  const netProfit   = parseFloat(data?.net_profit || 0);
  const grossProfit = parseFloat(data?.gross_profit || 0);
  const isProfit    = netProfit >= 0;
  const margin      = parseFloat(data?.profit_margin || 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Profit & Loss</Text>
          <Text style={styles.headerSub}>{data?.period || ''}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* Period toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, period === 'daily' && styles.toggleBtnActive]}
          onPress={() => setPeriod('daily')}
        >
          <Text style={[styles.toggleText, period === 'daily' && styles.toggleTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, period === 'monthly' && styles.toggleBtnActive]}
          onPress={() => setPeriod('monthly')}
        >
          <Text style={[styles.toggleText, period === 'monthly' && styles.toggleTextActive]}>This Month</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={PRIMARY} /></View>
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(item) => String(item.item_id)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchReport(true)} colors={[PRIMARY]} />}
          ListHeaderComponent={
            <>
              {/* P&L Summary Card */}
              <View style={[styles.plCard, { backgroundColor: isProfit ? '#E8F5E9' : '#FFEBEE' }]}>
                <Text style={styles.plCardLabel}>NET PROFIT / LOSS</Text>
                <Text style={[styles.plCardAmount, { color: isProfit ? GREEN : RED }]}>
                  {isProfit ? '+' : ''}₹{netProfit.toFixed(2)}
                </Text>
                <Text style={[styles.plMargin, { color: isProfit ? GREEN : RED }]}>
                  Margin: {margin}%
                </Text>
              </View>

              {/* Breakdown */}
              <View style={styles.breakdownCard}>
                <View style={styles.breakRow}>
                  <Text style={styles.breakLabel}>Total Revenue</Text>
                  <Text style={[styles.breakVal, { color: PRIMARY }]}>₹{parseFloat(data?.total_revenue || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.breakDivider} />
                <View style={styles.breakRow}>
                  <Text style={styles.breakLabel}>Total Cost</Text>
                  <Text style={[styles.breakVal, { color: RED }]}>- ₹{parseFloat(data?.total_cost || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.breakDivider} />
                <View style={styles.breakRow}>
                  <Text style={styles.breakLabel}>Gross Profit</Text>
                  <Text style={[styles.breakVal, { color: grossProfit >= 0 ? GREEN : RED }]}>₹{grossProfit.toFixed(2)}</Text>
                </View>
                <View style={styles.breakDivider} />
                <View style={styles.breakRow}>
                  <Text style={styles.breakLabel}>Discount Given</Text>
                  <Text style={[styles.breakVal, { color: '#E65100' }]}>- ₹{parseFloat(data?.total_discount || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.breakDivider} />
                <View style={styles.breakRow}>
                  <Text style={styles.breakLabel}>Tax Collected</Text>
                  <Text style={[styles.breakVal, { color: '#757575' }]}>₹{parseFloat(data?.total_tax || 0).toFixed(2)}</Text>
                </View>
              </View>

              {/* Note if no cost prices set */}
              {parseFloat(data?.total_cost || 0) === 0 && (
                <View style={styles.noteCard}>
                  <Text style={styles.noteText}>
                    ⚠️ Cost prices not set for menu items. Go to Menu Items settings to add cost prices for accurate P&L.
                  </Text>
                </View>
              )}

              {/* Item table header */}
              {(data?.items || []).length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>ITEM-WISE P&L</Text>
                  <View style={styles.tableHead}>
                    <Text style={[styles.thText, { width: 30 }]}>#</Text>
                    <Text style={[styles.thText, { flex: 1 }]}>ITEM</Text>
                    <Text style={[styles.thText, { width: 70, textAlign: 'right' }]}>REVENUE</Text>
                    <Text style={[styles.thText, { width: 70, textAlign: 'right' }]}>PROFIT</Text>
                  </View>
                </>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No sales data for this period</Text>
            </View>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 14, elevation: 4,
  },
  backBtn: { width: 70, paddingHorizontal: 8 },
  backText: { color: '#FFF', fontSize: 17, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 2 },

  toggle: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 1 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  toggleBtnActive: { borderBottomColor: PRIMARY },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#9E9E9E' },
  toggleTextActive: { color: PRIMARY },

  listContent: { padding: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#78909C', letterSpacing: 1, marginBottom: 8, marginTop: 4 },

  plCard: {
    borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  plCardLabel:  { fontSize: 12, fontWeight: '700', color: '#757575', letterSpacing: 1, marginBottom: 8 },
  plCardAmount: { fontSize: 42, fontWeight: '800', marginBottom: 4 },
  plMargin:     { fontSize: 14, fontWeight: '600' },

  breakdownCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  breakDivider: { height: 1, backgroundColor: '#F5F5F5' },
  breakLabel: { fontSize: 14, color: '#424242', fontWeight: '500' },
  breakVal:   { fontSize: 15, fontWeight: '700' },

  noteCard: {
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 14, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: '#FFC107',
  },
  noteText: { fontSize: 13, color: '#5D4037', lineHeight: 20 },

  tableHead: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 4,
  },
  thText: { fontSize: 10, fontWeight: '700', color: PRIMARY, letterSpacing: 0.5 },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 10, paddingVertical: 12, borderRadius: 8, marginBottom: 3,
  },
  rowAlt: { backgroundColor: '#FAFAFA' },
  rank: { width: 30, fontSize: 12, color: '#BDBDBD', fontWeight: '700' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#212121' },
  itemSub:  { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  itemRev:   { fontSize: 12, color: '#757575' },
  itemProfit:{ fontSize: 14, fontWeight: '800' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#9E9E9E' },
});
