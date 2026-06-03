import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';

const PRIMARY = '#1565C0';

// ─── Price Edit Modal ─────────────────────────────────────────────────────────
function PriceEditModal({ visible, item, currentPrice, onSave, onClose }) {
  const [price, setPrice] = useState(String(currentPrice));

  const handleSave = () => {
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price.');
      return;
    }
    onSave(p);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={peStyles.overlay}>
        <View style={peStyles.container}>
          <Text style={peStyles.title}>Edit Price</Text>
          <Text style={peStyles.itemName}>{item?.name}</Text>
          <Text style={peStyles.originalPrice}>
            Menu price: ₹{parseFloat(item?.originalPrice || currentPrice).toFixed(2)}
          </Text>
          <TextInput
            style={peStyles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            selectTextOnFocus
            autoFocus
            placeholder="Enter price"
          />
          <View style={peStyles.btnRow}>
            <TouchableOpacity style={peStyles.cancelBtn} onPress={onClose}>
              <Text style={peStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={peStyles.saveBtn} onPress={handleSave}>
              <Text style={peStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const peStyles = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  container: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '80%', elevation: 10 },
  title:     { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 8 },
  itemName:  { fontSize: 14, color: '#424242', marginBottom: 4 },
  originalPrice: { fontSize: 12, color: '#9E9E9E', marginBottom: 16 },
  input: {
    borderWidth: 2, borderColor: PRIMARY, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 22, fontWeight: '700', color: PRIMARY, textAlign: 'center',
    marginBottom: 20,
  },
  btnRow:    { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center' },
  cancelText:{ fontSize: 14, fontWeight: '600', color: '#757575' },
  saveBtn:   { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: PRIMARY, alignItems: 'center' },
  saveText:  { fontSize: 14, fontWeight: '700', color: '#FFF' },
});

// ─── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, quantity, customPrice, onIncrease, onDecrease, onPriceEdit }) {
  const isSelected   = quantity > 0;
  const displayPrice = customPrice != null ? customPrice : parseFloat(item.price);
  const isPriceEdited = customPrice != null && customPrice !== parseFloat(item.price);

  return (
    <View style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
      <Text style={styles.itemName} numberOfLines={2}>
        {item.name}
      </Text>

      {/* Feature 4: Tap price to edit */}
      <TouchableOpacity onPress={() => onPriceEdit(item)} activeOpacity={0.7}>
        <View style={[styles.priceBox, isPriceEdited && styles.priceBoxEdited]}>
          <Text style={[styles.itemPrice, isPriceEdited && styles.itemPriceEdited]}>
            ₹{displayPrice.toFixed(2)}
          </Text>
          {isPriceEdited && <Text style={styles.editedBadge}>✏️</Text>}
        </View>
        <Text style={styles.editHint}>tap to edit</Text>
      </TouchableOpacity>

      {/* Quantity Controls */}
      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnMinus]}
          onPress={() => onDecrease(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>

        <View style={[styles.qtyDisplay, isSelected && styles.qtyDisplayActive]}>
          <Text style={[styles.qtyText, isSelected && styles.qtyTextActive]}>
            {quantity}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnPlus]}
          onPress={() => onIncrease(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.qtyBtnTextPlus}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Category Item List ───────────────────────────────────────────────────────
export default function CategoryItemList({
  category,
  items,
  selectedItems,
  onQuantityChange,
  onPriceChange,   // Feature 4: new prop
}) {
  const [editingItem,    setEditingItem]    = useState(null);
  const [priceModalVisible, setPriceModalVisible] = useState(false);

  if (!items || items.length === 0) return null;

  const handleIncrease = (item) => {
    const current = selectedItems[item.id]?.quantity || 0;
    onQuantityChange(item, current + 1);
  };

  const handleDecrease = (item) => {
    const current = selectedItems[item.id]?.quantity || 0;
    if (current > 0) onQuantityChange(item, current - 1);
  };

  const handlePriceEdit = (item) => {
    const sel = selectedItems[item.id];
    const currentPrice = sel?.customPrice ?? parseFloat(item.price);
    setEditingItem({ ...item, originalPrice: item.price, currentEditPrice: currentPrice });
    setPriceModalVisible(true);
  };

  const handlePriceSave = (newPrice) => {
    if (!editingItem) return;
    if (onPriceChange) {
      onPriceChange(editingItem, newPrice);
    }
    // Also add item with qty=1 if not selected yet
    if (!selectedItems[editingItem.id] || selectedItems[editingItem.id].quantity === 0) {
      onQuantityChange({ ...editingItem, price: String(newPrice) }, 1);
    }
  };

  return (
    <View style={styles.section}>
      {/* Category Header */}
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>
          {category?.name?.toUpperCase() || 'ITEMS'}
        </Text>
        <Text style={styles.categoryCount}>{items.length} items</Text>
      </View>

      {/* Items Grid */}
      <View style={styles.itemsGrid}>
        {items.map((item) => {
          const sel = selectedItems[item.id];
          return (
            <View key={item.id} style={styles.itemWrapper}>
              <ItemCard
                item={item}
                quantity={sel?.quantity || 0}
                customPrice={sel?.customPrice}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onPriceEdit={handlePriceEdit}
              />
            </View>
          );
        })}
      </View>

      {/* Price edit modal */}
      {editingItem && (
        <PriceEditModal
          visible={priceModalVisible}
          item={editingItem}
          currentPrice={editingItem.currentEditPrice}
          onSave={handlePriceSave}
          onClose={() => { setPriceModalVisible(false); setEditingItem(null); }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section:    { marginBottom: 8 },
  categoryHeader: {
    backgroundColor: '#1565C0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName:  { color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  categoryCount: { color: '#BBDEFB', fontSize: 11 },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  itemWrapper: { width: '33.33%', padding: 4 },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  itemCardSelected: {
    borderColor: PRIMARY,
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 16,
  },

  // Feature 4: Price edit styles
  priceBox:       { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 2 },
  priceBoxEdited: { backgroundColor: '#FFF3E0', borderRadius: 6, paddingHorizontal: 4 },
  itemPrice:       { fontSize: 13, fontWeight: '700', color: '#1565C0', marginBottom: 2 },
  itemPriceEdited: { color: '#E65100' },
  editedBadge:    { fontSize: 10 },
  editHint:       { fontSize: 8, color: '#BDBDBD', textAlign: 'center', marginBottom: 6 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  qtyBtnMinus:    { backgroundColor: '#FFEBEE' },
  qtyBtnPlus:     { backgroundColor: '#E8F5E9' },
  qtyBtnText:     { fontSize: 16, fontWeight: '700', color: '#C62828', lineHeight: 20 },
  qtyBtnTextPlus: { fontSize: 16, fontWeight: '700', color: '#2E7D32', lineHeight: 20 },
  qtyDisplay: {
    width: 32, height: 26, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 4, marginHorizontal: 4,
  },
  qtyDisplayActive: { backgroundColor: PRIMARY },
  qtyText:          { fontSize: 13, fontWeight: '700', color: '#757575' },
  qtyTextActive:    { color: '#FFFFFF' },
});
