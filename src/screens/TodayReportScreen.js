import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
  DeviceEventEmitter,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTodayReport, deleteBill } from '../api/api';

const PRIMARY = '#1565C0';
const GREEN   = '#2E7D32';
const ORANGE  = '#E65100';

const MODE_COLORS = {
  CASH:   { bg: '#E8F5E9', color: '#2E7D32', icon: '💵' },
  UPI:    { bg: '#E3F2FD', color: '#1565C0', icon: '📱' },
  CARD:   { bg: '#F3E5F5', color: '#6A1B9A', icon: '💳' },
  CHEQUE: { bg: '#FFF3E0', color: '#E65100', icon: '📄' },
};

export default function TodayReportScreen({ navigation }) {
  const [report,     setReport]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      const res = await getTodayReport();
      setReport(res.data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load report');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteBill = (bill) => {
    Alert.alert(
      'Delete Bill',
      `Delete ${bill.bill_number}?\nOrder will be reset to pending and can be re-billed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBill(bill.id);
              // Broadcast to all screens
              DeviceEventEmitter.emit('BILL_DELETED');
              // Refresh this screen
              setLoading(true);
              fetchReport();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete bill');
            }
          },
        },
      ]
    );
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchReport();
  }, []));

  const onRefresh = () => { setRefreshing(true); fetchReport(); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading report...</Text>
      </View>
    );
  }

  const totalSales = parseFloat(report?.total_sales || 0);
  const totalBills = report?.total_bills || 0;
  const breakdown  = report?.payment_breakdown || [];
  const bills      = report?.recent_bills || [];

  // Today's date formatted
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Today's Sale Report</Text>
          <Text style={styles.headerSubtitle}>{dateStr}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />}
      >

        {/* ── Total Sale Card ── */}
        <View style={styles.totalCard}>
          <Text style={styles.totalCardLabel}>TOTAL SALE TODAY</Text>
          <Text style={styles.totalCardAmount}>₹{totalSales.toFixed(2)}</Text>
          <View style={styles.totalCardRow}>
            <View style={styles.totalCardStat}>
              <Text style={styles.totalCardStatValue}>{totalBills}</Text>
              <Text style={styles.totalCardStatLabel}>Bills</Text>
            </View>
            <View style={styles.totalCardDivider} />
            <View style={styles.totalCardStat}>
              <Text style={styles.totalCardStatValue}>
                {totalBills > 0 ? `₹${(totalSales / totalBills).toFixed(0)}` : '₹0'}
              </Text>
              <Text style={styles.totalCardStatLabel}>Avg Bill</Text>
            </View>
          </View>
        </View>

        {/* ── Item Sales Report Button ── */}
        <TouchableOpacity
          style={styles.itemReportBtn}
          onPress={() => navigation.navigate('ItemSalesReport')}
          activeOpacity={0.8}
        >
          <Text style={styles.itemReportIcon}>📦</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemReportTitle}>Item-wise Sales Report</Text>
            <Text style={styles.itemReportSub}>See which items sold most today</Text>
          </View>
          <Text style={styles.itemReportArrow}>›</Text>
        </TouchableOpacity>

        {/* ── Monthly & P&L Buttons ── */}
        <View style={styles.reportBtnRow}>
          <TouchableOpacity
            style={[styles.reportBtn, { backgroundColor: '#E8F5E9' }]}
            onPress={() => navigation.navigate('MonthlySales')}
            activeOpacity={0.8}
          >
            <Text style={styles.reportBtnIcon}>📅</Text>
            <Text style={[styles.reportBtnTitle, { color: '#2E7D32' }]}>Monthly Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reportBtn, { backgroundColor: '#FFF3E0' }]}
            onPress={() => navigation.navigate('ProfitLoss')}
            activeOpacity={0.8}
          >
            <Text style={styles.reportBtnIcon}>📈</Text>
            <Text style={[styles.reportBtnTitle, { color: '#E65100' }]}>Profit & Loss</Text>
          </TouchableOpacity>
        </View>

        {/* ── Payment Mode Breakdown ── */}
        <Text style={styles.sectionTitle}>PAYMENT MODE BREAKDOWN</Text>
        {breakdown.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No bills today</Text>
          </View>
        ) : (
          <View style={styles.breakdownGrid}>
            {breakdown.map((item) => {
              const cfg = MODE_COLORS[item.mode] || { bg: '#F5F5F5', color: '#757575', icon: '💰' };
              const pct = totalSales > 0
                ? ((parseFloat(item.total) / totalSales) * 100).toFixed(0)
                : 0;
              return (
                <View key={item.mode} style={[styles.breakdownCard, { backgroundColor: cfg.bg }]}>
                  <Text style={styles.breakdownIcon}>{cfg.icon}</Text>
                  <Text style={[styles.breakdownMode, { color: cfg.color }]}>{item.label}</Text>
                  <Text style={[styles.breakdownAmount, { color: cfg.color }]}>
                    ₹{parseFloat(item.total).toFixed(0)}
                  </Text>
                  <Text style={styles.breakdownCount}>{item.count} bill{item.count !== 1 ? 's' : ''}</Text>
                  <View style={styles.breakdownBarBg}>
                    <View style={[styles.breakdownBar, { width: `${pct}%`, backgroundColor: cfg.color }]} />
                  </View>
                  <Text style={[styles.breakdownPct, { color: cfg.color }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Bills List ── */}
        <Text style={styles.sectionTitle}>TODAY'S BILLS ({totalBills})</Text>
        {bills.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No bills generated today</Text>
          </View>
        ) : (
          <View style={styles.billsCard}>
            {/* Header row */}
            <View style={[styles.billRow, styles.billRowHeader]}>
              <Text style={[styles.billCol, styles.billColBill,  styles.billHeaderText]}>BILL #</Text>
              <Text style={[styles.billCol, styles.billColTable, styles.billHeaderText]}>TABLE</Text>
              <Text style={[styles.billCol, styles.billColItems, styles.billHeaderText]}>ITEMS</Text>
              <Text style={[styles.billCol, styles.billColMode,  styles.billHeaderText]}>MODE</Text>
              <Text style={[styles.billCol, styles.billColAmt,   styles.billHeaderText]}>AMOUNT</Text>
              <View style={{ width: 32 }} />
            </View>

            {bills.map((bill, idx) => {
              const orderDetail = bill.order_detail || {};
              const items       = orderDetail.items || [];
              const itemCount   = items.reduce((s, i) => s + (i.quantity || 1), 0);
              const tableName   = orderDetail.table_name || 'Take Away';
              const amount      = parseFloat(bill.total_amount || 0);
              const cfg         = MODE_COLORS[bill.payment_mode] || { color: '#757575' };
              const time        = bill.created_at
                ? new Date(bill.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <View
                  key={bill.id}
                  style={[styles.billRow, idx % 2 === 0 && styles.billRowEven]}
                >
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => navigation.navigate('Bill', { billData: bill })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.billCol, styles.billColBill]}>
                      <Text style={styles.billNumber}>{bill.bill_number}</Text>
                      <Text style={styles.billTime}>{time}</Text>
                    </View>
                    <Text style={[styles.billCol, styles.billColTable, styles.billText]} numberOfLines={1}>
                      {tableName}
                    </Text>
                    <Text style={[styles.billCol, styles.billColItems, styles.billText]}>
                      {itemCount}
                    </Text>
                    <Text style={[styles.billCol, styles.billColMode, { color: cfg.color, fontWeight: '700', fontSize: 11 }]}>
                      {bill.payment_mode}
                    </Text>
                    <Text style={[styles.billCol, styles.billColAmt, styles.billAmount]}>
                      ₹{amount.toFixed(0)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.billDeleteBtn}
                    onPress={() => handleDeleteBill(bill)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.billDeleteIcon}>🗑</Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* Total row */}
            <View style={styles.billTotalRow}>
              <Text style={styles.billTotalLabel}>TOTAL ({totalBills} bills)</Text>
              <Text style={styles.billTotalAmount}>₹{totalSales.toFixed(2)}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#757575', fontSize: 14 },

  header: {
    backgroundColor: PRIMARY, paddingTop: 48, paddingBottom: 16,
    paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center',
  },
  backBtn:        { padding: 8, marginRight: 4 },
  backBtnText:    { color: '#FFF', fontSize: 28, lineHeight: 28, fontWeight: '300' },
  headerCenter:   { flex: 1 },
  headerTitle:    { color: '#FFF', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#BBDEFB', fontSize: 11, marginTop: 2 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 14 },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: '#90A4AE',
    letterSpacing: 1, marginBottom: 10, marginTop: 6,
  },

  // Total card
  totalCard: {
    backgroundColor: PRIMARY, borderRadius: 16, padding: 20,
    marginBottom: 20, alignItems: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  totalCardLabel:  { color: '#BBDEFB', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 6 },
  totalCardAmount: { color: '#FFF', fontSize: 40, fontWeight: '700', marginBottom: 16 },
  totalCardRow:    { flexDirection: 'row', alignItems: 'center' },
  totalCardStat:   { alignItems: 'center', paddingHorizontal: 24 },
  totalCardStatValue: { color: '#FFF', fontSize: 22, fontWeight: '700' },
  totalCardStatLabel: { color: '#BBDEFB', fontSize: 12, marginTop: 2 },
  totalCardDivider:   { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },

  // Breakdown
  breakdownGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 16 },
  breakdownCard: {
    width: '48%', margin: '1%', borderRadius: 12, padding: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  breakdownIcon:   { fontSize: 24, marginBottom: 6 },
  breakdownMode:   { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  breakdownAmount: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  breakdownCount:  { fontSize: 11, color: '#757575', marginBottom: 8 },
  breakdownBarBg:  { height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, marginBottom: 4 },
  breakdownBar:    { height: 4, borderRadius: 2 },
  breakdownPct:    { fontSize: 11, fontWeight: '700' },

  // Empty
  emptyCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 24,
    alignItems: 'center', marginBottom: 16,
  },
  emptyText: { color: '#9E9E9E', fontSize: 14 },

  // Bills table
  billsCard: {
    backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    marginBottom: 16,
  },
  billRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  billRowHeader: { backgroundColor: '#E3F2FD', paddingVertical: 8 },
  billRowEven:   { backgroundColor: '#FAFAFA' },
  billHeaderText:{ fontSize: 10, fontWeight: '700', color: '#1565C0', letterSpacing: 0.5 },

  billCol:      { justifyContent: 'center' },
  billColBill:  { width: 80 },
  billColTable: { flex: 1 },
  billColItems: { width: 36, textAlign: 'center' },
  billColMode:  { width: 46, textAlign: 'center' },
  billColAmt:   { width: 64, textAlign: 'right' },

  billText:   { fontSize: 12, color: '#424242' },
  billNumber: { fontSize: 12, fontWeight: '700', color: '#212121' },
  billTime:   { fontSize: 10, color: '#9E9E9E', marginTop: 1 },
  billAmount: { fontSize: 13, fontWeight: '700', color: PRIMARY, textAlign: 'right' },

  billTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: '#E3F2FD', borderTopWidth: 2, borderTopColor: PRIMARY,
  },
  billTotalLabel:  { fontSize: 13, fontWeight: '700', color: '#212121' },
  billTotalAmount: { fontSize: 18, fontWeight: '700', color: PRIMARY },

  billDeleteBtn: {
    width: 32, alignItems: 'center', justifyContent: 'center', paddingVertical: 4,
  },
  billDeleteIcon: { fontSize: 15 },

  // Item Report Button
  itemReportBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#E8F0FE', borderRadius: 12,
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#C5D8FB',
    elevation: 1,
  },
  itemReportIcon:  { fontSize: 28, marginRight: 14 },
  itemReportTitle: { fontSize: 15, fontWeight: '700', color: PRIMARY },
  itemReportSub:   { fontSize: 12, color: '#5C85D6', marginTop: 2 },
  itemReportArrow: { fontSize: 26, color: PRIMARY, fontWeight: '300' },

  reportBtnRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  reportBtn: {
    flex: 1, borderRadius: 12, padding: 16, alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  reportBtnIcon:  { fontSize: 28, marginBottom: 6 },
  reportBtnTitle: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
