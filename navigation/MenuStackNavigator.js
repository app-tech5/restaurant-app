import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { MenuScreen, AddEditMenuItemScreen } from '../screens';
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
            title={i18n.t('navigation.menu')}
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
        name="MenuMain"
        component={MenuScreen}
        options={{
          title: i18n.t('navigation.menu'),
          headerShown: false, // Utilise ScreenHeader dans le composant
        }}
      />
      <Stack.Screen
        name="AddEditMenuItem"
        component={AddEditMenuItemScreen}
        options={({ route }) => ({
          title: route.params?.mode === 'add'
            ? i18n.t('menu.addItem')
            : i18n.t('menu.editItem'),
          headerShown: false, // Utilise ScreenHeader dans le composant
        })}
      />
      <Stack.Screen
        name="MenuCategories"
        component={MenuCategoriesScreen}
        options={{
          title: 'Catégories de menu',
        }}
      />
      <Stack.Screen
        name="MenuAnalytics"
        component={MenuAnalyticsScreen}
        options={{
          title: 'Analyses du menu',
        }}
      />
    </Stack.Navigator>
  );
};

// Écrans temporaires - à remplacer par les vrais composants

const MenuCategoriesScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Gestion des catégories de menu</Text>
      <Text>À implémenter...</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, marginTop: 20 }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const MenuAnalyticsScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Analyses du menu</Text>
      <Text>À implémenter...</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, marginTop: 20 }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MenuStackNavigator;
