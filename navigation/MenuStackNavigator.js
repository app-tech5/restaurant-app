import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  MenuScreen,
  AddEditMenuItemScreen,
  MenuCategoriesScreen,
  MenuAnalyticsScreen,
} from '../screens';
import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../global';
import i18n from '../i18n';

const Stack = createStackNavigator();

const MenuStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MenuMain"
      screenOptions={{
        header: (props) => (
          <ScreenHeader
            title={props.options?.title || i18n.t('navigation.menu')}
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
        name="MenuMain"
        component={MenuScreen}
        options={{
          title: i18n.t('navigation.menu'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddEditMenuItem"
        component={AddEditMenuItemScreen}
        options={({ route }) => ({
          title:
            route.params?.mode === 'add' ? i18n.t('menu.addItem') : i18n.t('menu.editItem'),
          headerShown: false,
        })}
      />
      <Stack.Screen
        name="MenuCategories"
        component={MenuCategoriesScreen}
        options={{
          title: i18n.t('navigation.menuCategories'),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MenuAnalytics"
        component={MenuAnalyticsScreen}
        options={{
          title: i18n.t('navigation.menuAnalytics'),
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default MenuStackNavigator;
