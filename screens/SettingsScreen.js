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
      'Changer de langue',
      'Cette fonctionnalité sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const handleCurrencyChange = () => {
    Alert.alert(
      'Changer de devise',
      'Cette fonctionnalité sera bientôt disponible',
      [{ text: 'OK' }]
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
      'À propos',
      `Good Food Restaurant v1.0.0\n\nApplication de gestion de restaurant`,
      [{ text: 'OK' }]
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Politique de confidentialité',
      'La politique de confidentialité sera bientôt disponible.',
      [{ text: 'OK' }]
    );
  };

  const handleTerms = () => {
    Alert.alert(
      'Conditions d\'utilisation',
      'Les conditions d\'utilisation seront bientôt disponibles.',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    navigation.navigate('Support');
  };

  const handleContact = () => {
    Alert.alert(
      'Contact',
      'Email: support@goodfood.com\nTéléphone: +33 1 23 45 67 89',
      [{ text: 'OK' }]
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
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <SettingRow
            title="Informations du restaurant"
            subtitle="Nom, adresse, description"
            icon="business"
            onPress={handleRestaurantProfile}
          />
          <SettingRow
            title="Horaires d'ouverture"
            subtitle="Modifier vos horaires"
            icon="schedule"
            onPress={handleOpeningHours}
          />
          <SettingRow
            title="Acceptation automatique"
            subtitle="Accepter automatiquement les commandes"
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
          <Text style={styles.sectionTitle}>Services</Text>
          <SettingRow
            title="Paramètres de livraison"
            subtitle="Rayon, frais, délais"
            icon="local-shipping"
            onPress={handleDeliverySettings}
          />
          <SettingRow
            title="Méthodes de paiement"
            subtitle="Gérer vos moyens de paiement"
            icon="payment"
            onPress={handlePaymentSettings}
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingRow
            title="Nouvelles commandes"
            subtitle="Être notifié des nouvelles commandes"
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
            title="Mises à jour commandes"
            subtitle="Modifications de statut des commandes"
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
            title="Stock faible"
            subtitle="Alertes quand un plat est en rupture"
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
            title="Marketing"
            subtitle="Offres spéciales et promotions"
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
          <Text style={styles.sectionTitle}>Préférences</Text>
          <SettingRow
            title="Langue"
            subtitle={`Actuellement: ${language?.name || 'Français'}`}
            icon="language"
            onPress={handleLanguageChange}
            value={language?.code || 'fr'}
          />
          <SettingRow
            title="Devise"
            subtitle={`Actuellement: ${currency?.symbol || '€'} ${currency?.name || 'Euro'}`}
            icon="euro"
            onPress={handleCurrencyChange}
            value={currency?.code || 'EUR'}
          />
        </View>

        {/* Support & Aide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Aide</Text>
          <SettingRow
            title="Centre d'aide"
            subtitle="FAQ et guides d'utilisation"
            icon="help"
            onPress={handleHelp}
          />
          <SettingRow
            title="Nous contacter"
            subtitle="Support technique et assistance"
            icon="contact-support"
            onPress={handleContact}
          />
        </View>

        {/* Informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <SettingRow
            title="À propos"
            subtitle="Version de l'application"
            icon="info"
            onPress={handleAbout}
          />
          <SettingRow
            title="Politique de confidentialité"
            subtitle="Comment nous utilisons vos données"
            icon="privacy-tip"
            onPress={handlePrivacy}
          />
          <SettingRow
            title="Conditions d'utilisation"
            subtitle="Règles et conditions générales"
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
