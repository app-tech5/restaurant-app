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

/** Valeurs formulaire quand aucun document `DeliverySetting` n’existe encore (fallback `Restaurant.distance`). */
function formDefaultsFromRestaurant(restaurant) {
  let radius = 15;
  if (restaurant) {
    const d = Number(restaurant.distance);
    if (Number.isFinite(d) && d > 0) {
      radius = Math.min(50, Math.max(1, Math.round(d)));
    }
  }
  return {
    deliveryRadius: String(radius),
    fixedFee: '2.50',
    perKmFee: '0.50',
    freeDeliveryEnabled: false,
    freeDeliveryThreshold: '25.00',
    estimatedTime: '30',
    deliveryEnabled: true,
    pickupEnabled: true,
  };
}

function formFromDeliveryDoc(doc, restaurant) {
  if (!doc || !doc._id) return formDefaultsFromRestaurant(restaurant);
  return {
    deliveryRadius: String(doc.maxDeliveryDistance ?? 15),
    fixedFee: String(doc.fixedDeliveryFee ?? 2.5),
    perKmFee: String(doc.dynamicDeliveryFee?.perKmFee ?? 0.5),
    freeDeliveryEnabled: !!doc.freeDeliveryEnabled,
    freeDeliveryThreshold: String(doc.freeDeliveryThreshold ?? 25),
    estimatedTime: String(doc.deliveryPreparationTime ?? 30),
    deliveryEnabled: doc.isDeliveryEnabled !== false,
    pickupEnabled: doc.isPickupEnabled !== false,
  };
}

const DeliverySettingsScreen = ({ navigation }) => {
  const { restaurant, isAuthenticated, setRestaurant } = useRestaurant();
  const { getCurrencySymbol } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [baselineDoc, setBaselineDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(formDefaultsFromRestaurant(null));
  useEffect(() => {
    if (!restaurant?._id) return undefined;
    let cancelled = false;
    (async () => {
      setSettingsLoading(true);
      try {
        const doc = await apiClient.getDeliverySettingsDoc();
        if (cancelled) return;
        setBaselineDoc(doc || null);
        setFormData(formFromDeliveryDoc(doc, restaurant));
      } catch (e) {
        console.warn('Delivery settings load failed:', e);
        if (!cancelled) {
          setBaselineDoc(null);
          setFormData(formDefaultsFromRestaurant(restaurant));
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurant?._id]);
  const validateNumber = (value, fieldName) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return false;
    }
    return true;
  };
  const handleSave = async () => {
    const radiusNum = parseFloat(formData.deliveryRadius);
    if (!Number.isFinite(radiusNum) || radiusNum < 1 || radiusNum > 50) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('delivery.invalidRadius'));
      return;
    }
    if (!validateNumber(formData.fixedFee, 'fixedFee')) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('delivery.invalidFee'));
      return;
    }
    if (!validateNumber(formData.perKmFee, 'perKmFee')) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('delivery.invalidFee'));
      return;
    }
    if (formData.freeDeliveryEnabled && !validateNumber(formData.freeDeliveryThreshold, 'freeDeliveryThreshold')) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('delivery.invalidThreshold'));
      return;
    }
    if (!validateNumber(formData.estimatedTime, 'estimatedTime')) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('delivery.invalidTime'));
      return;
    }
    try {
      setIsLoading(true);
      const rid = restaurant._id || restaurant.id;
      if (!rid) {
        throw new Error('Missing restaurant id');
      }
      const maxDeliveryDistance = Math.min(50, Math.max(1, radiusNum));
      const perKm = parseFloat(formData.perKmFee);
      const dynBase =
        baselineDoc && typeof baselineDoc.dynamicDeliveryFee === 'object' && baselineDoc.dynamicDeliveryFee
          ? { ...baselineDoc.dynamicDeliveryFee }
          : { baseFee: 1.5, minFee: 1.5, maxFee: 10, perKmFee: 0.5 };
      dynBase.perKmFee = Number.isFinite(perKm) ? perKm : dynBase.perKmFee;
      const prep = parseInt(String(formData.estimatedTime).trim(), 10) || 30;
      const payload = {
        restaurant: rid,
        isDeliveryEnabled: formData.deliveryEnabled,
        isPickupEnabled: formData.pickupEnabled,
        maxDeliveryDistance,
        fixedDeliveryFee: parseFloat(formData.fixedFee),
        dynamicDeliveryFee: dynBase,
        freeDeliveryEnabled: formData.freeDeliveryEnabled,
        freeDeliveryThreshold: formData.freeDeliveryEnabled
          ? parseFloat(formData.freeDeliveryThreshold)
          : 0,
        deliveryPreparationTime: Math.min(180, Math.max(5, prep)),
      };
      const response = await apiClient.upsertRestaurantDeliverySettings(payload);
      if (response && response.error) {
        throw new Error(
          typeof response.error === 'string' ? response.error : 'Update failed'
        );
      }
      if (response && response._id) {
        setBaselineDoc(response);
        setFormData(formFromDeliveryDoc(response, restaurant));
        try {
          const rRes = await apiClient.updateRestaurantProfile({ distance: maxDeliveryDistance });
          if (rRes && rRes._id) {
            setRestaurant((prev) => (prev ? { ...prev, distance: maxDeliveryDistance } : prev));
          }
        } catch (e) {
          console.warn('Restaurant distance sync skipped:', e);
        }
        Alert.alert(
          i18n.t('success.saved'),
          i18n.t('delivery.saveSuccess'),
          [{ text: i18n.t('common.ok'), onPress: () => setIsEditing(false) }]
        );
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating delivery settings:', error);
      Alert.alert(
        i18n.t('errors.error'),
        i18n.t('delivery.saveError')
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handleEdit = () => {
    setIsEditing(true);
  };
  const handleCancel = () => {
    setIsEditing(false);
    if (!restaurant?._id) return;
    void (async () => {
      try {
        const doc = await apiClient.getDeliverySettingsDoc();
        setBaselineDoc(doc || null);
        setFormData(formFromDeliveryDoc(doc, restaurant));
      } catch (_) {
        setBaselineDoc(null);
        setFormData(formDefaultsFromRestaurant(restaurant));
      }
    })();
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
          title={i18n.t('delivery.title')}
          navigation={navigation}
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
        title={i18n.t('delivery.title')}
        navigation={navigation}
        rightComponent={
          !isEditing ? (
            <TouchableOpacity onPress={handleEdit} disabled={settingsLoading}>
              <Text style={[styles.editButton, settingsLoading && styles.editButtonDisabled]}>
                {i18n.t('common.edit')}
              </Text>
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
            <Loading text={i18n.t('delivery.loading')} />
          </View>
        ) : (
        <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('delivery.serviceOptions')}</Text>
          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{i18n.t('delivery.deliveryEnabled')}</Text>
            <View style={[
              styles.statusBadge,
              formData.deliveryEnabled && styles.statusActive,
              !formData.deliveryEnabled && styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                formData.deliveryEnabled && styles.statusTextActive,
                !formData.deliveryEnabled && styles.statusTextInactive
              ]}>
                {formData.deliveryEnabled ? i18n.t('common.enable') : i18n.t('common.disable')}
              </Text>
            </View>
          </View>
          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{i18n.t('delivery.pickupEnabled')}</Text>
            <View style={[
              styles.statusBadge,
              formData.pickupEnabled && styles.statusActive,
              !formData.pickupEnabled && styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                formData.pickupEnabled && styles.statusTextActive,
                !formData.pickupEnabled && styles.statusTextInactive
              ]}>
                {formData.pickupEnabled ? i18n.t('common.enable') : i18n.t('common.disable')}
              </Text>
            </View>
          </View>
        </View>
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('delivery.availability')}</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {i18n.t('delivery.deliveryRadius')} ({i18n.t('delivery.km')})
            </Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={formData.deliveryRadius}
              onChangeText={(value) => updateFormData('deliveryRadius', value)}
              placeholder="15"
              keyboardType="numeric"
              maxLength={3}
              editable={isEditing}
            />
          </View>
        </View>
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('delivery.pricing')}</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {i18n.t('delivery.fixedFee')} ({currencySymbol})
            </Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={formData.fixedFee}
              onChangeText={(value) => updateFormData('fixedFee', value)}
              placeholder="2.50"
              keyboardType="decimal-pad"
              maxLength={6}
              editable={isEditing}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {i18n.t('delivery.perKmFee')} ({currencySymbol})
            </Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={formData.perKmFee}
              onChangeText={(value) => updateFormData('perKmFee', value)}
              placeholder="0.50"
              keyboardType="decimal-pad"
              maxLength={6}
              editable={isEditing}
            />
          </View>
          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{i18n.t('delivery.freeDeliveryEnabled')}</Text>
            <View style={[
              styles.statusBadge,
              formData.freeDeliveryEnabled && styles.statusActive,
              !formData.freeDeliveryEnabled && styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                formData.freeDeliveryEnabled && styles.statusTextActive,
                !formData.freeDeliveryEnabled && styles.statusTextInactive
              ]}>
                {formData.freeDeliveryEnabled ? i18n.t('common.enable') : i18n.t('common.disable')}
              </Text>
            </View>
          </View>
          {formData.freeDeliveryEnabled && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                {i18n.t('delivery.freeDeliveryThreshold')} ({currencySymbol})
              </Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.freeDeliveryThreshold}
                onChangeText={(value) => updateFormData('freeDeliveryThreshold', value)}
                placeholder="20.00"
                keyboardType="decimal-pad"
                maxLength={6}
                editable={isEditing}
              />
            </View>
          )}
        </View>
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('delivery.estimatedTime')}</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {i18n.t('delivery.estimatedTime')} ({i18n.t('delivery.minutes')})
            </Text>
            <TextInput
              style={[styles.textInput, !isEditing && styles.textInputDisabled]}
              value={formData.estimatedTime}
              onChangeText={(value) => updateFormData('estimatedTime', value)}
              placeholder="30"
              keyboardType="numeric"
              maxLength={3}
              editable={isEditing}
            />
          </View>
        </View>
        </>
        )}
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
    paddingBottom: constants.SPACING.xl,
  },
  editButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  editButtonDisabled: {
    opacity: 0.4,
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
export default DeliverySettingsScreen;
