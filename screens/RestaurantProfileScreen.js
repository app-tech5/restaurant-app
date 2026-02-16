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
import { ScreenHeader, Loading } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import apiClient from '../api';

const RestaurantProfileScreen = ({ navigation }) => {
  const { restaurant, isAuthenticated } = useRestaurant();

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
    latitude: '',
    longitude: '',
    openingTime: '',
    closingTime: '',
    collectTime: '',
    serviceModes: '',
    image: '',
    theme: '',
    commission_rate: '',
    reward: '',
    is_closed: false,
    isActivated: true
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        description: restaurant.description || '',
        country: restaurant.country || '',
        city: restaurant.city || '',
        latitude: restaurant.latitude || '',
        longitude: restaurant.longitude || '',
        openingTime: restaurant.openingTime || '',
        closingTime: restaurant.closingTime || '',
        collectTime: restaurant.collectTime?.toString() || '',
        serviceModes: restaurant.serviceModes || '',
        image: restaurant.image || restaurant.image_url || '',
        theme: restaurant.theme || '',
        commission_rate: restaurant.commission_rate?.toString() || '',
        reward: restaurant.reward || '',
        is_closed: restaurant.is_closed || false,
        isActivated: restaurant.isActivated !== undefined ? restaurant.isActivated : true
      });
    }
  }, [restaurant]);

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('restaurantProfile.nameRequired'));
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('restaurantProfile.emailRequired'));
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert(i18n.t('errors.validationError'), i18n.t('restaurantProfile.invalidEmail'));
      return;
    }

    try {
      setIsLoading(true);

      const response = await apiClient.updateRestaurantProfile(formData);

      if (response.success) {
        Alert.alert(
          i18n.t('success.saved'),
          i18n.t('restaurantProfile.updateSuccess'),
          [{ text: i18n.t('common.ok'), onPress: () => setIsEditing(false) }]
        );
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert(i18n.t('errors.serverError'), i18n.t('restaurantProfile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset les données du formulaire
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        description: restaurant.description || '',
        country: restaurant.country || '',
        city: restaurant.city || '',
        latitude: restaurant.latitude || '',
        longitude: restaurant.longitude || '',
        openingTime: restaurant.openingTime || '',
        closingTime: restaurant.closingTime || '',
        collectTime: restaurant.collectTime?.toString() || '',
        serviceModes: restaurant.serviceModes || '',
        image: restaurant.image || restaurant.image_url || '',
        theme: restaurant.theme || '',
        commission_rate: restaurant.commission_rate?.toString() || '',
        reward: restaurant.reward || '',
        is_closed: restaurant.is_closed || false,
        isActivated: restaurant.isActivated !== undefined ? restaurant.isActivated : true
      });
    }
    setIsEditing(false);
  };

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('restaurantProfile.title')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <Loading fullScreen text={i18n.t('restaurantProfile.loading')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={i18n.t('restaurantProfile.title')}
        showBackButton
        onLeftPress={() => navigation.goBack()}
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.content}>
          {/* Informations de base */}
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

          {/* Description */}
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

          {/* Informations de localisation */}
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

            <View style={styles.rowField}>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.fieldLabel}>Latitude</Text>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                  value={formData.latitude}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, latitude: text }))}
                  placeholder="48.8566"
                  keyboardType="numeric"
                  editable={isEditing}
                />
              </View>
              <View style={[styles.field, styles.halfField]}>
                <Text style={styles.fieldLabel}>Longitude</Text>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                  value={formData.longitude}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, longitude: text }))}
                  placeholder="2.3522"
                  keyboardType="numeric"
                  editable={isEditing}
                />
              </View>
            </View>
          </View>

          {/* Horaires d'ouverture */}
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
                keyboardType="numeric"
                editable={isEditing}
              />
            </View>
          </View>

          {/* Options de service */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.serviceOptions')}</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.serviceModes')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.serviceModes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, serviceModes: text }))}
                placeholder={`${i18n.t('restaurantProfile.deliveryMode')} / ${i18n.t('restaurantProfile.pickupMode')}`}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Image du restaurant */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.restaurantImage')}</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.imageUrl')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.image}
                onChangeText={(text) => setFormData(prev => ({ ...prev, image: text }))}
                placeholder={i18n.t('restaurantProfile.imageUrlPlaceholder')}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Informations business */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.businessInfo')}</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.theme')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.theme}
                onChangeText={(text) => setFormData(prev => ({ ...prev, theme: text }))}
                placeholder={i18n.t('restaurantProfile.themePlaceholder')}
                editable={isEditing}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('restaurantProfile.commissionRate')}</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.commission_rate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, commission_rate: text }))}
                placeholder="10"
                keyboardType="numeric"
                editable={isEditing}
              />
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

          {/* Informations système (lecture seule) */}
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
              <Text style={styles.infoLabel}>{i18n.t('restaurantProfile.isClosed')}</Text>
              <View style={[
                styles.statusBadge,
                !restaurant.is_closed && styles.statusActive,
                restaurant.is_closed && styles.statusInactive
              ]}>
                <Text style={[
                  styles.statusText,
                  !restaurant.is_closed && styles.statusTextActive,
                  restaurant.is_closed && styles.statusTextInactive
                ]}>
                  {restaurant.is_closed ? 'Fermé' : 'Ouvert'}
                </Text>
              </View>
            </View>

            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>{i18n.t('restaurantProfile.isActivated')}</Text>
              <View style={[
                styles.statusBadge,
                restaurant.isActivated && styles.statusActive,
                !restaurant.isActivated && styles.statusInactive
              ]}>
                <Text style={[
                  styles.statusText,
                  restaurant.isActivated && styles.statusTextActive,
                  !restaurant.isActivated && styles.statusTextInactive
                ]}>
                  {restaurant.isActivated ? i18n.t('restaurantProfile.active') : i18n.t('restaurantProfile.inactive')}
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
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.grey[50],
  },
  keyboardAvoidingView: {
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
