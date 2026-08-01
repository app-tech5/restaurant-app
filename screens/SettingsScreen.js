import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../contexts/SettingContext';
import { useUserSettings } from '../hooks/useUserSettings';
import { ScreenHeader, SettingRow } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { safeBottomPad } from '../utils/safeBottom';
const SettingsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    currency,
    language,
    getAvailableCurrencies,
    changeCurrency,
  } = useSettings();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [currencyChoices, setCurrencyChoices] = useState([]);
  const {
    userSettings,
    loading: userSettingsLoading,
    updateNotifications,
    updateRestaurantSettings
  } = useUserSettings();
  const handleNotificationToggle = async (key, value) => {
    if (!userSettings) return;
    const updatedNotifications = {
      ...userSettings.notifications,
      [key]: value
    };
    const result = await updateNotifications(updatedNotifications);
    if (!result.success) {
      Alert.alert(i18n.t('errors.serverError'), result.error);
    }
  };
  const handleRestaurantSettingToggle = async (key, value) => {
    if (!userSettings) return;
    const updatedSettings = {
      ...userSettings.restaurantSettings,
      [key]: value
    };
    const result = await updateRestaurantSettings(updatedSettings);
    if (!result.success) {
      Alert.alert(i18n.t('errors.serverError'), result.error);
    }
  };
  const handleLanguageChange = () => {
    navigation.navigate('LanguageSettings');
  };
  const handleCurrencyChange = async () => {
    try {
      const list = await getAvailableCurrencies();
      if (!list.length) {
        Alert.alert(i18n.t('errors.error'), i18n.t('settings.noCurrenciesFromServer'));
        return;
      }
      setCurrencyChoices(list);
      setCurrencyModalVisible(true);
    } catch (error) {
      console.error('Currency list:', error);
      Alert.alert(i18n.t('errors.error'), i18n.t('settings.currencyLoadError'));
    }
  };
  const handlePickCurrency = async (item) => {
    const id = item?._id || item?.id;
    setCurrencyModalVisible(false);
    if (!id) return;
    try {
      await changeCurrency(String(id));
      Alert.alert(i18n.t('success.saved'), i18n.t('settings.currencySaved'));
    } catch (error) {
      console.error('Currency save:', error);
      Alert.alert(i18n.t('errors.error'), i18n.t('settings.currencySaveError'));
    }
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
        autoLeftNav
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: constants.SPACING.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {}
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
                value={userSettings?.restaurantSettings?.autoAcceptOrders || false}
                onValueChange={(value) => handleRestaurantSettingToggle('autoAcceptOrders', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={(userSettings?.restaurantSettings?.autoAcceptOrders || false) ? colors.white : colors.grey[400]}
                disabled={userSettingsLoading}
              />
            }
          />
        </View>
        {}
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
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('settings.notificationsSettings')}</Text>
          <SettingRow
            title={i18n.t('settings.newOrdersNotif')}
            subtitle={i18n.t('settings.orderUpdatesNotif')}
            icon="notifications"
            rightComponent={
              <Switch
                value={userSettings?.notifications?.newOrders ?? true}
                onValueChange={(value) => handleNotificationToggle('newOrders', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={(userSettings?.notifications?.newOrders ?? true) ? colors.white : colors.grey[400]}
                disabled={userSettingsLoading}
              />
            }
          />
          <SettingRow
            title={i18n.t('settings.orderUpdatesNotif')}
            subtitle="Order status changes"
            icon="update"
            rightComponent={
              <Switch
                value={userSettings?.notifications?.orderUpdates ?? true}
                onValueChange={(value) => handleNotificationToggle('orderUpdates', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={(userSettings?.notifications?.orderUpdates ?? true) ? colors.white : colors.grey[400]}
                disabled={userSettingsLoading}
              />
            }
          />
          <SettingRow
            title={i18n.t('settings.lowStockNotif')}
            subtitle="Alerts when a dish is out of stock"
            icon="inventory"
            rightComponent={
              <Switch
                value={userSettings?.notifications?.lowStock ?? false}
                onValueChange={(value) => handleNotificationToggle('lowStock', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={(userSettings?.notifications?.lowStock ?? false) ? colors.white : colors.grey[400]}
                disabled={userSettingsLoading}
              />
            }
          />
          <SettingRow
            title={i18n.t('settings.marketingNotif')}
            subtitle="Special offers and promotions"
            icon="campaign"
            rightComponent={
              <Switch
                value={userSettings?.notifications?.marketing ?? false}
                onValueChange={(value) => handleNotificationToggle('marketing', value)}
                trackColor={{ false: colors.grey[300], true: colors.primary }}
                thumbColor={(userSettings?.notifications?.marketing ?? false) ? colors.white : colors.grey[400]}
                disabled={userSettingsLoading}
              />
            }
          />
        </View>
        {}
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
            subtitle={i18n.t('settings.currencyRowSubtitle', {
              symbol: currency?.symbol ?? '',
              name: currency?.name ?? '',
              code: currency?.code ?? '',
            })}
            icon="euro"
            onPress={handleCurrencyChange}
            value={currency?.code || 'EUR'}
          />
        </View>
        {}
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
        {}
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
        {}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            Good Food Restaurant v1.0.0
          </Text>
        </View>
      </ScrollView>
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{i18n.t('settings.selectCurrency')}</Text>
            <FlatList
              data={currencyChoices}
              keyExtractor={(item) => String(item._id || item.id || item.code)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => handlePickCurrency(item)}
                >
                  <Text style={styles.modalRowText}>
                    {item.symbol} {item.name} ({item.code})
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{i18n.t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={{ height: safeBottomPad(insets.bottom, 0) }} />
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: constants.SPACING.md,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    maxHeight: '70%',
    paddingVertical: constants.SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    paddingHorizontal: constants.SPACING.md,
    marginBottom: constants.SPACING.sm,
    color: colors.grey[900],
  },
  modalRow: {
    paddingVertical: constants.SPACING.md,
    paddingHorizontal: constants.SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.grey[200],
  },
  modalRowText: {
    fontSize: 16,
    color: colors.grey[800],
  },
  modalCancel: {
    marginTop: constants.SPACING.sm,
    paddingVertical: constants.SPACING.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
});
export default SettingsScreen;
