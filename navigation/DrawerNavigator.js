import React from 'react';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Alert } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import OrdersStackNavigator from './OrdersStackNavigator';
import MenuStackNavigator from './MenuStackNavigator';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ReportsStackNavigator from './ReportsStackNavigator';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileStackNavigator from './ProfileStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';
import SupportScreen from '../screens/SupportScreen';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import i18n from '../i18n';
import { colors } from '../global';
import { useRestaurant } from '../contexts/RestaurantContext';

const Drawer = createDrawerNavigator();

// Composant personnalisé pour le contenu du drawer
function CustomDrawerContent(props) {
  const { logout } = useRestaurant();

  const handleLogout = async () => {
    Alert.alert(
      i18n.t('navigation.logout'),
      i18n.t('common.confirmLogout'),
      [
        {
          text: i18n.t('common.cancel'),
          style: 'cancel',
        },
        {
          text: i18n.t('navigation.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // La navigation vers l'écran de login sera gérée par l'App.js ou le contexte d'authentification
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
            }
          },
        },
      ]
    );
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <View style={{ marginTop: 'auto', marginBottom: 20 }}>
        <DrawerItem
          label={i18n.t('navigation.logout')}
          onPress={handleLogout}
          icon={({ focused, size }) => (
            <Ionicons
              name="log-out-outline"
              color="#ff4444"
              size={size}
            />
          )}
          labelStyle={{
            color: '#ff4444',
            fontSize: 16,
            fontWeight: '500',
            marginLeft: 8,
          }}
          style={{
            marginVertical: 2,
            marginHorizontal: 8,
            borderRadius: 8,
          }}
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#ffffff',
          width: 280,
        },
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '500',
          marginLeft: 8,
        },
        drawerItemStyle: {
          marginVertical: 2,
          marginHorizontal: 8,
          borderRadius: 8,
        },
        drawerActiveTintColor: '#FF6B35',
        drawerInactiveTintColor: '#666',
        drawerActiveBackgroundColor: 'rgba(255, 107, 53, 0.08)',
        drawerInactiveBackgroundColor: 'transparent',
      }}
    >
      {/* 🏠 TABLEAU DE BORD */}
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: i18n.t('navigation.dashboard'),
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              name="home-outline"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />

      {/* 🍽️ COMMANDES */}
      <Drawer.Screen
        name="Orders"
        component={OrdersStackNavigator}
        options={{
          title: i18n.t('navigation.orders'),
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              name="restaurant-outline"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />

      {/* 📋 GESTION MENU */}
      <Drawer.Screen
        name="Menu"
        component={MenuStackNavigator}
        options={{
          title: i18n.t('navigation.menu'),
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              name="list-outline"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />

      {/* 📊 ANALYSES */}
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: i18n.t('navigation.analytics'),
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              name="bar-chart-outline"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />

      {/* 📈 RAPPORTS */}
      <Drawer.Screen
        name="Reports"
        component={ReportsStackNavigator}
        options={{
          title: i18n.t('navigation.reports'),
          drawerIcon: ({ focused, size }) => (
            <Feather
              name="trending-up"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />

      {/* 🔔 NOTIFICATIONS */}
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: i18n.t('navigation.notifications'),
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              name="notifications-outline"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />

      {/* 🆘 SUPPORT */}
      <Drawer.Screen
        name="Support"
        component={SupportScreen}
        options={{
          title: i18n.t('navigation.support'),
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              name="help-circle-outline"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />

      {/* 👤 PROFIL */}
      <Drawer.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          title: i18n.t('navigation.profile'),
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              name="person-outline"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />

      {/* ⚙️ PARAMÈTRES */}
      <Drawer.Screen
        name="Settings"
        component={SettingsStackNavigator}
        options={{
          title: i18n.t('navigation.settings'),
          drawerIcon: ({ focused, size }) => (
            <Ionicons
              name="settings-outline"
              color={focused ? '#FF6B35' : '#666'}
              size={size}
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}
