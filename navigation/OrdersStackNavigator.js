import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  OrdersScreen,
  OrderDetailsScreen,
  OrderHistoryScreen,
} from '../screens';
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
            title={props.options?.title || i18n.t('navigation.orders')}
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
        name="OrdersMain"
        component={OrdersScreen}
        options={{
          title: i18n.t('navigation.orders'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OrderDetails"
        component={OrderDetailsScreen}
        options={{
          title: i18n.t('orders.orderDetails'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OrderHistory"
        component={OrderHistoryScreen}
        options={{
          title: i18n.t('orders.orderHistory'),
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default OrdersStackNavigator;
