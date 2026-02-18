import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingsScreen, RestaurantProfileScreen, OpeningHoursScreen, DeliverySettingsScreen, PaymentSettingsScreen } from '../screens';
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
            title={i18n.t('navigation.settings')}
            showBackButton={props.back !== undefined}
            onLeftPress={props.navigation.goBack}
            {...props.options}
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
        }}
      />
      <Stack.Screen
        name="DeliverySettings"
        component={DeliverySettingsScreen}
        options={{
          title: i18n.t('settings.delivery'),
        }}
      />
      <Stack.Screen
        name="PaymentSettings"
        component={PaymentSettingsScreen}
        options={{
          title: i18n.t('settings.payment'),
        }}
      />
      <Stack.Screen
        name="LanguageSettings"
        component={LanguageSettingsScreen}
        options={{
          title: i18n.t('settings.language'),
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          title: 'Paramètres de notifications',
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
    </Stack.Navigator>
  );
};

const LanguageSettingsScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Paramètres de langue</Text>
      <Text>À implémenter...</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, marginTop: 20 }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const NotificationSettingsScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Paramètres de notifications</Text>
      <Text>À implémenter...</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, marginTop: 20 }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsStackNavigator;
