import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { clearAllData } from '../api/api';

const PRIMARY      = '#1565C0';
const PRIMARY_DARK = '#0D47A1';
const DANGER       = '#C62828';

function SettingsRow({ icon, title, subtitle, onPress, danger, last }) {
  return (
    <>
      <TouchableOpacity
        style={[styles.row, danger && styles.rowDanger]}
        onPress={onPress}
        activeOpacity={0.65}
      >
        <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
          <Text style={styles.rowIcon}>{icon}</Text>
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, danger && styles.rowTitleDanger]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, danger && styles.rowSubtitleDanger]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.rowArrow, danger && styles.rowArrowDanger]}>›</Text>
      </TouchableOpacity>
      {!last && <View style={styles.separator} />}
    </>
  );
}

function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeaderWrap}>
      <Text style={styles.sectionHeader}>{title}</Text>
    </View>
  );
}

export default function SettingsScreen({ navigation }) {
  const handleClearData = () => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete ALL orders, bills, and related data. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Done', 'All data has been cleared successfully.');
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY_DARK} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your restaurant</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Restaurant Info ── */}
        <SectionHeader title="RESTAURANT INFO" />
        <View style={styles.section}>
          <SettingsRow
            icon="🏪"
            title="Restaurant Name & Address"
            subtitle="Edit your restaurant details"
            onPress={() => navigation.navigate('RestaurantInfo')}
            last
          />
        </View>

        {/* ── Menu Management ── */}
        <SectionHeader title="MENU MANAGEMENT" />
        <View style={styles.section}>
          <SettingsRow
            icon="🏷️"
            title="Categories"
            subtitle="Add or remove menu categories"
            onPress={() => navigation.navigate('CategoryManage')}
          />
          <SettingsRow
            icon="🍽️"
            title="Menu Items"
            subtitle="Manage your menu items"
            onPress={() => navigation.navigate('MenuItemManage')}
            last
          />
        </View>

        {/* ── Table Management ── */}
        <SectionHeader title="TABLE MANAGEMENT" />
        <View style={styles.section}>
          <SettingsRow
            icon="🪑"
            title="Tables"
            subtitle="Add or remove tables"
            onPress={() => navigation.navigate('TableManage')}
            last
          />
        </View>

        {/* ── Danger Zone ── */}
        <SectionHeader title="DANGER ZONE" />
        <View style={[styles.section, styles.sectionDanger]}>
          <SettingsRow
            icon="🗑️"
            title="Clear All Data"
            subtitle="Delete all orders, bills and data"
            onPress={handleClearData}
            danger
            last
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Restaurant Billing App</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  /* ── Header ── */
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  /* ── Scroll ── */
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 32,
  },

  /* ── Section header ── */
  sectionHeaderWrap: {
    paddingHorizontal: 20,
    paddingBottom: 7,
    paddingTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78909C',
    letterSpacing: 1.4,
  },

  /* ── Section card ── */
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionDanger: {
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
  },

  /* ── Row ── */
  separator: {
    height: 1,
    backgroundColor: '#F0F4F8',
    marginLeft: 68,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowDanger: {
    backgroundColor: '#FFF8F8',
  },

  /* Icon bubble */
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: '#FFEBEE',
  },
  rowIcon: {
    fontSize: 20,
  },

  /* Text */
  rowContent: {
    flex: 1,
    marginLeft: 14,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  rowTitleDanger: {
    color: DANGER,
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  rowSubtitleDanger: {
    color: '#EF9A9A',
  },
  rowArrow: {
    fontSize: 24,
    color: '#CFD8DC',
    fontWeight: '300',
    marginLeft: 4,
  },
  rowArrowDanger: {
    color: '#EF9A9A',
  },

  /* ── Footer ── */
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#B0BEC5',
    fontWeight: '500',
  },
  footerVersion: {
    fontSize: 11,
    color: '#CFD8DC',
    marginTop: 3,
  },
});
