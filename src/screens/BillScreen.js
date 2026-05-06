import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { getBill } from '../api/api';
import BillReceipt from '../components/BillReceipt';

const PRIMARY = '#1565C0';

export default function BillScreen({ route, navigation }) {
  const { billData: initialBillData, orderId } = route.params || {};

  const [bill, setBill]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Always fetch fresh bill from server so order_detail.items are populated
  useEffect(() => {
    const loadBill = async () => {
      try {
        // Use bill id from initialBillData if available
        const billId = initialBillData?.id;
        if (billId) {
          const res = await getBill(billId);
          setBill(res.data);
        } else if (initialBillData) {
          // fallback: use what was passed
          setBill(initialBillData);
        }
      } catch (err) {
        // fallback to passed data on error
        if (initialBillData) setBill(initialBillData);
        else Alert.alert('Error', err.message || 'Failed to load bill');
      } finally {
        setLoading(false);
      }
    };
    loadBill();
  }, []);

  // ── Print ──────────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!bill) return;
    const orderDetail = bill.order_detail || {};
    const items = orderDetail.items || [];
    const itemLines = items
      .map((item) => {
        const name = item.menu_item_detail?.name || item.name || 'Item';
        const qty  = item.quantity || 1;
        const rate = parseFloat(item.price || 0);
        return `  ${name.padEnd(20)} x${qty}  ₹${(qty * rate).toFixed(2)}`;
      })
      .join('\n');

    const total = parseFloat(bill.total_amount || 0).toFixed(2);

    Alert.alert(
      `🖨  Bill #${bill.bill_number}`,
      `Table: ${orderDetail.table_name || 'Take Away'}\n` +
      `─────────────────────────\n` +
      `${itemLines}\n` +
      `─────────────────────────\n` +
      `TOTAL:  ₹${total}\n` +
      `Payment: ${bill.payment_mode || 'CASH'}`,
      [
        { text: 'Print', onPress: () => Alert.alert('✅ Sent to Printer', 'Bill sent to printer successfully!') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // ── Share ──────────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!bill) return;
    try {
      const orderDetail = bill.order_detail || {};
      const items = orderDetail.items || [];
      const itemLines = items
        .map((item) => {
          const name = item.menu_item_detail?.name || item.name || 'Item';
          const qty  = item.quantity || 1;
          const rate = parseFloat(item.price || 0);
          return `${name} x${qty} = ₹${(qty * rate).toFixed(2)}`;
        })
        .join('\n');

      const total = parseFloat(bill.total_amount || 0).toFixed(2);
      const message =
        `Bill #${bill.bill_number}\n` +
        `Table: ${orderDetail.table_name || 'Take Away'}\n\n` +
        `${itemLines}\n\n` +
        `TOTAL: ₹${total}\n` +
        `Payment: ${bill.payment_mode || 'CASH'}`;

      await Share.share({ message, title: 'Restaurant Bill' });
    } catch {
      Alert.alert('Error', 'Could not share bill');
    }
  };

  // ── New Bill ───────────────────────────────────────────────────────────
  const handleNewBill = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'TablesHome' }],
    });
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading bill...</Text>
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Bill not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const total = parseFloat(bill.total_amount || 0);
  const orderDetail = bill.order_detail || {};
  const itemCount = (orderDetail.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Bill #{bill.bill_number}</Text>
          <Text style={styles.headerSubtitle}>
            {orderDetail.table_name || 'Take Away'} · {itemCount} items
          </Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>⬆</Text>
        </TouchableOpacity>
      </View>

      {/* ── Paid badge ── */}
      <View style={[styles.paidBanner, { backgroundColor: bill.is_paid ? '#E8F5E9' : '#FFF3E0' }]}>
        <Text style={[styles.paidBannerText, { color: bill.is_paid ? '#2E7D32' : '#E65100' }]}>
          {bill.is_paid ? '✅ PAID' : '⏳ PAYMENT PENDING'}
          {'   '}TOTAL: ₹{total.toFixed(2)}
        </Text>
      </View>

      {/* ── Receipt ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptWrapper}>
          <BillReceipt bill={bill} />
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* ── Action Buttons ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.actionBtn, styles.printBtn]} onPress={handlePrint}>
          <Text style={styles.printBtnText}>🖨  PRINT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.newBillBtn]} onPress={handleNewBill}>
          <Text style={styles.newBillBtnText}>+ NEW BILL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#757575', fontSize: 14 },
  errorText:   { fontSize: 16, color: '#757575', marginBottom: 16 },
  backLink:    { padding: 12 },
  backLinkText:{ color: PRIMARY, fontSize: 15, fontWeight: '600' },

  header: {
    backgroundColor: PRIMARY,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn:     { padding: 8, marginRight: 4 },
  backBtnText: { color: '#FFFFFF', fontSize: 28, lineHeight: 28, fontWeight: '300' },
  headerCenter:{ flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#BBDEFB', fontSize: 12, marginTop: 1 },
  shareBtn:    { padding: 8 },
  shareBtnText:{ color: '#FFFFFF', fontSize: 20 },

  paidBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  paidBannerText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  receiptWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderTopWidth: 4,
    borderTopColor: PRIMARY,
  },

  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  printBtnText: { color: PRIMARY, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  newBillBtn:   { backgroundColor: PRIMARY },
  newBillBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
