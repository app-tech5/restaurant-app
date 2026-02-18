import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ReviewsScreen } from '../screens';
import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../global';
import i18n from '../i18n';

const Stack = createStackNavigator();

const ReviewsStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ReviewsMain"
      screenOptions={{
        header: (props) => (
          <ScreenHeader
            title={i18n.t('reviews.title')}
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
        name="ReviewsMain"
        component={ReviewsScreen}
        options={{
          title: i18n.t('reviews.title'),
          headerShown: false, 
        }}
      />
    </Stack.Navigator>
  );
};

export default ReviewsStackNavigator;
