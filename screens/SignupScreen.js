import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input, Button, Icon } from 'react-native-elements';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { colors } from '../global';
import { config } from '../config';
import { useRestaurant } from '../contexts/RestaurantContext';
import { safeBottomPad } from '../utils/safeBottom';
import i18n from '../i18n';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

export default function SignupScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      Alert.alert(i18n.t('common.error'), i18n.t('auth.connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={colors.auth.gradient1} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: safeBottomPad(insets.bottom, 40) },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces
          >
            <Animatable.View animation="fadeInUp" duration={800} style={styles.contentContainer}>
              <Animatable.View animation="bounceIn" delay={200} style={styles.logoContainer}>
                <Icon name="restaurant" type="material" color={colors.white} size={44} />
                <Text style={styles.appTitle}>{config.APP_NAME}</Text>
                <Text style={styles.appSubtitle}>{config.APP_SUBTITLE}</Text>
              </Animatable.View>

              <Animatable.View animation="fadeInUp" delay={350} style={styles.formContainer}>
                <Text style={styles.welcomeText}>{i18n.t('auth.signupTitle')}</Text>
                <Text style={styles.subtitleText}>{i18n.t('auth.signupSubtitle')}</Text>

                <Input
                  placeholder={i18n.t('auth.ownerName')}
                  leftIcon={<Icon name="person" type="material" color={colors.primary} size={20} />}
                  leftIconContainerStyle={styles.leftIcon}
                  inputContainerStyle={styles.inputInner}
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
                  leftIconContainerStyle={styles.leftIcon}
                  inputContainerStyle={styles.inputInner}
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
                  leftIconContainerStyle={styles.leftIcon}
                  inputContainerStyle={styles.inputInner}
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
                  leftIconContainerStyle={styles.leftIcon}
                  inputContainerStyle={styles.inputInner}
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
                  leftIconContainerStyle={styles.leftIcon}
                  rightIconContainerStyle={styles.rightIcon}
                  inputContainerStyle={styles.inputInner}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name={showPassword ? 'visibility-off' : 'visibility'}
                        type="material"
                        color={colors.primary}
                        size={20}
                      />
                    </TouchableOpacity>
                  }
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  containerStyle={styles.inputContainer}
                  inputStyle={styles.inputText}
                  placeholderTextColor="#999"
                />
                <Input
                  placeholder={i18n.t('auth.confirmPassword')}
                  leftIcon={<Icon name="lock" type="material" color={colors.primary} size={20} />}
                  leftIconContainerStyle={styles.leftIcon}
                  rightIconContainerStyle={styles.rightIcon}
                  inputContainerStyle={styles.inputInner}
                  rightIcon={
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword((prev) => !prev)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                        type="material"
                        color={colors.primary}
                        size={20}
                      />
                    </TouchableOpacity>
                  }
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
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
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.secondaryLinkText}>
                    {i18n.t('auth.alreadyHaveAccount')}{' '}
                    <Text style={styles.secondaryLinkStrong}>{i18n.t('auth.signIn')}</Text>
                  </Text>
                </TouchableOpacity>
              </Animatable.View>
              <View style={{ height: Math.max(safeBottomPad(insets.bottom, 8), 24) }} />
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
    paddingTop: 8,
  },
  contentContainer: {
    width: '100%',
    paddingBottom: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 21,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  inputInner: {
    minHeight: 44,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  leftIcon: {
    marginLeft: 0,
    marginRight: 8,
    height: 40,
    justifyContent: 'center',
  },
  rightIcon: {
    marginRight: 0,
    height: 40,
    justifyContent: 'center',
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
    marginTop: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryLink: {
    marginTop: 16,
    marginBottom: 4,
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
