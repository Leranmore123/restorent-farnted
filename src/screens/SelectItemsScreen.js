import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getMenuItemsGrouped,
  createOrder,
  updateOrder,
  getOrder,
  generateKOT,
  generateBill,
  holdOrder,
} from '../api/api';
import CategoryItemList from '../components/CategoryItemList';

const PRIMARY   = '#1565C0';
const HOLD_COLOR = '#F57C00';

const PAYMENT_MODES = [
  { key: 'CASH',   label: 'Cash'      },
  { key: 'UPI',    label: 'UPI/Bank'  },
  { key: 'CARD',   label: 'Card/POS'  },
  { key: 'CHEQUE', label: 'Cheque'    },
];

export default function SelectItemsScreen({ route, navigation }) {
  // Always read fresh from route.params via ref so closures stay current
  const paramsRef = useRef(route.params || {});
  paramsRef.current = route.params || {};

  const { tableId, tableName, orderId: existingOrderId, isTakeAway, existingOrderStatus } =
    route.params || {};

  const [groupedItems,    setGroupedItems]    = useState([]);
  const [selectedItems,   setSelectedItems]   = useState({});
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedCategory,setSelectedCategory]= useState(null);
  const [paymentMode,     setPaymentMode]     = useState('CASH');
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [orderId,         setOrderId]         = useState(existingOrderId || null);
  const [orderStatus,     setOrderStatus]     = useState(existingOrderStatus || null);
  const [showDetailsModal,setShowDetailsModal]= useState(false);
  const [showSearch,      setShowSearch]      = useState(false);

  // ─── Load menu + pre-fill held order items ────────────────────────────────
  const loadData = useCallback(async () => {
    // Always use latest params
    const { orderId: activeOrderId } = paramsRef.current;

    try {
      setLoading(true);

      // Load menu grouped by category
      const menuRes = await getMenuItemsGrouped().catch(() => ({ data: [] }));
      const grouped = Array.isArray(menuRes.data)
        ? menuRes.data
        : menuRes.data?.results || [];
      setGroupedItems(grouped);

      // If there is an existing order (held/active), load its items
      if (activeOrderId) {
        const orderRes = await getOrder(activeOrderId);
        const order    = orderRes.data;

        // Build selectedItems map from order items
        // Structure: { [menuItemId]: { item: {id, name, price}, quantity } }
        const preSelected = {};
        (order.items || []).forEach((oi) => {
          // menu_item_detail = { id, name, price }
          const detail = oi.menu_item_detail || {};
          const id     = detail.id || oi.menu_item;
          const name   = detail.name  || 'Item';
          const price  = detail.price || oi.price || '0';
          if (id) {
            preSelected[id] = {
              item: { id, name, price },
              quantity: oi.quantity || 1,
            };
          }
        });

        setSelectedItems(preSelected);
        setOrderId(order.id);
        setOrderStatus(order.status);
      } else {
        // Fresh order — reset
        setSelectedItems({});
        setOrderId(null);
        setOrderStatus(null);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  }, []); // stable — reads params via ref

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ─── Quantity change ──────────────────────────────────────────────────────
  const handleQuantityChange = (item, newQty) => {
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (newQty <= 0) {
        delete updated[item.id];
      } else {
        const existing = prev[item.id];
        updated[item.id] = {
          item,
          quantity: newQty,
          customPrice: existing?.customPrice,
        };
      }
      return updated;
    });
  };

  // Feature 4: Per-item price change
  const handlePriceChange = (item, newPrice) => {
    setSelectedItems((prev) => {
      const existing = prev[item.id];
      const qty = existing?.quantity || 1;
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: qty,
          customPrice: newPrice,
        },
      };
    });
  };

  // ─── Totals (use customPrice if set) ──────────────────────────────────────
  const total = useMemo(() =>
    Object.values(selectedItems).reduce(
      (sum, { item, quantity, customPrice }) =>
        sum + (customPrice != null ? customPrice : parseFloat(item.price || 0)) * quantity,
      0
    ), [selectedItems]);

  const itemCount = useMemo(() =>
    Object.values(selectedItems).reduce((sum, { quantity }) => sum + quantity, 0),
    [selectedItems]);

  // ─── Filtered menu ────────────────────────────────────────────────────────
  const filteredGroups = useMemo(() =>
    groupedItems
      .filter((g) => selectedCategory ? g.category?.id === selectedCategory : true)
      .map((g) => ({
        ...g,
        items: (g.items || []).filter((item) =>
          searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
        ),
      }))
      .filter((g) => g.items.length > 0),
    [groupedItems, searchQuery, selectedCategory]);

  const categories = useMemo(() =>
    groupedItems.map((g) => g.category).filter(Boolean),
    [groupedItems]);

  // ─── Build order payload ──────────────────────────────────────────────────
  const buildPayload = (statusOverride) => ({
    table:      tableId || null,
    order_type: isTakeAway ? 'TAKEAWAY' : 'DINE_IN',
    status:     statusOverride || 'PENDING',
    items: Object.values(selectedItems).map(({ item, quantity, customPrice }) => ({
      menu_item: item.id,
      quantity,
      // Feature 4: Send custom price if edited
      ...(customPrice != null ? { price: customPrice } : {}),
    })),
  });

  // ─── Save / update order ──────────────────────────────────────────────────
  const saveOrder = async (statusOverride) => {
    if (itemCount === 0) {
      Alert.alert('No Items', 'Please add at least one item.');
      return null;
    }
    const payload = buildPayload(statusOverride);
    if (orderId) {
      const res = await updateOrder(orderId, payload);
      setOrderStatus(res.data.status);
      return res.data.id;
    } else {
      const res = await createOrder(payload);
      setOrderId(res.data.id);
      setOrderStatus(res.data.status);
      return res.data.id;
    }
  };

  // ─── HOLD ─────────────────────────────────────────────────────────────────
  const handleHold = async () => {
    if (itemCount === 0) {
      Alert.alert('No Items', 'Please add at least one item before holding.');
      return;
    }
    setSaving(true);
    try {
      const savedId = await saveOrder('HOLD');
      if (!savedId) return;
      Alert.alert(
        '⏸ Order On Hold',
        `${tableName || 'Order'} is on hold with ${itemCount} item(s).\nCome back anytime to add more.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to hold order');
    } finally {
      setSaving(false);
    }
  };

  // ─── KOT ──────────────────────────────────────────────────────────────────
  const handleKOT = async () => {
    if (itemCount === 0) {
      Alert.alert('No Items', 'Please add at least one item.');
      return;
    }
    setSaving(true);
    try {
      const savedId = await saveOrder('KOT');
      if (!savedId) return;
      const kotRes = await generateKOT(savedId);
      const kot    = kotRes.data;
      Alert.alert(
        '✅ KOT Generated',
        `KOT #${kot.kot_number} sent to kitchen!`,
        [
          { text: 'View KOT', onPress: () => navigation.navigate('KOT', { kotData: kot, orderId: savedId }) },
          { text: 'Continue', style: 'cancel' },
        ]
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to generate KOT');
    } finally {
      setSaving(false);
    }
  };

  // ─── SAVE → Bill ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (itemCount === 0) {
      Alert.alert('No Items', 'Please add at least one item.');
      return;
    }
    setSaving(true);
    try {
      // 1. Save order with all current items
      const savedId = await saveOrder('BILLED');
      if (!savedId) return;

      // 2. Generate bill
      const billRes = await generateBill(savedId, { payment_mode: paymentMode });

      // 3. Go to bill screen
      navigation.navigate('Bill', { billData: billRes.data, orderId: savedId });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to generate bill');
    } finally {
      setSaving(false);
    }
  };

  // ─── Status badge ─────────────────────────────────────────────────────────
  const renderStatusBadge = () => {
    const cfg = {
      HOLD:    { label: '⏸ ON HOLD',  bg: '#FFF3E0', color: HOLD_COLOR },
      KOT:     { label: '🍳 KOT SENT', bg: '#E8F5E9', color: '#2E7D32' },
      PENDING: { label: '🕐 PENDING',  bg: '#E3F2FD', color: PRIMARY   },
    };
    const c = cfg[orderStatus];
    if (!c) return null;
    return (
      <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
        <Text style={[styles.statusBadgeText, { color: c.color }]}>{c.label}</Text>
      </View>
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Select Items</Text>
          <Text style={styles.headerSubtitle}>{tableName || 'Take Away'}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.searchBtn}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* ── Hold banner ── */}
      {orderStatus === 'HOLD' && (
        <View style={styles.holdBanner}>
          <Text style={styles.holdBannerText}>
            ⏸  ON HOLD — {itemCount} item(s) already added. Add more or SAVE to bill.
          </Text>
        </View>
      )}

      {/* ── Search ── */}
      {showSearch && (
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            placeholderTextColor="#9E9E9E"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Category filter ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity
          style={[styles.catChip, !selectedCategory && styles.catChipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.catChipText, !selectedCategory && styles.catChipTextActive]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.catChipText, selectedCategory === cat.id && styles.catChipTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Menu items ── */}
      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyMenu}>
            <Text style={styles.emptyMenuText}>
              {searchQuery ? 'No items match your search' : 'No menu items available'}
            </Text>
          </View>
        ) : (
          filteredGroups.map((group) => (
            <CategoryItemList
              key={group.category?.id || Math.random()}
              category={group.category}
              items={group.items || []}
              selectedItems={selectedItems}
              onQuantityChange={handleQuantityChange}
              onPriceChange={handlePriceChange}
            />
          ))
        )}
        <View style={{ height: 180 }} />
      </ScrollView>

      {/* ── Payment mode ── */}
      <View style={styles.paymentRow}>
        {PAYMENT_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[styles.paymentBtn, paymentMode === mode.key && styles.paymentBtnActive]}
            onPress={() => setPaymentMode(mode.key)}
          >
            <Text style={[styles.paymentBtnText, paymentMode === mode.key && styles.paymentBtnTextActive]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Bottom action bar ── */}
      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalLabel}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
            {renderStatusBadge()}
          </View>
          <Text style={styles.totalAmount}>₹{total.toFixed(2)}</Text>
        </View>

        <View style={styles.actionRow}>
          {/* HOLD */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnHold]}
            onPress={handleHold}
            disabled={saving}
          >
            <Text style={styles.actionBtnText}>⏸{'\n'}HOLD</Text>
          </TouchableOpacity>

          {/* KOT */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnKOT]}
            onPress={handleKOT}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.actionBtnText}>KOT</Text>
            }
          </TouchableOpacity>

          {/* SAVE */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSave]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Text style={styles.actionBtnText}>SAVE{'\n'}(₹{total.toFixed(0)})</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.detailsLink}
          onPress={() => {
            if (itemCount === 0) { Alert.alert('No Items', 'Add items first.'); return; }
            setShowDetailsModal(true);
          }}
        >
          <Text style={styles.detailsLinkText}>▼ VIEW ORDER DETAILS</Text>
        </TouchableOpacity>
      </View>

      {/* ── Order Details Modal ── */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Summary</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalTableRow}>
              <Text style={styles.modalTableName}>{tableName || 'Take Away'}</Text>
              {orderStatus === 'HOLD' && (
                <View style={styles.holdTag}>
                  <Text style={styles.holdTagText}>ON HOLD</Text>
                </View>
              )}
            </View>

            <ScrollView style={styles.modalScroll}>
              {Object.values(selectedItems).map(({ item, quantity }) => (
                <View key={item.id} style={styles.modalItem}>
                  <Text style={styles.modalItemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.modalItemQty}>×{quantity}</Text>
                  <Text style={styles.modalItemTotal}>
                    ₹{(parseFloat(item.price) * quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalDivider} />
            <View style={styles.modalTotalRow}>
              <Text style={styles.modalTotalLabel}>TOTAL</Text>
              <Text style={styles.modalTotalAmount}>₹{total.toFixed(2)}</Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: HOLD_COLOR }]}
                onPress={() => { setShowDetailsModal(false); handleHold(); }}
              >
                <Text style={styles.modalBtnText}>⏸ HOLD</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#E65100' }]}
                onPress={() => { setShowDetailsModal(false); handleKOT(); }}
              >
                <Text style={styles.modalBtnText}>KOT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: PRIMARY }]}
                onPress={() => { setShowDetailsModal(false); handleSave(); }}
              >
                <Text style={styles.modalBtnText}>BILL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F7FA' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 12, color: '#757575', fontSize: 14 },

  header: {
    backgroundColor: PRIMARY, paddingTop: 48, paddingBottom: 12,
    paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center',
  },
  backBtn:        { padding: 8, marginRight: 4 },
  backBtnText:    { color: '#FFF', fontSize: 28, lineHeight: 28, fontWeight: '300' },
  headerCenter:   { flex: 1 },
  headerTitle:    { color: '#FFF', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: '#BBDEFB', fontSize: 12, marginTop: 1 },
  searchBtn:      { padding: 8 },
  searchBtnText:  { fontSize: 20 },

  holdBanner: {
    backgroundColor: '#FFF3E0', paddingVertical: 8, paddingHorizontal: 16,
    borderBottomWidth: 2, borderBottomColor: HOLD_COLOR,
  },
  holdBannerText: { color: HOLD_COLOR, fontSize: 12, fontWeight: '600', textAlign: 'center' },

  searchBar: {
    backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#212121',
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: '#F5F5F5', borderRadius: 8,
  },
  clearBtn:     { padding: 8 },
  clearBtnText: { color: '#9E9E9E', fontSize: 14 },

  categoryScroll:        { backgroundColor: '#FFF', maxHeight: 44, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  categoryScrollContent: { paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 5, borderRadius: 16,
    backgroundColor: '#F5F5F5', marginRight: 8, borderWidth: 1, borderColor: '#E0E0E0',
  },
  catChipActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  catChipText:       { fontSize: 12, fontWeight: '600', color: '#757575' },
  catChipTextActive: { color: '#FFF' },

  menuScroll: { flex: 1 },
  emptyMenu:  { padding: 40, alignItems: 'center' },
  emptyMenuText: { color: '#9E9E9E', fontSize: 14 },

  paymentRow: {
    flexDirection: 'row', backgroundColor: '#FFF',
    paddingHorizontal: 8, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#E0E0E0',
  },
  paymentBtn: {
    flex: 1, marginHorizontal: 3, paddingVertical: 7, borderRadius: 6,
    alignItems: 'center', backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0',
  },
  paymentBtnActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  paymentBtnText:       { fontSize: 11, fontWeight: '600', color: '#757575' },
  paymentBtnTextActive: { color: '#FFF' },

  bottomBar: {
    backgroundColor: '#FFF', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: '#E0E0E0',
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  totalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalLabel: { fontSize: 13, color: '#757575', fontWeight: '500' },
  totalAmount:{ fontSize: 20, fontWeight: '700', color: PRIMARY },

  statusBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  actionRow: { flexDirection: 'row', marginBottom: 6 },
  actionBtn: {
    flex: 1, marginHorizontal: 3, paddingVertical: 12,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  actionBtnHold: { backgroundColor: HOLD_COLOR },
  actionBtnKOT:  { backgroundColor: '#E65100' },
  actionBtnSave: { backgroundColor: PRIMARY },
  actionBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },

  detailsLink:     { alignItems: 'center', paddingVertical: 4 },
  detailsLinkText: { color: '#9E9E9E', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '80%', paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#212121' },
  modalClose: { fontSize: 18, color: '#9E9E9E', padding: 4 },
  modalTableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#E3F2FD',
  },
  modalTableName: { fontSize: 14, color: PRIMARY, fontWeight: '600', flex: 1 },
  holdTag:        { backgroundColor: HOLD_COLOR, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  holdTagText:    { color: '#FFF', fontSize: 11, fontWeight: '700' },
  modalScroll:    { maxHeight: 280, paddingHorizontal: 16 },
  modalItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  modalItemName:  { flex: 1, fontSize: 14, color: '#212121' },
  modalItemQty:   { fontSize: 13, color: '#757575', marginHorizontal: 12, minWidth: 30, textAlign: 'center' },
  modalItemTotal: { fontSize: 14, fontWeight: '600', color: '#212121', minWidth: 70, textAlign: 'right' },
  modalDivider:   { height: 1, backgroundColor: '#E0E0E0', marginHorizontal: 16, marginVertical: 8 },
  modalTotalRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  modalTotalLabel:  { fontSize: 16, fontWeight: '700', color: '#212121' },
  modalTotalAmount: { fontSize: 20, fontWeight: '700', color: PRIMARY },
  modalActions: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  modalBtn:     { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});
