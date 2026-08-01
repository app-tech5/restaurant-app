import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader, SettingRow, Loading } from '../components';
import { useUserSettings } from '../hooks/useUserSettings';
import { colors, constants } from '../global';
import i18n from '../i18n';

const NotificationSettingsScreen = () => {
  const { userSettings, loading, updateNotifications } = useUserSettings();

  const handleToggle = async (key, value) => {
    if (!userSettings) return;
    const updated = {
      ...userSettings.notifications,
      [key]: value,
    };
    const result = await updateNotifications(updated);
    if (!result.success) {
      Alert.alert(i18n.t('errors.serverError'), result.error);
    }
  };

  if (loading && !userSettings) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScreenHeader title={i18n.t('navigation.notificationSettings')} autoLeftNav />
        <Loading text={i18n.t('common.loading')} />
      </SafeAreaView>
    );
  }

  const notifications = userSettings?.notifications || {};

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title={i18n.t('navigation.notificationSettings')} autoLeftNav />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{i18n.t('settings.notificationsSettings')}</Text>
        <SettingRow
          title={i18n.t('settings.newOrdersNotif')}
          subtitle={i18n.t('settings.orderUpdatesNotif')}
          icon="notifications"
          rightComponent={
            <Switch
              value={notifications.newOrders ?? true}
              onValueChange={(value) => handleToggle('newOrders', value)}
              trackColor={{ false: colors.grey[300], true: colors.primary }}
              thumbColor={(notifications.newOrders ?? true) ? colors.white : colors.grey[400]}
            />
          }
        />
        <SettingRow
          title={i18n.t('settings.orderUpdatesNotif')}
          subtitle={i18n.t('settings.orderStatusChanges')}
          icon="sync"
          rightComponent={
            <Switch
              value={notifications.orderUpdates ?? true}
              onValueChange={(value) => handleToggle('orderUpdates', value)}
              trackColor={{ false: colors.grey[300], true: colors.primary }}
              thumbColor={(notifications.orderUpdates ?? true) ? colors.white : colors.grey[400]}
            />
          }
        />
        <SettingRow
          title={i18n.t('settings.lowStockAlerts')}
          subtitle={i18n.t('settings.lowStockAlertsSubtitle')}
          icon="inventory"
          rightComponent={
            <Switch
              value={notifications.lowStock ?? false}
              onValueChange={(value) => handleToggle('lowStock', value)}
              trackColor={{ false: colors.grey[300], true: colors.primary }}
              thumbColor={(notifications.lowStock ?? false) ? colors.white : colors.grey[400]}
            />
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollView: { flex: 1 },
  content: { paddingBottom: constants.SPACING.xl },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginHorizontal: constants.SPACING.md,
    marginTop: constants.SPACING.md,
    marginBottom: constants.SPACING.sm,
  },
});

export default NotificationSettingsScreen;
