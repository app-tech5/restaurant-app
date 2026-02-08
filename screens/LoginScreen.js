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
import i18n from '../i18n';

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
      Alert.alert(i18n.t('common.error'), i18n.t('auth.fillAllFields'));
      return;
    }

    setIsLoading(true);

    try {
      // Utiliser toujours la fonction login du hook qui gère le mode démo et production
      const result = await login(email, password);

      if (result.success) {
        navigation.replace('DrawerNavigator');
      } else {
        Alert.alert(i18n.t('common.error'), result.message || i18n.t('auth.networkError'));
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(i18n.t('common.error'), i18n.t('auth.connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={colors.auth.gradient1} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
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
            color={colors.white}
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
              <Text style={styles.welcomeText}>{i18n.t('auth.welcome')}</Text>
              <Text style={styles.subtitleText}>{i18n.t('auth.loginSubtitle')}</Text>

              <Input
                placeholder={i18n.t('auth.email')}
                leftIcon={
                  <Icon
                    name="email"
                    type="material"
                    color={colors.primary}
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
                placeholder={i18n.t('auth.password')}
                leftIcon={
                  <Icon
                    name="lock"
                    type="material"
                    color={colors.primary}
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
                title={i18n.t('auth.loginButton')}
                loading={isLoading}
                disabled={isLoading}
                buttonStyle={[styles.loginButton, { backgroundColor: colors.primary }]}
                containerStyle={styles.loginButtonContainer}
                titleStyle={[styles.loginButtonText, { color: colors.white }]}
                onPress={handleLogin}
                raised
              />

              {config.DEMO_MODE && (
                <Text style={styles.demoText}>
                  {i18n.t('auth.demoMode')}
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
    color: colors.white,
    marginTop: 10,
  },
  appSubtitle: {
    fontSize: 18,
    color: colors.white,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 30,
    shadowColor: colors.black,
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
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  loginButton: {
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
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
