import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getOrder, updateOrder, generateKOT, generateBill } from '../api/api';

const PRIMARY = '#1565C0';

const PAYMENT_MODES = [
  { key: 'CASH', label: 'Cash' },
  { key: 'UPI', label: 'UPI/Bank' },
  { key: 'CARD', label: 'Card/POS' },
  { key: 'CHEQUE', label: 'Cheque' },
];

export default function OrderDetailsScreen({ route, navigation }) {
  const { orderId } = route.params || {};

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState('0');
  const [taxPercent, setTaxPercent] = useState('0');
  const [paymentMode, setPaymentMode] = useState('CASH');

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await getOrder(orderId);
      const data = res.data;
      setOrder(data);
      setDiscount(String(data.discount || '0'));
      setTaxPercent(String(data.tax_percent || '0'));
      setPaymentMode(data.payment_mode || 'CASH');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getItems = () => {
    if (!order) return [];
    return order.items || order.order_items || [];
  };

  const getSubtotal = () => {
    return getItems().reduce((sum, item) => {
      const price = parseFloat(item.price || item.menu_item?.price || 0);
      const qty = parseInt(item.quantity || 1);
      return sum + price * qty;
    }, 0);
  };

  const subtotal = getSubtotal();
  const taxAmount = (subtotal * parseFloat(taxPercent || 0)) / 100;
  const discountAmount = parseFloat(discount || 0);
  const grandTotal = subtotal + taxAmount - discountAmount;

  const handleGenerateKOT = async () => {
    setSaving(true);
    try {
      await updateOrder(orderId, {
        discount: discountAmount,
        tax_percent: parseFloat(taxPercent),
        payment_mode: paymentMode,
      });
      const kotRes = await generateKOT(orderId);
      const kot = kotRes.data;
      Alert.alert('KOT Generated', `KOT #${kot.kot_number || orderId} sent to kitchen!`, [
        {
          text: 'View KOT',
          onPress: () => navigation.navigate('KOT', { kotData: kot, orderId }),
        },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to generate KOT');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBill = async () => {
    setSaving(true);
    try {
      await updateOrder(orderId, {
        discount: discountAmount,
        tax_percent: parseFloat(taxPercent),
        payment_mode: paymentMode,
      });
      const billRes = await generateBill(orderId, { payment_mode: paymentMode });
      navigation.navigate('Bill', { billData: billRes.data, orderId });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to generate bill');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tableName = order.table_name || order.table?.name || 'Take Away';
  const items = getItems();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <Text style={styles.headerSubtitle}>#{order.id} · {tableName}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Table / Customer Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Table</Text>
            <Text style={styles.infoValue}>{tableName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order #</Text>
            <Text style={styles.infoValue}>{order.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, styles.statusText]}>
              {(order.status || 'pending').toUpperCase()}
            </Text>
          </View>
          {order.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>
                {new Date(order.created_at).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>ORDER ITEMS</Text>
        <View style={styles.itemsCard}>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>No items in this order</Text>
          ) : (
            items.map((oi, idx) => {
              const name = oi.name || oi.menu_item?.name || 'Item';
              const price = parseFloat(oi.price || oi.menu_item?.price || 0);
              const qty = parseInt(oi.quantity || 1);
              return (
                <View key={oi.id || idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.itemQty}>x{qty}</Text>
                  <Text style={styles.itemPrice}>₹{(price * qty).toFixed(2)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Pricing */}
        <Text style={styles.sectionTitle}>PRICING</Text>
        <View style={styles.pricingCard}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Subtotal</Text>
            <Text style={styles.pricingValue}>₹{subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Tax (%)</Text>
            <TextInput
              style={styles.pricingInput}
              value={taxPercent}
              onChangeText={setTaxPercent}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            <Text style={styles.pricingValue}>₹{taxAmount.toFixed(2)}</Text>
          </View>

          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Discount (₹)</Text>
            <TextInput
              style={styles.pricingInput}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
              placeholder="0"
            />
            <Text style={[styles.pricingValue, { color: '#2E7D32' }]}>
              -₹{discountAmount.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.pricingRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalAmount}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment Mode */}
        <Text style={styles.sectionTitle}>PAYMENT MODE</Text>
        <View style={styles.paymentCard}>
          <View style={styles.paymentGrid}>
            {PAYMENT_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[
                  styles.paymentBtn,
                  paymentMode === mode.key && styles.paymentBtnActive,
                ]}
                onPress={() => setPaymentMode(mode.key)}
              >
                <Text
                  style={[
                    styles.paymentBtnText,
                    paymentMode === mode.key && styles.paymentBtnTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.kotBtn]}
          onPress={handleGenerateKOT}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionBtnText}>GENERATE KOT</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.billBtn]}
          onPress={handleGenerateBill}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionBtnText}>GENERATE BILL</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#757575', fontSize: 14 },
  errorText: { fontSize: 16, color: '#757575', marginBottom: 16 },
  backLink: { padding: 12 },
  backLinkText: { color: PRIMARY, fontSize: 15, fontWeight: '600' },
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { padding: 8, marginRight: 4 },
  backBtnText: { color: '#FFFFFF', fontSize: 28, lineHeight: 28, fontWeight: '300' },
  headerCenter: { flex: 1 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#BBDEFB', fontSize: 12, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#90A4AE',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: { fontSize: 13, color: '#9E9E9E' },
  infoValue: { fontSize: 13, fontWeight: '600', color: '#212121' },
  statusText: { color: PRIMARY },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemName: { flex: 1, fontSize: 14, color: '#212121' },
  itemQty: { fontSize: 13, color: '#757575', marginHorizontal: 12, minWidth: 30, textAlign: 'center' },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#212121', minWidth: 70, textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#9E9E9E', padding: 20 },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  pricingLabel: { flex: 1, fontSize: 14, color: '#424242' },
  pricingInput: {
    width: 70,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 13,
    textAlign: 'right',
    marginRight: 12,
    color: '#212121',
  },
  pricingValue: { fontSize: 14, fontWeight: '600', color: '#212121', minWidth: 80, textAlign: 'right' },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 4,
    paddingTop: 12,
  },
  totalLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#212121' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: -4 },
  paymentBtn: {
    margin: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paymentBtnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  paymentBtnText: { fontSize: 13, fontWeight: '600', color: '#757575' },
  paymentBtnTextActive: { color: '#FFFFFF' },
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
  kotBtn: { backgroundColor: '#E65100' },
  billBtn: { backgroundColor: PRIMARY },
  actionBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
