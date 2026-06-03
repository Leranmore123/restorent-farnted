import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  StatusBar, ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMonthlyReport, getItemSalesReport } from '../api/api';

const PRIMARY = '#1565C0';
const MODE_COLORS = {
  CASH: '#2E7D32', UPI: '#1565C0', CARD: '#6A1B9A', CHEQUE: '#E65100',
};

export default function MonthlySalesScreen({ navigation }) {
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [data, setData]           = useState(null);
  const [itemData, setItemData]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]             = useState('summary'); // 'summary' | 'daily' | 'items'

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        getMonthlyReport(currentMonth),
        getItemSalesReport({ month: currentMonth }),
      ]);
      setData(r1.data);
      setItemData(r2.data);
    } catch (err) {
      console.error(err.message);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, []));

  const renderDayRow = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.row, index % 2 === 0 && styles.rowAlt]}
      onPress={() => navigation.navigate('DailySales', { initialDate: item.date })}
      activeOpacity={0.7}
    >
      <Text style={styles.dayDate}>{new Date(item.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
      <Text style={styles.dayDay}>{new Date(item.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</Text>
      <Text style={styles.dayBills}>{item.bills} bills</Text>
      <Text style={styles.dayAmt}>₹{parseFloat(item.sales).toFixed(0)}</Text>
      <Text style={{ color: '#BDBDBD', fontSize: 16 }}>›</Text>
    </TouchableOpacity>
  );

  const renderItemRow = ({ item, index }) => (
    <View style={[styles.row, index % 2 === 0 && styles.rowAlt]}>
      <Text style={styles.itemRank}>#{index + 1}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.item_name}</Text>
        <Text style={styles.itemCat}>{item.category}</Text>
      </View>
      <Text style={styles.itemQty}>{item.quantity}</Text>
      <Text style={styles.itemAmt}>₹{parseFloat(item.total_amount).toFixed(0)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Monthly Sales Report</Text>
          <Text style={styles.headerSub}>{data?.month || currentMonth}</Text>
        </View>
        {/* Navigate to date-wise report */}
        <TouchableOpacity
          onPress={() => navigation.navigate('DailySales')}
          style={styles.dateBtn}
        >
          <Text style={styles.dateBtnIcon}>📅</Text>
          <Text style={styles.dateBtnText}>Date{'\n'}Report</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['summary', 'daily', 'items'].map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'summary' ? 'Summary' : t === 'daily' ? 'Day-wise' : 'Items'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={PRIMARY} /></View>
      ) : tab === 'summary' ? (
        <FlatList
          data={data?.payment_breakdown || []}
          keyExtractor={(item) => item.mode}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} colors={[PRIMARY]} />}
          ListHeaderComponent={
            <>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryCard, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={styles.summaryVal}>₹{parseFloat(data?.total_sales || 0).toFixed(2)}</Text>
                  <Text style={styles.summaryLbl}>Total Sales</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>{data?.total_bills || 0}</Text>
                  <Text style={styles.summaryLbl}>Total Bills</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>₹{parseFloat(data?.avg_daily_sales || 0).toFixed(0)}</Text>
                  <Text style={styles.summaryLbl}>Avg/Day</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>₹{parseFloat(data?.total_discount || 0).toFixed(0)}</Text>
                  <Text style={styles.summaryLbl}>Discount</Text>
                </View>
              </View>
              <Text style={styles.sectionTitle}>PAYMENT BREAKDOWN</Text>
            </>
          }
          renderItem={({ item: p }) => (
            <View style={styles.payRow}>
              <Text style={[styles.payMode, { color: MODE_COLORS[p.mode] || '#757575' }]}>{p.label}</Text>
              <Text style={styles.payCount}>{p.count} bills</Text>
              <Text style={[styles.payAmt, { color: MODE_COLORS[p.mode] || '#757575' }]}>₹{parseFloat(p.total).toFixed(2)}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : tab === 'daily' ? (
        <FlatList
          data={data?.daily_breakdown || []}
          keyExtractor={(item) => item.date}
          renderItem={renderDayRow}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} colors={[PRIMARY]} />}
          ListHeaderComponent={
            <View style={styles.tableHead}>
              <Text style={[styles.thText, { width: 60 }]}>DATE</Text>
              <Text style={[styles.thText, { width: 40 }]}>DAY</Text>
              <Text style={[styles.thText, { flex: 1 }]}>BILLS</Text>
              <Text style={[styles.thText, { width: 80, textAlign: 'right' }]}>SALES</Text>
            </View>
          }
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No data</Text></View>}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          data={itemData?.items || []}
          keyExtractor={(item) => String(item.item_id)}
          renderItem={renderItemRow}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} colors={[PRIMARY]} />}
          ListHeaderComponent={
            <>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>{itemData?.grand_total_qty || 0}</Text>
                  <Text style={styles.summaryLbl}>Items Sold</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
                  <Text style={[styles.summaryVal, { color: '#2E7D32' }]}>₹{parseFloat(itemData?.grand_total_amount || 0).toFixed(2)}</Text>
                  <Text style={styles.summaryLbl}>Revenue</Text>
                </View>
              </View>
              <View style={styles.tableHead}>
                <Text style={[styles.thText, { width: 30 }]}>#</Text>
                <Text style={[styles.thText, { flex: 1 }]}>ITEM</Text>
                <Text style={[styles.thText, { width: 50, textAlign: 'center' }]}>QTY</Text>
                <Text style={[styles.thText, { width: 80, textAlign: 'right' }]}>AMOUNT</Text>
              </View>
            </>
          }
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No items sold</Text></View>}
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
    paddingHorizontal: 8, paddingTop: 48, paddingBottom: 14, elevation: 4,
  },
  backBtn: { width: 70, paddingHorizontal: 8 },
  backText: { color: '#FFF', fontSize: 17, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', textAlign: 'center' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 2 },
  dateBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: 70,
  },
  dateBtnIcon: { fontSize: 18 },
  dateBtnText: { color: '#FFF', fontSize: 9, fontWeight: '700', textAlign: 'center', marginTop: 2 },

  tabs: { flexDirection: 'row', backgroundColor: '#FFF', elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: PRIMARY },
  tabText: { fontSize: 13, fontWeight: '600', color: '#9E9E9E' },
  tabTextActive: { color: PRIMARY },

  listContent: { padding: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#78909C', letterSpacing: 1, marginBottom: 8, marginTop: 4 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  summaryCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#FFF', borderRadius: 12,
    padding: 14, alignItems: 'center', elevation: 2,
  },
  summaryVal: { fontSize: 20, fontWeight: '800', color: PRIMARY },
  summaryLbl: { fontSize: 11, color: '#9E9E9E', marginTop: 4 },

  payRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 8, marginBottom: 6, elevation: 1,
  },
  payMode: { flex: 1, fontSize: 14, fontWeight: '700' },
  payCount: { fontSize: 12, color: '#9E9E9E', width: 60 },
  payAmt: { fontSize: 15, fontWeight: '700', width: 90, textAlign: 'right' },

  tableHead: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 4,
  },
  thText: { fontSize: 10, fontWeight: '700', color: PRIMARY, letterSpacing: 0.5 },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 10, paddingVertical: 11, borderRadius: 8, marginBottom: 3,
  },
  rowAlt: { backgroundColor: '#FAFAFA' },

  dayDate: { width: 60, fontSize: 13, fontWeight: '700', color: '#212121' },
  dayDay:  { width: 40, fontSize: 12, color: '#9E9E9E' },
  dayBills:{ flex: 1, fontSize: 12, color: '#757575' },
  dayAmt:  { width: 80, fontSize: 14, fontWeight: '700', color: PRIMARY, textAlign: 'right' },

  itemRank: { width: 30, fontSize: 12, color: '#BDBDBD', fontWeight: '700' },
  itemName: { fontSize: 13, fontWeight: '600', color: '#212121' },
  itemCat:  { fontSize: 11, color: '#9E9E9E' },
  itemQty:  { width: 50, fontSize: 16, fontWeight: '800', color: PRIMARY, textAlign: 'center' },
  itemAmt:  { width: 80, fontSize: 13, fontWeight: '700', color: '#2E7D32', textAlign: 'right' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#9E9E9E' },
});
