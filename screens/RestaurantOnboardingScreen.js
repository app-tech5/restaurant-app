import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { useRestaurant } from '../contexts/RestaurantContext';
import {
  RESTAURANT_SERVICE_MODES,
  RESTAURANT_PRICE_OPTIONS,
  buildRestaurantOnboardingPayload,
  buildRestaurantCategoriesPayload,
} from '../utils/restaurantUtils';
import { Categories, RestaurantImagePicker } from '../components';
import { geocodeAddress } from '../utils/geocoding';

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const initialForm = {
  name: '',
  description: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  openingTime: '09:00',
  closingTime: '21:00',
  serviceModes: 'delivery',
  price: '$',
  image: '',
  selectedCategoryIds: [],
};

export default function RestaurantOnboardingScreen() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const { completeOnboarding, logout, restaurant } = useRestaurant();
  const [categoryOptions, setCategoryOptions] = useState([]);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    if (!form.name.trim()) return i18n.t('onboarding.errors.nameRequired');
    if (!form.description.trim()) return i18n.t('onboarding.errors.descriptionRequired');
    if (!form.phone.trim()) return i18n.t('onboarding.errors.phoneRequired');
    if (!form.address.trim()) return i18n.t('onboarding.errors.addressRequired');
    if (!form.city.trim()) return i18n.t('onboarding.errors.cityRequired');
    if (!form.country.trim()) return i18n.t('onboarding.errors.countryRequired');
    if (!form.openingTime.trim() || !TIME_RE.test(form.openingTime.trim()))
      return i18n.t('onboarding.errors.openingTimeInvalid');
    if (!form.closingTime.trim() || !TIME_RE.test(form.closingTime.trim()))
      return i18n.t('onboarding.errors.closingTimeInvalid');
    if (!form.image.trim()) return i18n.t('onboarding.errors.imageRequired');
    if (!form.selectedCategoryIds?.length) {
      return i18n.t('onboarding.errors.categoriesRequired');
    }
    return null;
  };

  const handleSubmit = async () => {
    const errorMessage = validate();
    if (errorMessage) {
      Alert.alert(i18n.t('common.error'), errorMessage);
      return;
    }
  
    setSubmitting(true);
  
    try {
      const geo = await geocodeAddress({
        address: form.address,
        city: form.city,
        country: form.country,
      });
  
      if (!geo) {
        Alert.alert(
          i18n.t('common.error'),
          "Impossible de récupérer la position de cette adresse"
        );
        return;
      }
  
      const body = buildRestaurantOnboardingPayload({
        ...form,
        latitude: geo.lat,
        longitude: geo.lon,
        categories: buildRestaurantCategoriesPayload(
          form.selectedCategoryIds,
          categoryOptions
        ),
      });
  
      const result = await completeOnboarding(body);
  
      if (!result.success) {
        Alert.alert(
          i18n.t('common.error'),
          result.message || i18n.t('onboarding.errors.submit')
        );
      }
    } catch (error) {
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('onboarding.errors.submit')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {}
  };

  const Segment = ({ value, options, onChange, getLabel }) => (
    <View style={styles.segmentRow}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.segmentBtn, active && styles.segmentBtnActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {getLabel ? getLabel(opt) : opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <LinearGradient colors={colors.auth.gradient1} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Icon name="storefront" type="material" color={colors.white} size={56} />
            <Text style={styles.title}>{i18n.t('onboarding.title')}</Text>
            <Text style={styles.subtitle}>
              {i18n.t('onboarding.subtitle', {
                name: restaurant?.name || restaurant?.email || '',
              })}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{i18n.t('onboarding.sections.identity')}</Text>
            <Input
              placeholder={i18n.t('onboarding.fields.name')}
              value={form.name}
              onChangeText={set('name')}
              autoCapitalize="words"
              leftIcon={<Icon name="storefront" type="material" size={20} color={colors.grey[500]} />}
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
            <Input
              placeholder={i18n.t('onboarding.fields.description')}
              value={form.description}
              onChangeText={set('description')}
              multiline
              numberOfLines={3}
              leftIcon={<Icon name="notes" type="material" size={20} color={colors.grey[500]} />}
              containerStyle={styles.input}
              inputStyle={[styles.inputText, styles.textArea]}
            />

            <Categories
              sectionTitle={i18n.t('onboarding.sections.categories')}
              hint={i18n.t('onboarding.fields.categoriesHint')}
              selectedIds={form.selectedCategoryIds}
              onChangeSelectedIds={(ids) =>
                setForm((prev) => ({ ...prev, selectedCategoryIds: ids }))
              }
              onCategoriesLoaded={setCategoryOptions}
            />

            <Text style={styles.sectionTitle}>{i18n.t('onboarding.sections.contact')}</Text>
            <Input
              placeholder={i18n.t('onboarding.fields.phone')}
              value={form.phone}
              onChangeText={set('phone')}
              keyboardType="phone-pad"
              leftIcon={<Icon name="phone" type="material" size={20} color={colors.grey[500]} />}
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
            <Text style={styles.sectionTitle}>{i18n.t('onboarding.sections.location')}</Text>
            <Input
              placeholder={i18n.t('onboarding.fields.address')}
              value={form.address}
              onChangeText={set('address')}
              leftIcon={<Icon name="place" type="material" size={20} color={colors.grey[500]} />}
              containerStyle={styles.input}
              inputStyle={styles.inputText}
            />
            <View style={styles.row}>
              <Input
                placeholder={i18n.t('onboarding.fields.city')}
                value={form.city}
                onChangeText={set('city')}
                containerStyle={[styles.input, styles.flex1]}
                inputStyle={styles.inputText}
              />
              <Input
                placeholder={i18n.t('onboarding.fields.country')}
                value={form.country}
                onChangeText={set('country')}
                containerStyle={[styles.input, styles.flex1]}
                inputStyle={styles.inputText}
              />
            </View>

            <Text style={styles.sectionTitle}>{i18n.t('onboarding.sections.operations')}</Text>
            <View style={styles.row}>
              <Input
                placeholder={i18n.t('onboarding.fields.openingTime')}
                value={form.openingTime}
                onChangeText={set('openingTime')}
                keyboardType="number-pad"
                leftIcon={<Icon name="schedule" type="material" size={20} color={colors.grey[500]} />}
                containerStyle={[styles.input, styles.flex1]}
                inputStyle={styles.inputText}
              />
              <Input
                placeholder={i18n.t('onboarding.fields.closingTime')}
                value={form.closingTime}
                onChangeText={set('closingTime')}
                keyboardType="number-pad"
                leftIcon={<Icon name="schedule" type="material" size={20} color={colors.grey[500]} />}
                containerStyle={[styles.input, styles.flex1]}
                inputStyle={styles.inputText}
              />
            </View>

            <Text style={styles.label}>{i18n.t('onboarding.fields.serviceModes')}</Text>
            <Segment
              value={form.serviceModes}
              options={RESTAURANT_SERVICE_MODES}
              onChange={set('serviceModes')}
              getLabel={(o) => i18n.t(`onboarding.serviceModes.${o}`, { defaultValue: o })}
            />

            <Text style={styles.label}>{i18n.t('onboarding.fields.price')}</Text>
            <Segment
              value={form.price}
              options={RESTAURANT_PRICE_OPTIONS}
              onChange={set('price')}
            />

            <RestaurantImagePicker
              variant="elements"
              sectionTitle={i18n.t('onboarding.sections.image')}
              value={form.image}
              onChange={set('image')}
              disabled={submitting}
              urlPlaceholder={i18n.t('onboarding.fields.imageUrl')}
            />

            <Button
              title={
                submitting
                  ? i18n.t('onboarding.submitting')
                  : i18n.t('onboarding.submit')
              }
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              buttonStyle={[styles.primaryButton, { backgroundColor: colors.primary }]}
              containerStyle={styles.primaryButtonContainer}
              titleStyle={styles.primaryButtonText}
              raised
            />

            <TouchableOpacity style={styles.logoutLink} onPress={handleLogout}>
              <Text style={styles.logoutText}>{i18n.t('onboarding.logout')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  label: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  inputText: {
    color: colors.text.primary,
    fontSize: 15,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  segmentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: constants.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.white,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.white,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
  },
  primaryButtonContainer: {
    marginTop: 18,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 13,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
