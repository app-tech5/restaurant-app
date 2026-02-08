import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { OrdersScreen, OrderDetailsScreen } from '../screens';
import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../global';
import i18n from '../i18n';

const Stack = createStackNavigator();

const OrdersStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="OrdersMain"
      screenOptions={{
        header: (props) => (
          <ScreenHeader
            title={i18n.t('navigation.orders')}
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
        name="OrdersMain"
        component={OrdersScreen}
        options={{
          title: i18n.t('navigation.orders'),
          headerShown: false, // Utilise ScreenHeader dans le composant
        }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          title: i18n.t('orders.orderDetails'),
          headerShown: false, // Utilise ScreenHeader dans le composant
        }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          title: i18n.t('orders.orderHistory'),
        }}
      />
    </Stack.Navigator>
  );
};

// Écrans temporaires - à remplacer par les vrais composants

const OrderHistoryScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Historique des commandes</Text>
      <Text>À implémenter...</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, marginTop: 20 }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

export default OrdersStackNavigator;
