import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTables } from '../api/api';
import TableCard from '../components/TableCard';

const PRIMARY = '#1565C0';

export default function TablesScreen({ navigation }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = async () => {
    try {
      const res = await getTables();
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setTables(data);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load tables');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchTables();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTables();
  };

  const handleTablePress = (table) => {
    navigation.navigate('SelectItems', {
      tableId: table.id,
      tableName: table.name || `Table ${table.id}`,
      orderId: table.active_order_id || null,          // pass existing held/active order
      existingOrderStatus: table.active_order_status || null,
      isTakeAway: false,
    });
  };

  const handleTakeAway = () => {
    navigation.navigate('SelectItems', {
      tableId: null,
      tableName: 'Take Away',
      orderId: null,
      isTakeAway: true,
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.cardWrapper}>
      <TableCard table={item} onPress={() => handleTablePress(item)} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading tables...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Table</Text>
        <Text style={styles.headerSubtitle}>{tables.length} tables</Text>
      </View>

      {/* Take Away Button */}
      <TouchableOpacity
        style={styles.takeAwayButton}
        onPress={handleTakeAway}
        activeOpacity={0.8}
      >
        <Text style={styles.takeAwayIcon}>🛍</Text>
        <View>
          <Text style={styles.takeAwayTitle}>Take Away / Parcel</Text>
          <Text style={styles.takeAwaySubtitle}>No table required</Text>
        </View>
        <Text style={styles.takeAwayArrow}>›</Text>
      </TouchableOpacity>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🪑</Text>
          <Text style={styles.emptyTitle}>No Tables Found</Text>
          <Text style={styles.emptySubtitle}>
            Add tables from the backend admin panel
          </Text>
        </View>
      ) : (
        <FlatList
          data={tables}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 14,
  },
  header: {
    backgroundColor: PRIMARY,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#BBDEFB',
    fontSize: 13,
  },
  takeAwayButton: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },
  takeAwayIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  takeAwayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212121',
  },
  takeAwaySubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  takeAwayArrow: {
    marginLeft: 'auto',
    fontSize: 24,
    color: '#BDBDBD',
  },
  grid: {
    padding: 6,
    paddingBottom: 20,
  },
  cardWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
  },
});
