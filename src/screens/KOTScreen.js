import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import KOTReceipt from '../components/KOTReceipt';

const PRIMARY = '#1565C0';
const KOT_COLOR = '#E65100';

export default function KOTScreen({ route, navigation }) {
  const { kotData, orderId } = route.params || {};
  const [loading, setLoading] = useState(false);

  const handlePrint = () => {
    Alert.alert('Print KOT', 'Sending KOT to kitchen printer...', [{ text: 'OK' }]);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={KOT_COLOR} />
        <Text style={styles.loadingText}>Loading KOT...</Text>
      </View>
    );
  }

  if (!kotData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>KOT data not available</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Kitchen Order Ticket</Text>
          <Text style={styles.headerSubtitle}>
            KOT #{kotData.kot_number || kotData.id || orderId}
          </Text>
        </View>
      </View>

      {/* KOT Receipt */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* KOT Badge */}
        <View style={styles.kotBadge}>
          <Text style={styles.kotBadgeText}>🍳 SENT TO KITCHEN</Text>
        </View>

        <View style={styles.receiptWrapper}>
          <KOTReceipt kot={kotData} />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.backBtn2]}
          onPress={handleBack}
        >
          <Text style={styles.backBtn2Text}>‹ BACK</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.printBtn]}
          onPress={handlePrint}
        >
          <Text style={styles.printBtnText}>🖨  PRINT KOT</Text>
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
  backLinkText: { color: KOT_COLOR, fontSize: 15, fontWeight: '600' },
  header: {
    backgroundColor: KOT_COLOR,
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
  headerSubtitle: { color: '#FFCCBC', fontSize: 12, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  kotBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  kotBadgeText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
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
    borderTopColor: KOT_COLOR,
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
  backBtn2: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#9E9E9E',
  },
  backBtn2Text: {
    color: '#424242',
    fontSize: 14,
    fontWeight: '700',
  },
  printBtn: {
    backgroundColor: KOT_COLOR,
  },
  printBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
