import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RestaurantProfileScreen } from '../screens';
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
            title={i18n.t('navigation.profile')}
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
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
        options={{
          title: i18n.t('restaurantProfile.title'),
          headerShown: false, // Utilise ScreenHeader dans le composant
        }}
      />
    </Stack.Navigator>
  );
};

// RestaurantProfileScreen importé depuis screens

export default ProfileStackNavigator;
