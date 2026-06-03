import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, SafeAreaView,
  StatusBar, ActivityIndicator, TouchableOpacity, RefreshControl,
  Alert, TextInput, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDailyReport, getItemSalesReport, deleteBill } from '../api/api';

const PRIMARY = '#1565C0';
const DANGER  = '#C62828';

const MODE_COLORS = {
  CASH:   '#2E7D32', UPI: '#1565C0', CARD: '#6A1B9A', CHEQUE: '#E65100',
};

// ─── Simple date picker component ─────────────────────────────────────────────
function DatePickerModal({ visible, selectedDate, onSelect, onClose }) {
  const today = new Date();
  const [year,  setYear]  = useState(String(new Date(selectedDate).getFullYear()));
  const [month, setMonth] = useState(String(new Date(selectedDate).getMonth() + 1).padStart(2, '0'));
  const [day,   setDay]   = useState(String(new Date(selectedDate).getDate()).padStart(2, '0'));

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  const handleConfirm = () => {
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);
    if (!m || !d || !y || m < 1 || m > 12 || d < 1 || d > 31) {
      Alert.alert('Invalid Date', 'Please enter a valid date.');
      return;
    }
    const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    onSelect(dateStr);
    onClose();
  };

  // Quick date shortcuts
  const shortcuts = [];
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    shortcuts.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      date: d.toISOString().split('T')[0],
    });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dpStyles.overlay}>
        <View style={dpStyles.container}>
          <View style={dpStyles.header}>
            <Text style={dpStyles.title}>📅 Select Date</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={dpStyles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Quick shortcuts */}
          <Text style={dpStyles.sectionLabel}>QUICK SELECT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dpStyles.shortcuts}>
            {shortcuts.map((s) => (
              <TouchableOpacity
                key={s.date}
                style={[dpStyles.shortcut, s.date === selectedDate && dpStyles.shortcutActive]}
                onPress={() => { onSelect(s.date); onClose(); }}
              >
                <Text style={[dpStyles.shortcutText, s.date === selectedDate && dpStyles.shortcutTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Manual date input */}
          <Text style={dpStyles.sectionLabel}>ENTER DATE</Text>
          <View style={dpStyles.inputRow}>
            <View style={dpStyles.inputGroup}>
              <Text style={dpStyles.inputLabel}>DAY</Text>
              <TextInput
                style={dpStyles.input}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="DD"
              />
            </View>
            <View style={dpStyles.inputGroup}>
              <Text style={dpStyles.inputLabel}>MONTH</Text>
              <TextInput
                style={dpStyles.input}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="MM"
              />
            </View>
            <View style={dpStyles.inputGroup}>
              <Text style={dpStyles.inputLabel}>YEAR</Text>
              <TextInput
                style={[dpStyles.input, { width: 80 }]}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="YYYY"
              />
            </View>
          </View>
          <Text style={dpStyles.preview}>
            {month && day && year ? `${day}/${month}/${year}` : ''}
          </Text>

          <TouchableOpacity style={dpStyles.confirmBtn} onPress={handleConfirm}>
            <Text style={dpStyles.confirmText}>VIEW REPORT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dpStyles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container:  { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title:      { fontSize: 18, fontWeight: '700', color: '#212121' },
  close:      { fontSize: 18, color: '#9E9E9E', padding: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', letterSpacing: 1, marginBottom: 8 },
  shortcuts:  { marginBottom: 16 },
  shortcut:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  shortcutActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  shortcutText:   { fontSize: 12, fontWeight: '600', color: '#757575' },
  shortcutTextActive: { color: '#FFF' },
  inputRow:   { flexDirection: 'row', gap: 12, marginBottom: 8 },
  inputGroup: { alignItems: 'center' },
  inputLabel: { fontSize: 10, fontWeight: '700', color: '#9E9E9E', marginBottom: 4 },
  input:      { width: 60, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 10, fontSize: 16, fontWeight: '700', textAlign: 'center', color: '#212121', backgroundColor: '#FAFAFA' },
  preview:    { fontSize: 14, color: PRIMARY, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  confirmBtn: { backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  confirmText:{ color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DailySalesScreen({ navigation, route }) {
  const today = new Date().toISOString().split('T')[0];
  const { initialDate } = route.params || {};

  const [selectedDate,  setSelectedDate]  = useState(initialDate || today);
  const [data,          setData]          = useState(null);
  const [itemData,      setItemData]      = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [showPicker,    setShowPicker]    = useState(false);
  const [activeTab,     setActiveTab]     = useState('bills'); // 'bills' | 'items'

  const fetchReport = async (date = selectedDate, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      // Feature 3, 5, 6: Fetch both bills and item sales for selected date
      const [billRes, itemRes] = await Promise.all([
        getDailyReport(date),
        getItemSalesReport({ date }),
      ]);
      setData(billRes.data);
      setItemData(itemRes.data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load report');
    } finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchReport(selectedDate); }, [selectedDate]));

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchReport(date);
  };

  const handleDeleteBill = (bill) => {
    Alert.alert('Delete Bill', `Delete ${bill.bill_number}? Order will be reset to pending.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(bill.id);
            fetchReport(selectedDate);
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete bill');
          }
        },
      },
    ]);
  };

  // Feature 6: Day-by-day bill list
  const renderBill = ({ item, index }) => {
    const orderDetail = item.order_detail || {};
    const tableName   = orderDetail.table_name || 'Take Away';
    const items       = orderDetail.items || [];
    const itemCount   = items.reduce((s, i) => s + (i.quantity || 1), 0);
    const amount      = parseFloat(item.total_amount || 0);
    const modeColor   = MODE_COLORS[item.payment_mode] || '#757575';
    const time        = item.created_at
      ? new Date(item.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.billRow, index % 2 === 0 && styles.billRowAlt]}>
        <View style={styles.billLeft}>
          <Text style={styles.billNum}>{item.bill_number}</Text>
          <Text style={styles.billTime}>{time}</Text>
        </View>
        <Text style={styles.billTable} numberOfLines={1}>{tableName}</Text>
        <Text style={styles.billItems}>{itemCount} items</Text>
        <Text style={[styles.billMode, { color: modeColor }]}>{item.payment_mode}</Text>
        <Text style={styles.billAmt}>₹{amount.toFixed(0)}</Text>
        <TouchableOpacity onPress={() => handleDeleteBill(item)} style={styles.delBtn}>
          <Text style={styles.delBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Feature 5 & 6: Item sales for the selected date
  const renderItem = ({ item, index }) => (
    <View style={[styles.itemRow, index % 2 === 0 && styles.billRowAlt]}>
      <Text style={styles.itemRank}>{index + 1}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
        <Text style={styles.itemCat}>{item.category}</Text>
      </View>
      <Text style={styles.itemQty}>{item.quantity} qty</Text>
      <Text style={styles.itemAmt}>₹{parseFloat(item.total_amount || 0).toFixed(0)}</Text>
    </View>
  );

  const dateLabel = (() => {
    const d = new Date(selectedDate + 'T00:00:00');
    if (selectedDate === today) return 'Today — ' + d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' });
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (selectedDate === yesterday.toISOString().split('T')[0]) return 'Yesterday — ' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Sales Report</Text>
          <Text style={styles.headerSub} numberOfLines={1}>{dateLabel}</Text>
        </View>
        {/* Feature 3, 5: Date picker button */}
        <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePickerBtn}>
          <Text style={styles.datePickerIcon}>📅</Text>
          <Text style={styles.datePickerText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Tab: Bills / Items */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bills' && styles.tabActive]}
          onPress={() => setActiveTab('bills')}
        >
          <Text style={[styles.tabText, activeTab === 'bills' && styles.tabTextActive]}>
            🧾 Bills ({data?.total_bills || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'items' && styles.tabActive]}
          onPress={() => setActiveTab('items')}
        >
          <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
            📦 Items Sold ({itemData?.items?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={PRIMARY} /></View>
      ) : (
        <FlatList
          data={activeTab === 'bills' ? (data?.bills || []) : (itemData?.items || [])}
          keyExtractor={(item, idx) => String(item.id || item.item_id || idx)}
          renderItem={activeTab === 'bills' ? renderBill : renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchReport(selectedDate, true)} colors={[PRIMARY]} />}
          ListHeaderComponent={
            <>
              {/* Summary cards */}
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>₹{parseFloat(data?.total_sales || 0).toFixed(0)}</Text>
                  <Text style={styles.summaryLbl}>Total Sales</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>{data?.total_bills || 0}</Text>
                  <Text style={styles.summaryLbl}>Bills</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>{itemData?.grand_total_qty || 0}</Text>
                  <Text style={styles.summaryLbl}>Items Sold</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>₹{parseFloat(data?.total_discount || 0).toFixed(0)}</Text>
                  <Text style={styles.summaryLbl}>Discount</Text>
                </View>
              </View>

              {/* Payment breakdown */}
              {(data?.payment_breakdown || []).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>PAYMENT BREAKDOWN</Text>
                  {(data.payment_breakdown).map((p) => (
                    <View key={p.mode} style={styles.payRow}>
                      <Text style={[styles.payMode, { color: MODE_COLORS[p.mode] || '#757575' }]}>{p.label}</Text>
                      <Text style={styles.payCount}>{p.count} bills</Text>
                      <Text style={[styles.payAmt, { color: MODE_COLORS[p.mode] || '#757575' }]}>₹{parseFloat(p.total).toFixed(2)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Table header */}
              {activeTab === 'bills' ? (
                <>
                  <Text style={styles.sectionTitle}>ALL BILLS ({data?.total_bills || 0})</Text>
                  <View style={styles.tableHead}>
                    <Text style={[styles.thText, { flex: 1 }]}>BILL / TIME</Text>
                    <Text style={[styles.thText, { flex: 1 }]}>TABLE</Text>
                    <Text style={[styles.thText, { width: 55 }]}>ITEMS</Text>
                    <Text style={[styles.thText, { width: 46 }]}>MODE</Text>
                    <Text style={[styles.thText, { width: 56, textAlign: 'right' }]}>AMT</Text>
                    <View style={{ width: 32 }} />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>ITEMS SOLD ({itemData?.items?.length || 0})</Text>
                  <View style={styles.tableHead}>
                    <Text style={[styles.thText, { width: 28 }]}>#</Text>
                    <Text style={[styles.thText, { flex: 1 }]}>ITEM</Text>
                    <Text style={[styles.thText, { width: 70 }]}>QTY</Text>
                    <Text style={[styles.thText, { width: 70, textAlign: 'right' }]}>AMOUNT</Text>
                  </View>
                </>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'bills' ? 'No bills on this date' : 'No items sold on this date'}
              </Text>
            </View>
          }
          ListFooterComponent={
            activeTab === 'items' && itemData?.grand_total_amount ? (
              <View style={styles.grandTotal}>
                <Text style={styles.grandTotalLabel}>TOTAL ITEMS SOLD: {itemData.grand_total_qty}</Text>
                <Text style={styles.grandTotalAmt}>₹{parseFloat(itemData.grand_total_amount).toFixed(2)}</Text>
              </View>
            ) : <View style={{ height: 32 }} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showPicker}
        selectedDate={selectedDate}
        onSelect={handleDateSelect}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: '#F0F4F8' },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 14, elevation: 4,
  },
  backBtn:  { width: 70, paddingHorizontal: 8 },
  backText: { color: '#FFF', fontSize: 17, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  headerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  datePickerBtn: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  datePickerIcon: { fontSize: 18 },
  datePickerText: { color: '#FFF', fontSize: 10, fontWeight: '600' },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive:     { borderBottomColor: PRIMARY },
  tabText:       { fontSize: 13, fontWeight: '600', color: '#9E9E9E' },
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

  section: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 16, elevation: 1 },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  payMode:  { flex: 1, fontSize: 14, fontWeight: '700' },
  payCount: { fontSize: 12, color: '#9E9E9E', width: 60 },
  payAmt:   { fontSize: 15, fontWeight: '700', width: 90, textAlign: 'right' },

  tableHead: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginBottom: 4,
  },
  thText: { fontSize: 10, fontWeight: '700', color: PRIMARY, letterSpacing: 0.5 },

  // Bills
  billRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, marginBottom: 3,
  },
  billRowAlt: { backgroundColor: '#FAFAFA' },
  billLeft:   { flex: 1 },
  billNum:    { fontSize: 12, fontWeight: '700', color: '#212121' },
  billTime:   { fontSize: 10, color: '#9E9E9E' },
  billTable:  { flex: 1, fontSize: 12, color: '#424242' },
  billItems:  { width: 55, fontSize: 11, color: '#757575' },
  billMode:   { width: 46, fontSize: 11, fontWeight: '700' },
  billAmt:    { width: 56, fontSize: 13, fontWeight: '700', color: PRIMARY, textAlign: 'right' },
  delBtn:     { width: 32, alignItems: 'center' },
  delBtnText: { fontSize: 16 },

  // Items sold
  itemRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    paddingHorizontal: 10, paddingVertical: 10, borderRadius: 8, marginBottom: 3,
  },
  itemRank: { width: 28, fontSize: 12, fontWeight: '700', color: '#9E9E9E' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#212121' },
  itemCat:  { fontSize: 10, color: '#9E9E9E', marginTop: 1 },
  itemQty:  { width: 70, fontSize: 12, color: '#757575', textAlign: 'center' },
  itemAmt:  { width: 70, fontSize: 13, fontWeight: '700', color: PRIMARY, textAlign: 'right' },

  grandTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: PRIMARY, borderRadius: 10, padding: 14, margin: 4, marginTop: 8,
  },
  grandTotalLabel: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  grandTotalAmt:   { color: '#FFF', fontSize: 18, fontWeight: '800' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#9E9E9E' },
});
