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

const OpeningHoursScreen = ({ navigation }) => {
  const { restaurant, isAuthenticated } = useRestaurant();

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    openingTime: '',
    closingTime: '',
    is_closed: false
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        openingTime: restaurant.openingTime || '09:00',
        closingTime: restaurant.closingTime || '21:00',
        is_closed: restaurant.is_closed || false
      });
    }
  }, [restaurant]);

  const validateTime = (time) => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleSave = async () => {
    
    if (!formData.is_closed) {
      if (!formData.openingTime.trim() || !formData.closingTime.trim()) {
        Alert.alert(i18n.t('errors.validationError'), i18n.t('openingHours.validationError'));
        return;
      }

      if (!validateTime(formData.openingTime) || !validateTime(formData.closingTime)) {
        Alert.alert(i18n.t('errors.validationError'), i18n.t('openingHours.invalidTime'));
        return;
      }
      
      const openTime = new Date(`2000-01-01T${formData.openingTime}:00`);
      const closeTime = new Date(`2000-01-01T${formData.closingTime}:00`);

      if (closeTime <= openTime) {
        Alert.alert(i18n.t('errors.validationError'), i18n.t('openingHours.closeBeforeOpen'));
        return;
      }
    }

    try {
      setIsLoading(true);

      const updateData = {
        openingTime: formData.is_closed ? '' : formData.openingTime,
        closingTime: formData.is_closed ? '' : formData.closingTime,
        is_closed: formData.is_closed
      };

      const response = await apiClient.updateRestaurantProfile(updateData);

      if (response.success) {
        Alert.alert(
          i18n.t('success.saved'),
          i18n.t('openingHours.saveSuccess'),
          [{ text: i18n.t('common.ok'), onPress: () => setIsEditing(false) }]
        );
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating opening hours:', error);
      Alert.alert(
        i18n.t('errors.error'),
        i18n.t('openingHours.saveError')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    
    if (restaurant) {
      setFormData({
        openingTime: restaurant.openingTime || '09:00',
        closingTime: restaurant.closingTime || '21:00',
        is_closed: restaurant.is_closed || false
      });
    }
    setIsEditing(false);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={i18n.t('openingHours.title')}
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
        title={i18n.t('openingHours.title')}
        navigation={navigation}
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
                disabled={isLoading}
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
        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.systemInfo')}</Text>

          <View style={styles.infoField}>
            <Text style={styles.infoLabel}>{i18n.t('restaurantProfile.status')}</Text>
            <View style={[
              styles.statusBadge,
              !formData.is_closed && styles.statusActive,
              formData.is_closed && styles.statusInactive
            ]}>
              <Text style={[
                styles.statusText,
                !formData.is_closed && styles.statusTextActive,
                formData.is_closed && styles.statusTextInactive
              ]}>
                {formData.is_closed ? i18n.t('restaurantProfile.inactive') : i18n.t('restaurantProfile.active')}
              </Text>
            </View>
          </View>
        </View>

        {}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('restaurantProfile.operatingHours')}</Text>

          {!formData.is_closed ? (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {i18n.t('restaurantProfile.openingTime')}
                </Text>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                  value={formData.openingTime}
                  onChangeText={(value) => updateFormData('openingTime', value)}
                  placeholder="09:00"
                  keyboardType="numeric"
                  maxLength={5}
                  editable={isEditing}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {i18n.t('restaurantProfile.closingTime')}
                </Text>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                  value={formData.closingTime}
                  onChangeText={(value) => updateFormData('closingTime', value)}
                  placeholder="21:00"
                  keyboardType="numeric"
                  maxLength={5}
                  editable={isEditing}
                />
              </View>
            </>
          ) : (
            <View style={styles.closedContainer}>
              <Text style={styles.closedMessage}>
                {i18n.t('openingHours.closed')}
              </Text>
            </View>
          )}
        </View>
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
  closedContainer: {
    alignItems: 'center',
    paddingVertical: constants.SPACING.lg,
  },
  closedMessage: {
    fontSize: 18,
    color: colors.error,
    fontWeight: 'bold',
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

export default OpeningHoursScreen;
