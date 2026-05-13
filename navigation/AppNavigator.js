import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import RestaurantOnboardingScreen from '../screens/RestaurantOnboardingScreen';
import DrawerNavigator from './DrawerNavigator';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useNotificationNavigation } from '../hooks/useNotificationNavigation';
const Stack = createStackNavigator();
export default function AppNavigator() {
  const navigationRef = useRef();
  const { isAuthenticated, isLoading, needsOnboarding } = useRestaurant();
  useNotificationNavigation(navigationRef, isAuthenticated);

  useEffect(() => {
    if (!isLoading && navigationRef.current) {
      const navigation = navigationRef.current;
      if (isAuthenticated) {
        const target = needsOnboarding ? 'Onboarding' : 'DrawerNavigator';
        if (navigation.getCurrentRoute()?.name !== target) {
          navigation.reset({
            index: 0,
            routes: [{ name: target }],
          });
        }
      } else {
        const currentRoute = navigation.getCurrentRoute()?.name;
        if (
          currentRoute !== 'Splash' &&
          currentRoute !== 'Login' &&
          currentRoute !== 'Signup'
        ) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    }
  }, [isAuthenticated, isLoading, needsOnboarding]);

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
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Onboarding" component={RestaurantOnboardingScreen} />
        <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
