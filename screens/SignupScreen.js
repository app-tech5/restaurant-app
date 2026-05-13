import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { colors } from '../global';
import { config } from '../config';
import { useRestaurant } from '../contexts/RestaurantContext';
import i18n from '../i18n';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useRestaurant();

  const validate = () => {
    if (!email || !password || !confirmPassword || !name) {
      return i18n.t('auth.fillAllFields');
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return i18n.t('auth.invalidEmail');
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return i18n.t('auth.passwordTooShort', { min: PASSWORD_MIN_LENGTH });
    }
    if (password !== confirmPassword) {
      return i18n.t('auth.passwordsDontMatch');
    }
    return null;
  };

  const handleSignup = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      Alert.alert(i18n.t('common.error'), errorMessage);
      return;
    }
    setIsLoading(true);
    try {
      const result = await signup({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      if (result.success) {
        navigation.replace('DrawerNavigator');
      } else {
        Alert.alert(
          i18n.t('common.error'),
          result.message || i18n.t('auth.signupError')
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animatable.View animation="fadeInUp" duration={1000} style={styles.contentContainer}>
              <Animatable.View animation="bounceIn" delay={300} style={styles.logoContainer}>
                <Icon name="restaurant" type="material" color={colors.white} size={64} />
                <Text style={styles.appTitle}>{config.APP_NAME}</Text>
                <Text style={styles.appSubtitle}>{config.APP_SUBTITLE}</Text>
              </Animatable.View>

              <Animatable.View animation="fadeInUp" delay={500} style={styles.formContainer}>
                <Text style={styles.welcomeText}>{i18n.t('auth.signupTitle')}</Text>
                <Text style={styles.subtitleText}>{i18n.t('auth.signupSubtitle')}</Text>

                <Input
                  placeholder={i18n.t('auth.ownerName')}
                  leftIcon={<Icon name="person" type="material" color={colors.primary} size={20} />}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  placeholderTextColor="#999"
                />
                <Input
                  placeholder={i18n.t('auth.email')}
                  leftIcon={<Icon name="email" type="material" color={colors.primary} size={20} />}
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
                  placeholder={i18n.t('auth.phone')}
                  leftIcon={<Icon name="phone" type="material" color={colors.primary} size={20} />}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  placeholderTextColor="#999"
                />
                <Input
                  placeholder={i18n.t('auth.address')}
                  leftIcon={<Icon name="place" type="material" color={colors.primary} size={20} />}
                  value={address}
                  onChangeText={setAddress}
                  autoCapitalize="sentences"
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  placeholderTextColor="#999"
                />
                <Input
                  placeholder={i18n.t('auth.password')}
                  leftIcon={<Icon name="lock" type="material" color={colors.primary} size={20} />}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  placeholderTextColor="#999"
                />
                <Input
                  placeholder={i18n.t('auth.confirmPassword')}
                  leftIcon={<Icon name="lock-outline" type="material" color={colors.primary} size={20} />}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  placeholderTextColor="#999"
                />

                <Button
                  title={
                    isLoading
                      ? i18n.t('auth.signingUp')
                      : i18n.t('auth.signupButton')
                  }
                  loading={isLoading}
                  disabled={isLoading}
                  buttonStyle={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  containerStyle={styles.primaryButtonContainer}
                  titleStyle={[styles.primaryButtonText, { color: colors.white }]}
                  onPress={handleSignup}
                  raised
                />

                <TouchableOpacity
                  onPress={() => navigation.replace('Login')}
                  style={styles.secondaryLink}
                >
                  <Text style={styles.secondaryLinkText}>
                    {i18n.t('auth.alreadyHaveAccount')}{' '}
                    <Text style={styles.secondaryLinkStrong}>{i18n.t('auth.signIn')}</Text>
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
            </Animatable.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 8,
  },
  inputText: {
    color: colors.text.primary,
    fontSize: 16,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
  },
  primaryButtonContainer: {
    marginTop: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  secondaryLinkText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  secondaryLinkStrong: {
    color: colors.primary,
    fontWeight: '600',
  },
});
