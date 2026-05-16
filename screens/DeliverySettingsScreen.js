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
  Platform,
  Switch,
} from 'react-native';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useSettings } from '../contexts/SettingContext';
import { ScreenHeader, Loading } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import apiClient from '../api';
import {
  deliverySettingsFormDefaults,
  deliverySettingsFormFromDoc,
  buildDeliverySettingsPayload,
  validateDeliverySettingsForm,
} from '../utils/deliverySettingsForm';

function SwitchField({ label, hint, value, onValueChange, disabled }) {
  return (
    <View style={styles.field}>
      <View style={styles.switchRow}>
        <View style={styles.switchLabelCol}>
          <Text style={styles.fieldLabel}>{label}</Text>
          {hint ? <Text style={styles.switchHint}>{hint}</Text> : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: colors.grey[300], true: colors.primary }}
          thumbColor={value ? colors.white : colors.grey[400]}
        />
      </View>
    </View>
  );
}

function FeeTypeOption({ label, selected, onPress, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.feeTypeChip, selected && styles.feeTypeChipSelected, disabled && styles.feeTypeChipDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.feeTypeChipText, selected && styles.feeTypeChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const DeliverySettingsScreen = ({ navigation }) => {
  const { restaurant, isAuthenticated, setRestaurant } = useRestaurant();
  const { getCurrencySymbol } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [baselineDoc, setBaselineDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(deliverySettingsFormDefaults(null));

  const loadDoc = async () => {
    const doc = await apiClient.getDeliverySettingsDoc();
    setBaselineDoc(doc || null);
    setFormData(deliverySettingsFormFromDoc(doc, restaurant));
  };

  useEffect(() => {
    if (!restaurant?._id) return undefined;
    let cancelled = false;
    (async () => {
      setSettingsLoading(true);
      try {
        if (cancelled) return;
        await loadDoc();
      } catch (e) {
        console.warn('Delivery settings load failed:', e);
        if (!cancelled) {
          setBaselineDoc(null);
          setFormData(deliverySettingsFormDefaults(restaurant));
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurant?._id]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const validationError = validateDeliverySettingsForm(formData, (key) => i18n.t(key));
    if (validationError) {
      Alert.alert(i18n.t('errors.validationError'), validationError);
      return;
    }

    try {
      setIsLoading(true);
      const rid = restaurant._id || restaurant.id;
      if (!rid) {
        throw new Error('Missing restaurant id');
      }

      const payload = buildDeliverySettingsPayload(formData, rid, baselineDoc);
      const response = await apiClient.upsertRestaurantDeliverySettings(payload);

      if (response?.error) {
        throw new Error(typeof response.error === 'string' ? response.error : 'Update failed');
      }
      if (!response?._id) {
        throw new Error('Update failed');
      }

      setBaselineDoc(response);
      setFormData(deliverySettingsFormFromDoc(response, restaurant));

      try {
        const rRes = await apiClient.updateRestaurantProfile({
          distance: payload.maxDeliveryDistance,
          isAvailableForDelivery: payload.isDeliveryEnabled,
        });
        if (rRes?._id) {
          setRestaurant((prev) =>
            prev
              ? {
                  ...prev,
                  distance: payload.maxDeliveryDistance,
                  isAvailableForDelivery: payload.isDeliveryEnabled,
                }
              : prev
          );
        }
      } catch (e) {
        console.warn('Restaurant profile sync skipped:', e);
      }

      Alert.alert(i18n.t('success.saved'), i18n.t('delivery.saveSuccess'), [
        { text: i18n.t('common.ok'), onPress: () => setIsEditing(false) },
      ]);
    } catch (error) {
      console.error('Error updating delivery settings:', error);
      Alert.alert(i18n.t('errors.error'), i18n.t('delivery.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (!restaurant?._id) return;
    void (async () => {
      try {
        await loadDoc();
      } catch (_) {
        setBaselineDoc(null);
        setFormData(deliverySettingsFormDefaults(restaurant));
      }
    })();
  };

  const currencySymbol = getCurrencySymbol();
  const isDynamic = formData.deliveryFeeType === 'DYNAMIC';
  const switchDisabled = !isEditing;

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={i18n.t('delivery.title')} navigation={navigation} />
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>{i18n.t('auth.loginRequired')}</Text>
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
            <TouchableOpacity onPress={() => setIsEditing(true)} disabled={settingsLoading}>
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
              <SwitchField
                label={i18n.t('delivery.deliveryEnabled')}
                hint={i18n.t('delivery.deliveryEnabledSubtitle')}
                value={formData.deliveryEnabled}
                onValueChange={(v) => updateFormData('deliveryEnabled', v)}
                disabled={switchDisabled}
              />
              <SwitchField
                label={i18n.t('delivery.pickupEnabled')}
                hint={i18n.t('delivery.pickupEnabledSubtitle')}
                value={formData.pickupEnabled}
                onValueChange={(v) => updateFormData('pickupEnabled', v)}
                disabled={switchDisabled}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('delivery.availability')}</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {i18n.t('delivery.deliveryRadius')} ({i18n.t('delivery.km')})
                </Text>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                  value={formData.deliveryRadius}
                  onChangeText={(v) => updateFormData('deliveryRadius', v)}
                  placeholder="15"
                  keyboardType="numeric"
                  maxLength={3}
                  editable={isEditing}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {i18n.t('delivery.prepTime')} ({i18n.t('delivery.minutes')})
                </Text>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                  value={formData.estimatedTime}
                  onChangeText={(v) => updateFormData('estimatedTime', v)}
                  placeholder="30"
                  keyboardType="numeric"
                  maxLength={3}
                  editable={isEditing}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{i18n.t('delivery.pricing')}</Text>

              <Text style={styles.fieldLabel}>{i18n.t('delivery.feeType')}</Text>
              <View style={styles.feeTypeRow}>
                <FeeTypeOption
                  label={i18n.t('delivery.feeTypeFixed')}
                  selected={!isDynamic}
                  disabled={switchDisabled}
                  onPress={() => updateFormData('deliveryFeeType', 'FIXED')}
                />
                <FeeTypeOption
                  label={i18n.t('delivery.feeTypeDynamic')}
                  selected={isDynamic}
                  disabled={switchDisabled}
                  onPress={() => updateFormData('deliveryFeeType', 'DYNAMIC')}
                />
              </View>

              {!isDynamic ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    {i18n.t('delivery.fixedFee')} ({currencySymbol})
                  </Text>
                  <TextInput
                    style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                    value={formData.fixedFee}
                    onChangeText={(v) => updateFormData('fixedFee', v)}
                    placeholder="2.50"
                    keyboardType="decimal-pad"
                    maxLength={8}
                    editable={isEditing}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>
                      {i18n.t('delivery.baseFee')} ({currencySymbol})
                    </Text>
                    <TextInput
                      style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                      value={formData.baseFee}
                      onChangeText={(v) => updateFormData('baseFee', v)}
                      keyboardType="decimal-pad"
                      maxLength={8}
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
                      onChangeText={(v) => updateFormData('perKmFee', v)}
                      keyboardType="decimal-pad"
                      maxLength={8}
                      editable={isEditing}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>
                      {i18n.t('delivery.minFee')} ({currencySymbol})
                    </Text>
                    <TextInput
                      style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                      value={formData.minFee}
                      onChangeText={(v) => updateFormData('minFee', v)}
                      keyboardType="decimal-pad"
                      maxLength={8}
                      editable={isEditing}
                    />
                  </View>
                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>
                      {i18n.t('delivery.maxFee')} ({currencySymbol})
                    </Text>
                    <TextInput
                      style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                      value={formData.maxFee}
                      onChangeText={(v) => updateFormData('maxFee', v)}
                      keyboardType="decimal-pad"
                      maxLength={8}
                      editable={isEditing}
                    />
                  </View>
                </>
              )}

              <SwitchField
                label={i18n.t('delivery.freeDeliveryEnabled')}
                hint={i18n.t('delivery.freeDeliveryThresholdSubtitle')}
                value={formData.freeDeliveryEnabled}
                onValueChange={(v) => updateFormData('freeDeliveryEnabled', v)}
                disabled={switchDisabled}
              />
              {formData.freeDeliveryEnabled ? (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>
                    {i18n.t('delivery.freeDeliveryThreshold')} ({currencySymbol})
                  </Text>
                  <TextInput
                    style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                    value={formData.freeDeliveryThreshold}
                    onChangeText={(v) => updateFormData('freeDeliveryThreshold', v)}
                    placeholder="25.00"
                    keyboardType="decimal-pad"
                    maxLength={8}
                    editable={isEditing}
                  />
                </View>
              ) : null}
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
  scrollView: { flex: 1 },
  scrollContent: {
    padding: constants.SPACING.md,
    paddingBottom: constants.SPACING.xl,
  },
  editButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  editButtonDisabled: { opacity: 0.4 },
  editButtons: { flexDirection: 'row', alignItems: 'center' },
  cancelButton: { marginRight: constants.SPACING.md },
  cancelButtonText: { color: colors.grey[600], fontSize: 16 },
  saveHeaderButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS,
  },
  saveHeaderButtonDisabled: { backgroundColor: colors.grey[400] },
  saveHeaderButtonText: { color: colors.white, fontSize: 16, fontWeight: '500' },
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
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  field: { marginBottom: constants.SPACING.md },
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelCol: { flex: 1, paddingRight: constants.SPACING.md },
  switchHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  feeTypeRow: {
    flexDirection: 'row',
    gap: constants.SPACING.sm,
    marginBottom: constants.SPACING.md,
  },
  feeTypeChip: {
    flex: 1,
    paddingVertical: constants.SPACING.sm,
    paddingHorizontal: constants.SPACING.sm,
    borderRadius: constants.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: colors.grey[300],
    alignItems: 'center',
  },
  feeTypeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '15',
  },
  feeTypeChipDisabled: { opacity: 0.6 },
  feeTypeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  feeTypeChipTextSelected: { color: colors.primary },
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
