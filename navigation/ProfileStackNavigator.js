import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import ScreenHeader from '../components/ScreenHeader';
import { RestaurantProfileScreen } from '../screens';
import { colors } from '../global';
import i18n from '../i18n';

const Stack = createStackNavigator();

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="ProfileMain"
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
        name="ProfileMain"
        component={ProfileScreen}
        options={{
          title: i18n.t('navigation.profile'),
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Modifier le profil',
        }}
      />
      <Stack.Screen
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
        options={{
          title: 'Profil restaurant',
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: 'Changer le mot de passe',
        }}
      />
    </Stack.Navigator>
  );
};

// Écrans temporaires - à remplacer par les vrais composants
const ProfileScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 30 }}>
        Profil Restaurant
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('EditProfile')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Modifier le profil</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('RestaurantProfile')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Informations restaurant</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('ChangePassword')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Changer le mot de passe</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, marginTop: 20 }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const EditProfileScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Modifier le profil</Text>
      <Text>À implémenter...</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, marginTop: 20 }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

// RestaurantProfileScreen importé depuis screens

const ChangePasswordScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Changer le mot de passe</Text>
      <Text>À implémenter...</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.primary, marginTop: 20 }}>Retour</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
};

export default ProfileStackNavigator;
