import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch, Text } from 'react-native';
import { useSettings } from '../contexts/SettingContext';
import { ScreenHeader, SettingRow } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';

const SettingsScreen = ({ navigation }) => {
  const { settings, currency, language, refreshSettings } = useSettings();

  // États locaux pour les paramètres
  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderUpdates: true,
    lowStock: false,
    marketing: false,
  });

  const [restaurantSettings, setRestaurantSettings] = useState({
    autoAcceptOrders: false,
    preparationTime: 15,
  });

  const handleNotificationToggle = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    // Ici on sauvegarderait dans le contexte/backend
  };

  const handleRestaurantSettingToggle = (key, value) => {
    setRestaurantSettings(prev => ({ ...prev, [key]: value }));
    // Ici on sauvegarderait dans le contexte/backend
  };

  const handleLanguageChange = () => {
    Alert.alert(
      i18n.t('settings.changeLanguage'),
      i18n.t('settings.languageComingSoon'),
      [{ text: i18n.t('common.ok') }]
    );
  };

  const handleCurrencyChange = () => {
    Alert.alert(
      i18n.t('settings.changeCurrency'),
      i18n.t('settings.currencyComingSoon'),
      [{ text: i18n.t('common.ok') }]
    );
  };

  const handleRestaurantProfile = () => {
    navigation.navigate('RestaurantProfile');
  };

  const handleOpeningHours = () => {
    navigation.navigate('OpeningHours');
  };

  const handleDeliverySettings = () => {
    navigation.navigate('DeliverySettings');
  };

  const handlePaymentSettings = () => {
    navigation.navigate('PaymentSettings');
  };

  const handleAbout = () => {
    Alert.alert(
      i18n.t('settings.aboutTitle'),
      i18n.t('settings.aboutMessage'),
      [{ text: i18n.t('common.ok') }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      i18n.t('settings.privacyTitle'),
      i18n.t('settings.privacyMessage'),
      [{ text: i18n.t('common.ok') }]
    );
  };

  const handleTerms = () => {
    Alert.alert(
      i18n.t('settings.termsTitle'),
      i18n.t('settings.termsMessage'),
      [{ text: i18n.t('common.ok') }]
    );
  };

  const handleHelp = () => {
    navigation.navigate('Support');
  };

  const handleContact = () => {
    Alert.alert(
      i18n.t('settings.contactTitle'),
      i18n.t('settings.contactMessage'),
      [{ text: i18n.t('common.ok') }]
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('navigation.settings')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profil Restaurant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.restaurantSection')}</Text>
          <SettingRow
            title={i18n.t('settings.restaurantInfo')}
            subtitle={i18n.t('settings.restaurantInfoSubtitle')}
            icon="business"
            onPress={handleRestaurantProfile}
          />
          <SettingRow
            title={i18n.t('settings.openingHours')}
            subtitle={i18n.t('settings.openingHoursSubtitle')}
            icon="schedule"
            onPress={handleOpeningHours}
          />
          <SettingRow
            title={i18n.t('settings.autoAcceptOrders')}
            subtitle={i18n.t('settings.autoAcceptOrdersSubtitle')}
            icon="auto-fix-high"
            rightComponent={
              <Switch
                value={restaurantSettings.autoAcceptOrders}
                onValueChange={(value) => handleRestaurantSettingToggle('autoAcceptOrders', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={restaurantSettings.autoAcceptOrders ? colors.white : colors.grey[400]}
              />
            }
          />
        </View>

        {/* Livraison & Paiement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.servicesSection')}</Text>
          <SettingRow
            title={i18n.t('settings.deliverySettings')}
            subtitle={i18n.t('settings.deliverySettingsSubtitle')}
            icon="local-shipping"
            onPress={handleDeliverySettings}
          />
          <SettingRow
            title={i18n.t('settings.paymentSettings')}
            subtitle={i18n.t('settings.paymentSettingsSubtitle')}
            icon="payment"
            onPress={handlePaymentSettings}
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.notificationsSettings')}</Text>
          <SettingRow
            title={i18n.t('settings.newOrdersNotif')}
            subtitle={i18n.t('settings.orderUpdatesNotif')}
            icon="notifications"
            rightComponent={
              <Switch
                value={notifications.newOrders}
                onValueChange={(value) => handleNotificationToggle('newOrders', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={notifications.newOrders ? colors.white : colors.grey[400]}
              />
            }
          />
          <SettingRow
            title={i18n.t('settings.orderUpdatesNotif')}
            subtitle="Order status changes"
            icon="update"
            rightComponent={
              <Switch
                value={notifications.orderUpdates}
                onValueChange={(value) => handleNotificationToggle('orderUpdates', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={notifications.orderUpdates ? colors.white : colors.grey[400]}
              />
            }
          />
          <SettingRow
            title={i18n.t('settings.lowStockNotif')}
            subtitle="Alerts when a dish is out of stock"
            icon="inventory"
            rightComponent={
              <Switch
                value={notifications.lowStock}
                onValueChange={(value) => handleNotificationToggle('lowStock', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={notifications.lowStock ? colors.white : colors.grey[400]}
              />
            }
          />
          <SettingRow
            title={i18n.t('settings.marketingNotif')}
            subtitle="Special offers and promotions"
            icon="campaign"
            rightComponent={
              <Switch
                value={notifications.marketing}
                onValueChange={(value) => handleNotificationToggle('marketing', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={notifications.marketing ? colors.white : colors.grey[400]}
              />
            }
          />
        </View>

        {/* Préférences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.preferencesSection')}</Text>
          <SettingRow
            title={i18n.t('settings.language')}
            subtitle={`Currently: ${language?.name || 'English'}`}
            icon="language"
            onPress={handleLanguageChange}
            value={language?.code || 'en'}
          />
          <SettingRow
            title={i18n.t('settings.changeCurrency')}
            subtitle={`Currently: ${currency?.symbol || '$'} ${currency?.name || 'US Dollar'}`}
            icon="euro"
            onPress={handleCurrencyChange}
            value={currency?.code || 'USD'}
          />
        </View>

        {/* Support & Aide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.supportHelpSection')}</Text>
          <SettingRow
            title={i18n.t('settings.helpCenter')}
            subtitle={i18n.t('settings.helpCenterSubtitle')}
            icon="help"
            onPress={handleHelp}
          />
          <SettingRow
            title={i18n.t('settings.contactUs')}
            subtitle={i18n.t('settings.contactUsSubtitle')}
            icon="contact-support"
            onPress={handleContact}
          />
        </View>

        {/* Informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.informationSection')}</Text>
          <SettingRow
            title={i18n.t('settings.about')}
            subtitle={i18n.t('settings.aboutSubtitle')}
            icon="info"
            onPress={handleAbout}
          />
          <SettingRow
            title={i18n.t('settings.privacy')}
            subtitle={i18n.t('settings.privacySubtitle')}
            icon="privacy-tip"
            onPress={handlePrivacy}
          />
          <SettingRow
            title={i18n.t('settings.terms')}
            subtitle={i18n.t('settings.termsSubtitle')}
            icon="description"
            onPress={handleTerms}
          />
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            Good Food Restaurant v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.white,
    marginTop: constants.SPACING.md,
    paddingHorizontal: constants.SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: constants.SPACING.md,
    marginBottom: constants.SPACING.sm,
  },
  versionContainer: {
    alignItems: 'center',
    padding: constants.SPACING.xl,
  },
  versionText: {
    fontSize: 12,
    color: colors.grey[500],
  },
});

export default SettingsScreen;
