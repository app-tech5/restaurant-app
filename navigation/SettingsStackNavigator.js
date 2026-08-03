import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  SettingsScreen,
  RestaurantProfileScreen,
  OpeningHoursScreen,
  DeliverySettingsScreen,
  PaymentSettingsScreen,
  LanguageSettingsScreen,
  NotificationSettingsScreen,
  SubscriptionsScreen,
} from '../screens';
import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../global';
import i18n from '../i18n';

const Stack = createStackNavigator();

const SettingsStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="SettingsMain"
      screenOptions={{
        header: (props) => (
          <ScreenHeader
            title={props.options?.title || i18n.t('navigation.settings')}
            {...props.options}
            autoLeftNav
          />
        ),
        headerStyle: {
          backgroundColor: colors.white,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text.primary,
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{
          title: i18n.t('navigation.settings'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OpeningHours"
        component={OpeningHoursScreen}
        options={{
          title: i18n.t('settings.openingHours'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DeliverySettings"
        component={DeliverySettingsScreen}
        options={{
          title: i18n.t('settings.delivery'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PaymentSettings"
        component={PaymentSettingsScreen}
        options={{
          title: i18n.t('settings.payment'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{
          title: i18n.t('settings.language'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: i18n.t('navigation.notificationSettings'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
        options={{
          title: 'Profil restaurant',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{
          title: i18n.t('subscription.title'),
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator;
