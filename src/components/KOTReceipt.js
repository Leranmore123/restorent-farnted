import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

export default function KOTReceipt({ kot, order }) {
  if (!kot && !order) return null;

  const data = kot || {};
  const orderData = order || data.order || {};

  const kotNumber = data.kot_number || data.id || '—';
  const createdAt = data.created_at || data.date || new Date().toISOString();
  const tableName =
    data.table_name ||
    orderData.table_name ||
    orderData.table?.name ||
    (data.order && data.order.table_name) ||
    'Take Away';

  // items_snapshot is the backend field; fall back to order items
  const items =
    data.items_snapshot ||
    data.items ||
    orderData.items ||
    orderData.order_items ||
    [];
  const notes = data.notes || orderData.notes || '';

  const dateObj = new Date(createdAt);
  const dateStr = dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.receipt}>
      {/* Header */}
      <Text style={styles.kotTitle}>KITCHEN ORDER TICKET</Text>
      <Text style={styles.kotSubtitle}>KOT</Text>
      <Divider dashed />

      {/* KOT Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>KOT #: {kotNumber}</Text>
        <Text style={styles.infoText}>{dateStr}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={[styles.infoText, styles.tableText]}>Table: {tableName}</Text>
        <Text style={styles.infoText}>{timeStr}</Text>
      </View>

      <Divider dashed />

      {/* Column Headers */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colItem, styles.colHeaderText]}>ITEM</Text>
        <Text style={[styles.colQty, styles.colHeaderText]}>QTY</Text>
        <Text style={[styles.colNotes, styles.colHeaderText]}>NOTES</Text>
      </View>
      <Divider />

      {/* Items */}
      {items.length === 0 ? (
        <Text style={styles.emptyText}>No items</Text>
      ) : (
        items.map((item, idx) => {
          const name = item.name || item.menu_item?.name || 'Item';
          const qty = parseInt(item.quantity || 1);
          const itemNotes = item.notes || item.special_instructions || '';
          return (
            <View key={item.id || idx} style={styles.itemRow}>
              <Text style={styles.colItem} numberOfLines={2}>
                {name}
              </Text>
              <Text style={[styles.colQty, styles.qtyBold]}>{qty}</Text>
              <Text style={styles.colNotes} numberOfLines={2}>
                {itemNotes}
              </Text>
            </View>
          );
        })
      )}

      <Divider dashed />

      {notes ? (
        <>
          <Text style={styles.notesLabel}>Special Instructions:</Text>
          <Text style={styles.notesText}>{notes}</Text>
          <Divider dashed />
        </>
      ) : null}

      <Text style={styles.footer}>— Kitchen Copy —</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  receipt: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  kotTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: '#212121',
    letterSpacing: 1,
    marginBottom: 2,
  },
  kotSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#757575',
    letterSpacing: 3,
    marginBottom: 8,
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
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#424242',
  },
  tableText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#212121',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  colHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 0.5,
  },
  colItem: { flex: 2, fontSize: 13, color: '#212121' },
  colQty: { width: 40, fontSize: 13, color: '#212121', textAlign: 'center' },
  colNotes: { flex: 1, fontSize: 11, color: '#757575' },
  qtyBold: { fontWeight: '700', fontSize: 16 },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9E9E9E',
    padding: 16,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#757575',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#212121',
    marginBottom: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
    letterSpacing: 1,
  },
});
