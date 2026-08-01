import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RestaurantProfileScreen } from '../screens';
import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../global';
import i18n from '../i18n';

const Stack = createStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="RestaurantProfile"
      screenOptions={{
        header: (props) => (
          <ScreenHeader
            title={props.options?.title || i18n.t('navigation.profile')}
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
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
        options={{
          title: i18n.t('restaurantProfile.title'),
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default ProfileStackNavigator;
