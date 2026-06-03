import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const PRIMARY    = '#1565C0';
const HOLD_COLOR = '#F57C00';

// ─── Live Timer ───────────────────────────────────────────────────────────────
function LiveTimer({ startTime, isActive }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime || !isActive) {
      setElapsed(0);
      return;
    }

    const start = new Date(startTime).getTime();

    const update = () => {
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    };

    update(); // immediate
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, isActive]);

  if (!isActive || !startTime) return null;

  const hrs  = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;

  // Color based on time: green < 30min, orange 30-60min, red > 60min
  const timerColor =
    elapsed < 1800 ? '#2E7D32' :
    elapsed < 3600 ? '#E65100' :
    '#C62828';

  const label =
    hrs > 0
      ? `${hrs}h ${String(mins).padStart(2,'0')}m`
      : `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

  return (
    <View style={[timerStyles.container, { borderColor: timerColor + '40', backgroundColor: timerColor + '12' }]}>
      <Text style={timerStyles.icon}>⏱</Text>
      <Text style={[timerStyles.time, { color: timerColor }]}>{label}</Text>
    </View>
  );
}

const timerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    gap: 3,
  },
  icon: { fontSize: 10 },
  time: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});

// ─── TableCard ────────────────────────────────────────────────────────────────
export default function TableCard({ table, onPress }) {
  const isOccupied  = table.is_occupied;
  const status      = table.active_order_status;
  const total       = table.active_order_total ? parseFloat(table.active_order_total).toFixed(0) : null;
  const itemCount   = table.active_order_item_count || 0;
  const orderTime   = table.active_order_created_at || null;
  const isHold      = status === 'HOLD';

  // Timer active only when order is pending/KOT/hold (not billed/paid)
  const timerActive = isOccupied && ['PENDING','HOLD','KOT'].includes(status);

  const cardStyle  = isHold ? styles.cardHold : isOccupied ? styles.cardOccupied : styles.cardAvailable;
  const dotColor   = isHold ? HOLD_COLOR : isOccupied ? '#E53935' : '#43A047';
  const badgeBg    = isHold ? '#FFF3E0' : isOccupied ? '#FFEBEE' : '#E8F5E9';
  const badgeColor = isHold ? HOLD_COLOR : isOccupied ? '#C62828' : '#2E7D32';
  const badgeLabel = isHold ? '⏸ ON HOLD' : isOccupied ? 'OCCUPIED' : 'AVAILABLE';

  return (
    <TouchableOpacity
      style={[styles.card, cardStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Status dot */}
      <View style={[styles.statusDot, { backgroundColor: dotColor }]} />

      {/* Table name */}
      <Text style={[
        styles.tableName,
        isOccupied && !isHold && styles.tableNameOccupied,
        isHold && styles.tableNameHold,
      ]}>
        {table.name || `Table ${table.id}`}
      </Text>

      {/* Capacity */}
      {table.capacity > 0 && (
        <Text style={styles.capacity}>Seats {table.capacity}</Text>
      )}

      {/* Status badge */}
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
      </View>

      {/* Order info */}
      {isOccupied && total && (
        <View style={styles.orderInfo}>
          <Text style={[styles.orderTotal, { color: isHold ? HOLD_COLOR : '#E53935' }]}>
            ₹{total}
          </Text>
          {itemCount > 0 && (
            <Text style={styles.orderItems}>{itemCount} items</Text>
          )}
        </View>
      )}

      {/* ⏱ Live Timer */}
      <LiveTimer startTime={orderTime} isActive={timerActive} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  cardAvailable: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#A5D6A7',
  },
  cardOccupied: {
    backgroundColor: '#FFF8F8',
    borderWidth: 2,
    borderColor: '#EF9A9A',
  },
  cardHold: {
    backgroundColor: '#FFFDE7',
    borderWidth: 2,
    borderColor: '#FFB74D',
  },
  statusDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tableName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 2,
    textAlign: 'center',
  },
  tableNameOccupied: { color: '#B71C1C' },
  tableNameHold:     { color: HOLD_COLOR },
  capacity: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  orderInfo: {
    alignItems: 'center',
    marginTop: 6,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderItems: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 1,
  },
});
