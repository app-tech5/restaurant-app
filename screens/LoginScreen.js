import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../global';
import { config } from '../config';
import apiClient from '../api';
import { useRestaurant } from '../contexts/RestaurantContext';
import { ScreenHeader } from '../components';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(config.DEMO_MODE ? config.DEMO_EMAIL : '');
  const [password, setPassword] = useState(config.DEMO_MODE ? config.DEMO_PASSWORD : '');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useRestaurant();

  // Vérifier si le restaurant est déjà connecté au démarrage
  useEffect(() => {
    const checkExistingLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('restaurantToken');
        const restaurantData = await AsyncStorage.getItem('restaurantData');

        if (token && restaurantData) {
          // Le restaurant est déjà connecté, aller directement au Home
          navigation.replace('DrawerNavigator');
        }
      } catch (error) {
        console.error('Error checking existing login:', error);
      }
    };

    checkExistingLogin();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      if (config.DEMO_MODE) {
        // Mode démo - connexion simulée
        const result = await login(email, password);
        if (result.success) {
          navigation.replace('DrawerNavigator');
        } else {
          Alert.alert('Erreur', result.message || 'Erreur de connexion');
        }
      } else {
        // Mode production - appel API réel
        const response = await apiClient.login(email, password);

        if (response.success) {
          // Sauvegarder les données de connexion
          await AsyncStorage.setItem('restaurantToken', response.token);
          await AsyncStorage.setItem('restaurantData', JSON.stringify(response.restaurant));

          navigation.replace('DrawerNavigator');
        } else {
          Alert.alert('Erreur', response.message || 'Erreur de connexion');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Erreur', 'Erreur de connexion. Vérifiez votre connexion internet.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B35" />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Animatable.View
            animation="fadeInUp"
            duration={1000}
            style={styles.contentContainer}
          >
            {/* Header avec logo */}
            <Animatable.View
              animation="bounceIn"
              delay={500}
              style={styles.logoContainer}
            >
              <Icon
                name="restaurant"
                type="material"
                color="#FFFFFF"
                size={80}
              />
              <Text style={styles.appTitle}>Good Food</Text>
              <Text style={styles.appSubtitle}>Restaurant</Text>
            </Animatable.View>

            {/* Formulaire de connexion */}
            <Animatable.View
              animation="fadeInUp"
              delay={800}
              style={styles.formContainer}
            >
              <Text style={styles.welcomeText}>Bienvenue !</Text>
              <Text style={styles.subtitleText}>Connectez-vous à votre espace restaurant</Text>

              <Input
                placeholder="Email"
                leftIcon={
                  <Icon
                    name="email"
                    type="material"
                    color="#FF6B35"
                    size={20}
                  />
                }
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputText}
                placeholderTextColor="#999"
              />

              <Input
                placeholder="Mot de passe"
                leftIcon={
                  <Icon
                    name="lock"
                    type="material"
                    color="#FF6B35"
                    size={20}
                  />
                }
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.inputContainer}
                inputStyle={styles.inputText}
                placeholderTextColor="#999"
              />

              <Button
                title="Se connecter"
                loading={isLoading}
                disabled={isLoading}
                buttonStyle={styles.loginButton}
                containerStyle={styles.loginButtonContainer}
                titleStyle={styles.loginButtonText}
                onPress={handleLogin}
                raised
              />

              {config.DEMO_MODE && (
                <Text style={styles.demoText}>
                  Mode démo activé - Utilisez les identifiants de démonstration
                </Text>
              )}
            </Animatable.View>
          </Animatable.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
  },
  appSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputText: {
    color: '#333',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
  },
  loginButtonContainer: {
    marginTop: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
