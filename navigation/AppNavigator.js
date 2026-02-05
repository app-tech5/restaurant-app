import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import { useRestaurant } from '../contexts/RestaurantContext';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const navigationRef = useRef();
  const { isAuthenticated, isLoading } = useRestaurant();

  // Gérer la navigation basée sur l'état d'authentification
  useEffect(() => {
    if (!isLoading && navigationRef.current) {
      const navigation = navigationRef.current;

      if (isAuthenticated) {
        // Si authentifié, aller au drawer
        if (navigation.getCurrentRoute()?.name !== 'DrawerNavigator') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'DrawerNavigator' }],
          });
        }
      } else {
        // Si pas authentifié et pas sur Splash, aller au login
        const currentRoute = navigation.getCurrentRoute()?.name;
        if (currentRoute !== 'Splash' && currentRoute !== 'Login') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    }
  }, [isAuthenticated, isLoading]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
