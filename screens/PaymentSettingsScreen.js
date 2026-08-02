import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useSettings } from '../contexts/SettingContext';
import { ScreenHeader, Loading } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import apiClient from '../api';
import { getRestaurantEmailForDisplay, withRestaurantAccountEmail } from '../utils/restaurantUtils';

function getCommissionRateValue(restaurant) {
  if (!restaurant) return '0';
  if (restaurant.commission_rate !== undefined && restaurant.commission_rate !== null) {
    return String(restaurant.commission_rate);
  }
  if (restaurant.commissionRate !== undefined && restaurant.commissionRate !== null) {
    return String(restaurant.commissionRate);
  }
  return '0';
}

function toTextNumber(value, fallback) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return fallback;
  return String(value);
}

function paymentSettingsDefaults() {
  return {
    cashPayment: true,
    cardPayment: true,
    onlinePayment: false,
    commissionRate: '5.0',
    minimumOrder: '10.00',
    fixedFee: '0.30',
    percentageFee: '2.9'
  };
}

function paymentSettingsFormFromDoc(doc, restaurant) {
  const base = paymentSettingsDefaults();
  return {
    ...base,
    cashPayment: doc?.cashPayment !== undefined ? !!doc.cashPayment : base.cashPayment,
    cardPayment: doc?.cardPayment !== undefined ? !!doc.cardPayment : base.cardPayment,
    onlinePayment: doc?.onlinePayment !== undefined ? !!doc.onlinePayment : base.onlinePayment,
    commissionRate: getCommissionRateValue(restaurant),
    minimumOrder: toTextNumber(doc?.minimumOrder, base.minimumOrder),
    fixedFee: toTextNumber(doc?.fixedFee, base.fixedFee),
    percentageFee: toTextNumber(doc?.percentageFee, base.percentageFee),
  };
}

const PaymentSettingsScreen = ({ navigation }) => {
  const { restaurant, isAuthenticated, setRestaurant } = useRestaurant();
  const { getCurrencySymbol } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [paymentSettingsDoc, setPaymentSettingsDoc] = useState(null);
  const [formData, setFormData] = useState(paymentSettingsDefaults());
  useEffect(() => {
    if (!restaurant?._id) return undefined;
    let cancelled = false;
    (async () => {
      setSettingsLoading(true);
      try {
        const doc = await apiClient.getRestaurantPaymentSettingsDoc();
        if (cancelled) return;
        setPaymentSettingsDoc(doc || null);
        setFormData(paymentSettingsFormFromDoc(doc, restaurant));
      } catch (e) {
        if (!cancelled) {
          setPaymentSettingsDoc(null);
          setFormData(paymentSettingsFormFromDoc(null, restaurant));
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurant?._id, restaurant?.commission_rate, restaurant?.commissionRate]);
  const validateNumber = (value, fieldName, min = 0, max = null) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < min) {
      return false;
    }
    if (max !== null && num > max) {
      return false;
    }
    return true;
  };
  const handleSave = async () => {
    if (!validateNumber(formData.commissionRate, 'commissionRate', 0, 100)) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('payment.invalidRate'));
      return;
    }
    if (!validateNumber(formData.minimumOrder, 'minimumOrder', 0)) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('payment.invalidAmount'));
      return;
    }
    if (!validateNumber(formData.fixedFee, 'fixedFee', 0)) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('payment.invalidFee'));
      return;
    }
    if (!validateNumber(formData.percentageFee, 'percentageFee', 0, 100)) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('payment.invalidFee'));
      return;
    }
    try {
      setIsLoading(true);
      const rid = restaurant?._id || restaurant?.id;
      if (!rid) throw new Error('Missing restaurant id');
      const payload = {
        restaurant: rid,
        cashPayment: !!formData.cashPayment,
        cardPayment: !!formData.cardPayment,
        onlinePayment: !!formData.onlinePayment,
        minimumOrder: parseFloat(formData.minimumOrder),
        fixedFee: parseFloat(formData.fixedFee),
        percentageFee: parseFloat(formData.percentageFee),
      };
      const settingsResponse = await apiClient.upsertRestaurantPaymentSettings(payload);
      if (settingsResponse && settingsResponse.error) {
        throw new Error(
          typeof settingsResponse.error === 'string' ? settingsResponse.error : 'Update failed'
        );
      }
      const profileResponse = await apiClient.updateRestaurantProfile({
        commission_rate: parseFloat(formData.commissionRate),
      });
      if (profileResponse && profileResponse.error) {
        throw new Error(
          typeof profileResponse.error === 'string' ? profileResponse.error : 'Update failed'
        );
      }
      if (settingsResponse && settingsResponse._id && profileResponse && profileResponse._id) {
        setPaymentSettingsDoc(settingsResponse);
        setRestaurant(
          withRestaurantAccountEmail(profileResponse, {
            email: getRestaurantEmailForDisplay(restaurant),
          })
        );
        Alert.alert(
          i18n.t('success.saved'),
          i18n.t('payment.saveSuccess'),
          [{ text: i18n.t('common.ok'), onPress: () => setIsEditing(false) }]
        );
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      Alert.alert(
        i18n.t('errors.error'),
        i18n.t('payment.saveError')
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancel = () => {
    setFormData(paymentSettingsFormFromDoc(paymentSettingsDoc, restaurant));
    setIsEditing(false);
  };
  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const currencySymbol = getCurrencySymbol();
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('payment.title')}
          autoLeftNav
        />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>
            {i18n.t('auth.loginRequired')}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title={i18n.t('payment.title')}
        autoLeftNav
        rightComponent={
          !isEditing ? (
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editButton}>{i18n.t('common.edit')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editButtons}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>{i18n.t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveHeaderButton, isLoading && styles.saveHeaderButtonDisabled]}
                disabled={isLoading || settingsLoading}
              >
                {isLoading ? (
                  <Loading size="small" color={colors.white} />
                ) : (
                  <Text style={styles.saveHeaderButtonText}>{i18n.t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )
        }
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {settingsLoading ? (
          <View style={styles.centerContent}>
            <Loading text={i18n.t('payment.loading')} />
          </View>
        ) : null}
        {!settingsLoading ? (
        <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('payment.methods')}</Text>
          <View style={styles.infoField}>
            <View style={styles.methodInfo}>
              <Text style={styles.infoLabel}>{i18n.t('payment.cashPayment')}</Text>
              <Text style={styles.methodSubtitle}>{i18n.t('payment.cashPaymentSubtitle')}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              formData.cashPayment && styles.statusActive,
              !formData.cashPayment && styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                formData.cashPayment && styles.statusTextActive,
                !formData.cashPayment && styles.statusTextInactive
              ]}>
                {formData.cashPayment ? i18n.t('common.enable') : i18n.t('common.disable')}
              </Text>
            </View>
          </View>
          <View style={styles.infoField}>
            <View style={styles.methodInfo}>
              <Text style={styles.infoLabel}>{i18n.t('payment.cardPayment')}</Text>
              <Text style={styles.methodSubtitle}>{i18n.t('payment.cardPaymentSubtitle')}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              formData.cardPayment && styles.statusActive,
              !formData.cardPayment && styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                formData.cardPayment && styles.statusTextActive,
                !formData.cardPayment && styles.statusTextInactive
              ]}>
                {formData.cardPayment ? i18n.t('common.enable') : i18n.t('common.disable')}
              </Text>
            </View>
          </View>
          <View style={styles.infoField}>
            <View style={styles.methodInfo}>
              <Text style={styles.infoLabel}>{i18n.t('payment.onlinePayment')}</Text>
              <Text style={styles.methodSubtitle}>{i18n.t('payment.onlinePaymentSubtitle')}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              formData.onlinePayment && styles.statusActive,
              !formData.onlinePayment && styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                formData.onlinePayment && styles.statusTextActive,
                !formData.onlinePayment && styles.statusTextInactive
              ]}>
                {formData.onlinePayment ? i18n.t('common.enable') : i18n.t('common.disable')}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('payment.fees')}</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {i18n.t('payment.commissionRate')} (%)
            </Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={formData.commissionRate}
              onChangeText={(value) => updateFormData('commissionRate', value)}
              placeholder="5.0"
              keyboardType="decimal-pad"
              maxLength={6}
              editable={isEditing}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {i18n.t('payment.minimumOrder')} ({currencySymbol})
            </Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={formData.minimumOrder}
              onChangeText={(value) => updateFormData('minimumOrder', value)}
              placeholder="10.00"
              keyboardType="decimal-pad"
              maxLength={8}
              editable={isEditing}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {i18n.t('payment.fixedFee')} ({currencySymbol})
            </Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={formData.fixedFee}
              onChangeText={(value) => updateFormData('fixedFee', value)}
              placeholder="0.30"
              keyboardType="decimal-pad"
              maxLength={6}
              editable={isEditing}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {i18n.t('payment.percentageFee')} (%)
            </Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={formData.percentageFee}
              onChangeText={(value) => updateFormData('percentageFee', value)}
              placeholder="2.9"
              keyboardType="decimal-pad"
              maxLength={6}
              editable={isEditing}
            />
          </View>
        </View>
        </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContent: {
    padding: constants.SPACING.md,
    paddingBottom: constants.SPACING.xl * 2,
  },
  editButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  editButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: constants.SPACING.md,
  },
  cancelButtonText: {
    color: colors.grey[600],
    fontSize: 16,
  },
  saveHeaderButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS,
  },
  saveHeaderButtonDisabled: {
    backgroundColor: colors.grey[400],
  },
  saveHeaderButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.grey[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  field: {
    marginBottom: constants.SPACING.md,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: constants.SPACING.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.grey[300],
    borderRadius: constants.BORDER_RADIUS,
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text.primary,
  },
  textInputDisabled: {
    backgroundColor: colors.grey[100],
    color: colors.grey[600],
  },
  infoField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: constants.SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey[100],
  },
  methodInfo: {
    flex: 1,
    marginRight: constants.SPACING.md,
  },
  methodSubtitle: {
    fontSize: 12,
    color: colors.grey[500],
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: constants.SPACING.sm,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS / 2,
    backgroundColor: colors.grey[100],
  },
  statusActive: {
    backgroundColor: colors.success + '20',
  },
  statusInactive: {
    backgroundColor: colors.error + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.grey[600],
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextInactive: {
    color: colors.error,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: constants.SPACING.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});
export default PaymentSettingsScreen;
