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
import { Card } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import { ScreenHeader, Loading } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import apiClient from '../api';

const OpeningHoursScreen = ({ navigation }) => {
  const { restaurant, isAuthenticated } = useRestaurant();

  const [isLoading, setIsLoading] = useState(false);
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
    // Validation des horaires si le restaurant n'est pas fermé
    if (!formData.is_closed) {
      if (!formData.openingTime.trim() || !formData.closingTime.trim()) {
        Alert.alert(i18n.t('errors.validationError'), i18n.t('openingHours.validationError'));
        return;
      }

      if (!validateTime(formData.openingTime) || !validateTime(formData.closingTime)) {
        Alert.alert(i18n.t('errors.validationError'), i18n.t('openingHours.invalidTime'));
        return;
      }

      // Vérifier que l'heure de fermeture est après l'heure d'ouverture
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
          [{ text: i18n.t('common.ok') }]
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
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          {i18n.t('openingHours.subtitle')}
        </Text>

        <Card containerStyle={styles.card}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>
              {i18n.t('restaurantProfile.status')}
            </Text>
            <Switch
              value={!formData.is_closed}
              onValueChange={(value) => updateFormData('is_closed', !value)}
              trackColor={{ false: colors.error, true: colors.success }}
              thumbColor={formData.is_closed ? colors.error : colors.success}
            />
            <Text style={[styles.statusText, formData.is_closed && styles.closedText]}>
              {formData.is_closed ? i18n.t('common.disable') : i18n.t('common.enable')}
            </Text>
          </View>

          {!formData.is_closed && (
            <>
              <View style={styles.timeInputContainer}>
                <Text style={styles.inputLabel}>
                  {i18n.t('openingHours.openTime')} ({i18n.t('openingHours.timeFormat')})
                </Text>
                <TextInput
                  style={styles.timeInput}
                  value={formData.openingTime}
                  onChangeText={(value) => updateFormData('openingTime', value)}
                  placeholder="09:00"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>

              <View style={styles.timeInputContainer}>
                <Text style={styles.inputLabel}>
                  {i18n.t('openingHours.closeTime')} ({i18n.t('openingHours.timeFormat')})
                </Text>
                <TextInput
                  style={styles.timeInput}
                  value={formData.closingTime}
                  onChangeText={(value) => updateFormData('closingTime', value)}
                  placeholder="21:00"
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </>
          )}

          {formData.is_closed && (
            <View style={styles.closedContainer}>
              <Text style={styles.closedMessage}>
                {i18n.t('openingHours.closed')}
              </Text>
            </View>
          )}
        </Card>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loading size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {i18n.t('openingHours.save')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: constants.padding,
    paddingBottom: constants.padding * 2,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: constants.padding,
  },
  card: {
    borderRadius: constants.borderRadius,
    padding: constants.padding,
    marginBottom: constants.padding,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: constants.padding,
    paddingBottom: constants.padding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: colors.success,
    marginLeft: 10,
  },
  closedText: {
    color: colors.error,
  },
  timeInputContainer: {
    marginBottom: constants.padding,
  },
  inputLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: constants.borderRadius,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    color: colors.text,
  },
  closedContainer: {
    alignItems: 'center',
    paddingVertical: constants.padding * 2,
  },
  closedMessage: {
    fontSize: 18,
    color: colors.error,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: constants.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: constants.padding,
  },
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: constants.padding,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});

export default OpeningHoursScreen;
