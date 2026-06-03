import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from '../screens/DashboardScreen';
import TablesScreen from '../screens/TablesScreen';
import SelectItemsScreen from '../screens/SelectItemsScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import BillScreen from '../screens/BillScreen';
import KOTScreen from '../screens/KOTScreen';
import OrdersListScreen from '../screens/OrdersListScreen';
import MenuManagementScreen from '../screens/MenuManagementScreen';
import TodayReportScreen from '../screens/TodayReportScreen';
import ItemSalesReportScreen from '../screens/ItemSalesReportScreen';
import DailySalesScreen from '../screens/DailySalesScreen';
import MonthlySalesScreen from '../screens/MonthlySalesScreen';
import ProfitLossScreen from '../screens/ProfitLossScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RestaurantInfoScreen from '../screens/settings/RestaurantInfoScreen';
import CategoryManageScreen from '../screens/settings/CategoryManageScreen';
import MenuItemManageScreen from '../screens/settings/MenuItemManageScreen';
import TableManageScreen from '../screens/settings/TableManageScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const PRIMARY  = '#1565C0';
const INACTIVE = '#90A4AE';

// Simple icon component using text symbols
function TabIcon({ symbol, focused, color }) {
  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.iconText, { color }]}>{symbol}</Text>
    </View>
  );
}

// ─── Stack Navigators ─────────────────────────────────────────────────────────

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardHome" component={DashboardScreen} />
      <Stack.Screen name="TodayReport" component={TodayReportScreen} />
      <Stack.Screen name="ItemSalesReport" component={ItemSalesReportScreen} />
      <Stack.Screen name="DailySales" component={DailySalesScreen} />
      <Stack.Screen name="MonthlySales" component={MonthlySalesScreen} />
      <Stack.Screen name="ProfitLoss" component={ProfitLossScreen} />
      <Stack.Screen name="Tables" component={TablesScreen} />
      <Stack.Screen name="SelectItems" component={SelectItemsScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="Bill" component={BillScreen} />
      <Stack.Screen name="KOT" component={KOTScreen} />
    </Stack.Navigator>
  );
}

function TablesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TablesHome" component={TablesScreen} />
      <Stack.Screen name="SelectItems" component={SelectItemsScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="Bill" component={BillScreen} />
      <Stack.Screen name="KOT" component={KOTScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersHome" component={OrdersListScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
      <Stack.Screen name="SelectItems" component={SelectItemsScreen} />
      <Stack.Screen name="Bill" component={BillScreen} />
      <Stack.Screen name="KOT" component={KOTScreen} />
    </Stack.Navigator>
  );
}

function MenuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MenuHome" component={MenuManagementScreen} />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsHome" component={SettingsScreen} />
      <Stack.Screen name="RestaurantInfo" component={RestaurantInfoScreen} />
      <Stack.Screen name="CategoryManage" component={CategoryManageScreen} />
      <Stack.Screen name="MenuItemManage" component={MenuItemManageScreen} />
      <Stack.Screen name="TableManage" component={TableManageScreen} />
    </Stack.Navigator>
  );
}

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          const icons = {
            Dashboard: '⊞',
            Tables: '▦',
            Orders: '☰',
            Menu: '◈',
            Settings: '⚙',
          };
          return (
            <TabIcon
              symbol={icons[route.name] || '●'}
              focused={focused}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Tables" component={TablesStack} />
      <Tab.Screen name="Orders" component={OrdersStack} />
      <Tab.Screen name="Menu" component={MenuStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    height: 60,
    paddingBottom: 6,
    paddingTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
});
