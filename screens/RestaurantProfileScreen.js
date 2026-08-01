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
  Switch
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRestaurant } from '../contexts/RestaurantContext';
import { ScreenHeader, Loading, Categories, RestaurantImagePicker } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import apiClient from '../api';
import {
  RESTAURANT_SERVICE_MODES,
  RESTAURANT_THEME_OPTIONS,
  restaurantProfileFormFromRestaurant,
  buildRestaurantProfileUpdatePayload,
  buildRestaurantCategoriesPayload,
  withRestaurantAccountEmail,
} from '../utils/restaurantUtils';
import { geocodeAddress } from '../utils/geocoding';
import { safeBottomPad } from '../utils/safeBottom';

const THEME_LABEL_KEYS = {
  default: 'restaurantProfile.themeDefault',
  dark: 'restaurantProfile.themeDark',
  light: 'restaurantProfile.themeLight',
};

const RestaurantProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { restaurant, setRestaurant } = useRestaurant();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    country: '',
    city: '',
    openingTime: '',
    closingTime: '',
    collectTime: '',
    serviceModes: 'delivery',
    image: '',
    theme: 'default',
    commission_rate: '',
    reward: '',
    is_closed: false,
    isActivated: true,
    isAvailableForDelivery: false,
    selectedCategoryIds: [],
  });
  const [categoryOptions, setCategoryOptions] = useState([]);
  useEffect(() => {
    if (restaurant) {
      const next = restaurantProfileFormFromRestaurant(restaurant);
      if (next) setFormData(next);
    }
  }, [restaurant]);
  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('restaurantProfile.nameRequired'));
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('restaurantProfile.emailRequired'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('restaurantProfile.invalidEmail'));
      return;
    }
    if (!formData.selectedCategoryIds?.length) {
      Alert.alert(
        i18n.t('errors.validationError'),
        i18n.t('onboarding.errors.categoriesRequired')
      );
      return;
    }
    try {
      setIsLoading(true);

      const locationChanged =
        formData.address.trim() !== String(restaurant?.address || '').trim() ||
        formData.city.trim() !== String(restaurant?.city || '').trim() ||
        formData.country.trim() !== String(restaurant?.country || '').trim();

      let latitude = restaurant?.latitude;
      let longitude = restaurant?.longitude;

      if (locationChanged) {
        const geo = await geocodeAddress({
          address: formData.address,
          city: formData.city,
          country: formData.country,
        });
        if (!geo) {
          Alert.alert(
            i18n.t('errors.validationError'),
            i18n.t('restaurantProfile.geocodeFailed')
          );
          return;
        }
        latitude = String(geo.lat);
        longitude = String(geo.lon);
      }

      const payload = buildRestaurantProfileUpdatePayload({
        ...formData,
        latitude,
        longitude,
        categories: buildRestaurantCategoriesPayload(
          formData.selectedCategoryIds,
          categoryOptions
        ),
      });
      const response = await apiClient.updateRestaurantProfile(payload);
      if (response && response.error) {
        throw new Error(
          typeof response.error === 'string' ? response.error : 'Update failed'
        );
      }
      if (response && response._id) {
        setRestaurant(
          withRestaurantAccountEmail(response, { email: formData.email.trim() })
        );
        Alert.alert(
          i18n.t('success.saved'),
          i18n.t('restaurantProfile.updateSuccess'),
          [{ text: i18n.t('common.ok'), onPress: () => setIsEditing(false) }]
        );
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert(i18n.t('errors.serverError'), i18n.t('restaurantProfile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    if (restaurant) {
      const next = restaurantProfileFormFromRestaurant(restaurant);
      if (next) setFormData(next);
    }
    setIsEditing(false);
  };
  if (!restaurant) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('restaurantProfile.title')}
          autoLeftNav
        />
        <Loading fullScreen text={i18n.t('restaurantProfile.loading')} />
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('restaurantProfile.title')}
        autoLeftNav
        rightComponent={
          isEditing ? (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>{i18n.t('restaurantProfile.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>
                  {isLoading ? i18n.t('restaurantProfile.saving') : i18n.t('restaurantProfile.save')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Text style={styles.editButtonText}>{i18n.t('restaurantProfile.edit')}</Text>
            </TouchableOpacity>
          )
        }
      />
      <KeyboardAvoidingView
        style={styles.keyboardOuter}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: safeBottomPad(insets.bottom, constants.SPACING.xl * 2) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.generalInfo')}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.restaurantName')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder={i18n.t('restaurantProfile.restaurantNamePlaceholder')}
                editable={isEditing}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.email')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder={i18n.t('restaurantProfile.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isEditing}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.phone')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder={i18n.t('restaurantProfile.phonePlaceholder')}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.address')}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, !isEditing && styles.textInputDisabled]}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholder={i18n.t('restaurantProfile.addressPlaceholder')}
                multiline
                numberOfLines={3}
                editable={isEditing}
              />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.description')}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.descriptionLabel')}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, !isEditing && styles.textInputDisabled]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder={i18n.t('restaurantProfile.descriptionPlaceholder')}
                multiline
                numberOfLines={5}
                editable={isEditing}
              />
            </View>
          </View>
          <View style={styles.section}>
            <Categories
              sectionTitle={i18n.t('restaurantProfile.categories')}
              hint={i18n.t('restaurantProfile.categoriesHint')}
              selectedIds={formData.selectedCategoryIds}
              onChangeSelectedIds={(ids) =>
                setFormData((prev) => ({ ...prev, selectedCategoryIds: ids }))
              }
              disabled={!isEditing}
              onCategoriesLoaded={setCategoryOptions}
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.locationInfo')}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.country')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.country}
                onChangeText={(text) => setFormData(prev => ({ ...prev, country: text }))}
                placeholder={i18n.t('restaurantProfile.countryPlaceholder')}
                editable={isEditing}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.city')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.city}
                onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                placeholder={i18n.t('restaurantProfile.cityPlaceholder')}
                editable={isEditing}
              />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.operatingHours')}</Text>
            <View style={styles.rowField}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.openingTime')}</Text>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                  value={formData.openingTime}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, openingTime: text }))}
                  placeholder="09:00"
                  keyboardType="number-pad"
                  editable={isEditing}
                />
              </View>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.closingTime')}</Text>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                  value={formData.closingTime}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, closingTime: text }))}
                  placeholder="21:00"
                  keyboardType="number-pad"
                  editable={isEditing}
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.collectTime')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.collectTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, collectTime: text }))}
                placeholder="15"
                keyboardType="number-pad"
                editable={isEditing}
              />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.serviceOptions')}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.serviceModes')}</Text>
              <View style={styles.chipRow}>
                {RESTAURANT_SERVICE_MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.chip,
                      formData.serviceModes === mode && styles.chipSelected,
                      !isEditing && styles.chipDisabled,
                    ]}
                    onPress={() => {
                      if (!isEditing) return;
                      setFormData((prev) => ({ ...prev, serviceModes: mode }));
                    }}
                    disabled={!isEditing}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.serviceModes === mode && styles.chipTextSelected,
                      ]}
                    >
                      {mode === 'delivery'
                        ? i18n.t('restaurantProfile.deliveryMode')
                        : i18n.t('restaurantProfile.pickupMode')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <RestaurantImagePicker
              variant="profile"
              sectionTitle={i18n.t('restaurantProfile.restaurantImage')}
              fieldLabel={i18n.t('restaurantProfile.imageUrl')}
              value={formData.image}
              onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
              disabled={!isEditing}
              urlPlaceholder={i18n.t('restaurantProfile.imageUrlPlaceholder')}
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.businessInfo')}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.theme')}</Text>
              <View style={styles.chipRow}>
                {RESTAURANT_THEME_OPTIONS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.chip,
                      formData.theme === t && styles.chipSelected,
                      !isEditing && styles.chipDisabled,
                    ]}
                    onPress={() => {
                      if (!isEditing) return;
                      setFormData((prev) => ({ ...prev, theme: t }));
                    }}
                    disabled={!isEditing}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.theme === t && styles.chipTextSelected,
                      ]}
                    >
                      {i18n.t(THEME_LABEL_KEYS[t])}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.commissionRate')}</Text>
              <Text style={styles.infoValue}>
                {formData.commission_rate !== ''
                  ? `${formData.commission_rate}%`
                  : '—'}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.rewards')}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, !isEditing && styles.textInputDisabled]}
                value={formData.reward}
                onChangeText={(text) => setFormData(prev => ({ ...prev, reward: text }))}
                placeholder={i18n.t('restaurantProfile.rewardsPlaceholder')}
                multiline
                numberOfLines={3}
                editable={isEditing}
              />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.availabilitySection')}</Text>
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.isClosed')}</Text>
                  <Text style={styles.switchHint}>
                    {formData.is_closed
                      ? i18n.t('restaurantProfile.closedNow')
                      : i18n.t('restaurantProfile.openNow')}
                  </Text>
                </View>
                <Switch
                  value={formData.is_closed}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, is_closed: value }))}
                  disabled={!isEditing}
                  trackColor={{ false: colors.grey[300], true: colors.primary }}
                  thumbColor={formData.is_closed ? colors.white : colors.grey[400]}
                />
              </View>
            </View>
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.isActivated')}</Text>
                </View>
                <Switch
                  value={formData.isActivated}
                  disabled
                  trackColor={{ false: colors.grey[300], true: colors.primary }}
                  thumbColor={formData.isActivated ? colors.white : colors.grey[400]}
                />
              </View>
            </View>
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.availableForDelivery')}</Text>
                  <Text style={styles.switchHint}>{i18n.t('restaurantProfile.availableForDeliveryHint')}</Text>
                </View>
                <Switch
                  value={formData.isAvailableForDelivery}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, isAvailableForDelivery: value }))
                  }
                  disabled={!isEditing}
                  trackColor={{ false: colors.grey[300], true: colors.primary }}
                  thumbColor={formData.isAvailableForDelivery ? colors.white : colors.grey[400]}
                />
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.systemInfo')}</Text>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>{i18n.t('restaurantProfile.status')}</Text>
              <View style={[
                styles.statusBadge,
                restaurant.status === 'active' && styles.statusActive,
                restaurant.status === 'inactive' && styles.statusInactive
              ]}>
                <Text style={[
                  styles.statusText,
                  restaurant.status === 'active' && styles.statusTextActive,
                  restaurant.status === 'inactive' && styles.statusTextInactive
                ]}>
                  {restaurant.status === 'active' ? i18n.t('restaurantProfile.active') : i18n.t('restaurantProfile.inactive')}
                </Text>
              </View>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>{i18n.t('restaurantProfile.restaurantId')}</Text>
              <Text style={styles.infoValue}>{restaurant._id}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>{i18n.t('restaurantProfile.type')}</Text>
              <Text style={styles.infoValue}>
                {restaurant.type === 'restaurant' ? i18n.t('restaurantProfile.restaurant') : restaurant.type}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ height: safeBottomPad(insets.bottom, 0) }} />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  keyboardOuter: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: constants.SPACING.md,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    marginRight: constants.SPACING.sm,
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
  },
  cancelButtonText: {
    color: colors.grey[600],
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: constants.BORDER_RADIUS,
    padding: constants.SPACING.md,
    marginBottom: constants.SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
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
  rowField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    flex: 0.48,
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
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  textInputDisabled: {
    backgroundColor: colors.grey[50],
    color: colors.grey[600],
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: constants.SPACING.sm,
  },
  chip: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS,
    backgroundColor: colors.grey[100],
    borderWidth: 1,
    borderColor: colors.grey[200],
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.85,
  },
  chipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelCol: {
    flex: 1,
    marginRight: constants.SPACING.md,
  },
  switchHint: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: constants.SPACING.xs,
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
  infoValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
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
});
export default RestaurantProfileScreen;
