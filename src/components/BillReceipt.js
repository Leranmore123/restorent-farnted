import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#1565C0';

function Divider({ dashed }) {
  if (dashed) {
    return (
      <Text style={styles.dashedLine}>
        {'- - - - - - - - - - - - - - - - - - - - - - - - - - - - -'}
      </Text>
    );
  }
  return <View style={styles.solidLine} />;
}

export default function BillReceipt({ bill }) {
  // ── Load restaurant info from AsyncStorage ─────────────────────────────
  // Hooks must be called unconditionally (before any early return)
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('@restaurant_info')
      .then((raw) => {
        if (raw) setRestaurantInfo(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  if (!bill) return null;

  // ── Extract all fields from bill response ──────────────────────────────
  const orderDetail = bill.order_detail || {};

  const billNumber  = bill.bill_number || bill.id || '—';
  const createdAt   = bill.created_at || new Date().toISOString();
  const tableName   = orderDetail.table_name || 'Take Away';
  const customerName = orderDetail.customer_name || '';
  const paymentMode = bill.payment_mode || 'CASH';

  const subtotal       = parseFloat(bill.subtotal       || 0);
  const taxPercent     = parseFloat(bill.tax_percent    || 0);
  const taxAmount      = parseFloat(bill.tax_amount     || 0);
  const discount       = parseFloat(bill.discount       || 0);
  const total          = parseFloat(bill.total_amount   || 0);
  const amtReceived    = parseFloat(bill.amount_received|| 0);
  const changeAmt      = parseFloat(bill.change_amount  || 0);

  // Items live inside order_detail.items
  const items = orderDetail.items || [];

  const dateObj = new Date(createdAt);
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.receipt}>

      {/* ── Restaurant header ── */}
      <Text style={styles.restaurantName}>
        🍽  {restaurantInfo?.name || 'Restaurant'}
      </Text>
      {restaurantInfo?.address1 ? (
        <Text style={styles.restaurantAddress}>{restaurantInfo.address1}</Text>
      ) : null}
      {restaurantInfo?.address2 ? (
        <Text style={styles.restaurantAddress}>{restaurantInfo.address2}</Text>
      ) : null}
      {restaurantInfo?.phone ? (
        <Text style={styles.restaurantAddress}>📞 {restaurantInfo.phone}</Text>
      ) : null}
      {restaurantInfo?.gstin ? (
        <Text style={styles.restaurantAddress}>GSTIN: {restaurantInfo.gstin}</Text>
      ) : null}
      <Text style={styles.receiptLabel}>TAX INVOICE</Text>
      <Divider dashed />

      {/* ── Bill info ── */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Bill #: {billNumber}</Text>
        <Text style={styles.infoText}>{dateStr}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoTextBold}>Table: {tableName}</Text>
        <Text style={styles.infoText}>{timeStr}</Text>
      </View>
      {customerName ? (
        <Text style={styles.infoText}>Customer: {customerName}</Text>
      ) : null}

      <Divider dashed />

      {/* ── Column headers ── */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colItem,  styles.colHead]}>ITEM</Text>
        <Text style={[styles.colQty,   styles.colHead]}>QTY</Text>
        <Text style={[styles.colRate,  styles.colHead]}>RATE</Text>
        <Text style={[styles.colTotal, styles.colHead]}>AMT</Text>
      </View>
      <Divider />

      {/* ── Items ── */}
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No items</Text>
      ) : (
        items.map((item, idx) => {
          // name: menu_item_detail.name  OR  menu_item.name  OR  item.name
          const name  = item.menu_item_detail?.name
                     || item.menu_item?.name
                     || item.name
                     || 'Item';
          const qty   = parseInt(item.quantity || 1);
          const rate  = parseFloat(item.price || item.menu_item_detail?.price || 0);
          const amt   = qty * rate;
          return (
            <View key={item.id || idx} style={styles.itemRow}>
              <Text style={styles.colItem} numberOfLines={2}>{name}</Text>
              <Text style={styles.colQty}>{qty}</Text>
              <Text style={styles.colRate}>{rate.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{amt.toFixed(2)}</Text>
            </View>
          );
        })
      )}

      <Divider />

      {/* ── Totals ── */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>₹{subtotal.toFixed(2)}</Text>
      </View>
      {taxAmount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Tax{taxPercent > 0 ? ` (${taxPercent}%)` : ''}
          </Text>
          <Text style={styles.totalValue}>₹{taxAmount.toFixed(2)}</Text>
        </View>
      )}
      {discount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount</Text>
          <Text style={[styles.totalValue, { color: '#2E7D32' }]}>
            -₹{discount.toFixed(2)}
          </Text>
        </View>
      )}

      <Divider />

      {/* ── Grand total ── */}
      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalLabel}>TOTAL</Text>
        <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
      </View>

      <Divider dashed />

      {/* ── Payment ── */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Payment Mode</Text>
        <Text style={styles.totalValue}>{paymentMode}</Text>
      </View>
      {amtReceived > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Amount Received</Text>
          <Text style={styles.totalValue}>₹{amtReceived.toFixed(2)}</Text>
        </View>
      )}
      {changeAmt > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Change</Text>
          <Text style={[styles.totalValue, { color: '#2E7D32' }]}>
            ₹{changeAmt.toFixed(2)}
          </Text>
        </View>
      )}

      <Divider dashed />
      <Text style={styles.footer}>Thank you for dining with us!</Text>
      <Text style={styles.footer}>Please visit again 🙏</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  receipt: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: PRIMARY,
    marginBottom: 4,
    letterSpacing: 1,
  },
  receiptLabel: {
    fontSize: 11,
    textAlign: 'center',
    color: '#757575',
    letterSpacing: 2,
    marginBottom: 8,
  },
  restaurantAddress: {
    fontSize: 12,
    textAlign: 'center',
    color: '#616161',
    marginBottom: 2,
  },
  dashedLine: {
    color: '#BDBDBD',
    fontSize: 10,
    textAlign: 'center',
    marginVertical: 6,
    letterSpacing: 1,
  },
  solidLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  infoText: { fontSize: 12, color: '#424242' },
  infoTextBold: { fontSize: 13, fontWeight: '700', color: '#212121' },
  emptyText: { textAlign: 'center', color: '#9E9E9E', padding: 16 },

  // Table columns
  tableHeader: { flexDirection: 'row', paddingVertical: 4 },
  colHead: { fontSize: 11, fontWeight: '700', color: '#757575', letterSpacing: 0.5 },
  colItem:  { flex: 2,   fontSize: 13, color: '#212121' },
  colQty:   { width: 32, fontSize: 13, color: '#212121', textAlign: 'center' },
  colRate:  { width: 62, fontSize: 13, color: '#212121', textAlign: 'right' },
  colTotal: { width: 72, fontSize: 13, color: '#212121', textAlign: 'right' },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },

  // Totals
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 13, color: '#424242' },
  totalValue: { fontSize: 13, fontWeight: '600', color: '#212121' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  grandTotalLabel: { fontSize: 17, fontWeight: '700', color: '#212121' },
  grandTotalValue: { fontSize: 20, fontWeight: '700', color: PRIMARY },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
});
