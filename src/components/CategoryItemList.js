import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';

const PRIMARY = '#1565C0';

function ItemCard({ item, quantity, onIncrease, onDecrease }) {
  const isSelected = quantity > 0;

  return (
    <View style={[styles.itemCard, isSelected && styles.itemCardSelected]}>
      <Text style={styles.itemName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.itemPrice}>₹{parseFloat(item.price).toFixed(2)}</Text>

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

export default function CategoryItemList({
  category,
  items,
  selectedItems,
  onQuantityChange,
}) {
  if (!items || items.length === 0) return null;

  const handleIncrease = (item) => {
    const current = selectedItems[item.id]?.quantity || 0;
    onQuantityChange(item, current + 1);
  };

  const handleDecrease = (item) => {
    const current = selectedItems[item.id]?.quantity || 0;
    if (current > 0) {
      onQuantityChange(item, current - 1);
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
        {items.map((item) => (
          <View key={item.id} style={styles.itemWrapper}>
            <ItemCard
              item={item}
              quantity={selectedItems[item.id]?.quantity || 0}
              onIncrease={handleIncrease}
              onDecrease={handleDecrease}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
  },
  categoryHeader: {
    backgroundColor: '#1565C0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  categoryCount: {
    color: '#BBDEFB',
    fontSize: 11,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  itemWrapper: {
    width: '33.33%',
    padding: 4,
  },
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
    minHeight: 110,
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
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnMinus: {
    backgroundColor: '#FFEBEE',
  },
  qtyBtnPlus: {
    backgroundColor: '#E8F5E9',
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C62828',
    lineHeight: 20,
  },
  qtyBtnTextPlus: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    lineHeight: 20,
  },
  qtyDisplay: {
    width: 32,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  qtyDisplayActive: {
    backgroundColor: PRIMARY,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#757575',
  },
  qtyTextActive: {
    color: '#FFFFFF',
  },
});
