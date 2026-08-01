import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../global';
import i18n from '../i18n';
import { config } from '../config';
import { safeBottomPad } from '../utils/safeBottom';

export default function SplashScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={styles.container1}>
        <Animatable.View
          animation="bounceIn"
          duration={1500}
          style={styles.logoContainer}
        >
          <Icon
            name="restaurant"
            type="material"
            size={120}
            color={colors.primary}
            containerStyle={styles.iconContainer}
          />
          <View style={styles.textContainer}>
            <Text style={styles.appName}>{config.APP_NAME}</Text>
            <Text style={styles.appType}>{config.APP_SUBTITLE}</Text>
            <Text style={styles.tagline}>{i18n.t('app.slogan')}</Text>
          </View>
        </Animatable.View>
      </View>
      <Animatable.View
        style={[styles.container2, { paddingBottom: safeBottomPad(insets.bottom, 24) }]}
        animation="fadeInUpBig"
      >
        <View style={styles.button}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <LinearGradient
              colors={colors.auth.gradient1}
              style={styles.signInButton}
            >
              <Text style={styles.signInText}>{i18n.t('common.start')}</Text>
              <Icon
                name="navigate-next"
                type="material"
                size={20}
                color={colors.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animatable.View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container1: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  appType: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  container2: {
    flex: 1,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    justifyContent: 'center',
  },
  signInText: {
    fontWeight: 'bold',
    color: colors.white,
  },
  signInButton: {
    width: 180,
    height: 50,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: 25,
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  button: {
    alignItems: 'flex-end',
    marginRight: 20,
  },
});
