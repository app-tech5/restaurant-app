import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { ReportsScreen, ReportDetailsScreen } from '../screens';
import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../global';
import i18n from '../i18n';

const Stack = createStackNavigator();

const ReportsStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ReportsMain"
      screenOptions={{
        header: (props) => (
          <ScreenHeader
            title={i18n.t('navigation.reports')}
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
        name="ReportsMain"
        component={ReportsScreen}
        options={{
          title: i18n.t('navigation.reports'),
          headerShown: false, // Utilise ScreenHeader dans le composant
        }}
      />
      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{
          title: 'Détails du rapport',
        }}
      />
    </Stack.Navigator>
  );
};

export default ReportsStackNavigator;
