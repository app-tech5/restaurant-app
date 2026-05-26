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
import { Button, Icon } from 'react-native-elements';
import { useRestaurant } from '../contexts/RestaurantContext';
import apiClient from '../api';
import { ScreenHeader, RestaurantImagePicker } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

const categoryIdFromMenuItem = (menuItem) => {
  if (!menuItem?.category) return '';
  if (typeof menuItem.category === 'object' && menuItem.category !== null) {
    return String(menuItem.category._id || menuItem.category.id || '');
  }
  return String(menuItem.category);
};

const availabilityFromMenuItem = (menuItem) => {
  if (typeof menuItem?.availability === 'boolean') return menuItem.availability;
  if (typeof menuItem?.available === 'boolean') return menuItem.available;
  return menuItem?.available !== false;
};

const AddEditMenuItemScreen = ({ route, navigation }) => {
  const { mode, item } = route.params || {};
  const { addMenuItem, updateMenuItem } = useRestaurant();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    available: true,
    image: '',
    preparation_time: '15',
    ingredients: '',
    tags: ''
  });
  const [errors, setErrors] = useState({});
  const [menuCategories, setMenuCategories] = useState([]);
  const isEditMode = mode === 'edit';

  useEffect(() => {
    let cancelled = false;
    apiClient
      .listCategories()
      .then((items) => {
        if (!cancelled) setMenuCategories(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!cancelled) setMenuCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price != null ? String(item.price) : '',
        category: categoryIdFromMenuItem(item),
        available: availabilityFromMenuItem(item),
        image: item.image || '',
        preparation_time: item.preparation_time ? item.preparation_time.toString() : '15',
        ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : '',
        tags: Array.isArray(item.tags) ? item.tags.join(', ') : ''
      });
    }
  }, [isEditMode, item]);
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = i18n.t('menu.validation.nameRequired');
    }
    if (!formData.description.trim()) {
      newErrors.description = i18n.t('menu.validation.descriptionRequired');
    }
    if (!formData.price.trim()) {
      newErrors.price = i18n.t('menu.validation.priceRequired');
    } else {
      const priceNum = parseFloat(formData.price.replace(',', '.'));
      if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = i18n.t('menu.validation.pricePositiveNumber');
      }
    }
    const categoryId = resolveCategoryForSave();
    if (!categoryId || !/^[a-f0-9]{24}$/i.test(categoryId)) {
      newErrors.category = i18n.t('menu.validation.categoryRequired');
    }
    if (!formData.image.trim()) {
      newErrors.image = i18n.t('menu.validation.imageRequired');
    }
    if (!formData.preparation_time.trim()) {
      newErrors.preparation_time = i18n.t('menu.validation.prepTimeRequired');
    } else {
      const prepTime = parseInt(formData.preparation_time, 10);
      if (isNaN(prepTime) || prepTime <= 0) {
        newErrors.preparation_time = i18n.t('menu.validation.prepTimePositiveNumber');
      }
    }
    setErrors(newErrors);
    const keys = Object.keys(newErrors);
    if (keys.length === 0) return { ok: true };
    return { ok: false, firstError: newErrors[keys[0]] };
  };
  const resolveCategoryForSave = () => {
    const trimmed = String(formData.category || '').trim();
    if (/^[a-f0-9]{24}$/i.test(trimmed)) return trimmed;
    const byName = menuCategories.find(
      (c) => (c.name || '').trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (byName) return String(byName._id || byName.id || '');
    return '';
  };
  const handleSave = async () => {
    const validation = validateForm();
    if (!validation.ok) {
      Alert.alert(
        i18n.t('menu.alerts.error'),
        validation.firstError || i18n.t('menu.validation.formInvalid')
      );
      return;
    }
    try {
      setIsLoading(true);
      const categoryId = resolveCategoryForSave();
      const menuItemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price.replace(',', '.')),
        category: categoryId,
        availability: formData.available,
        image: formData.image.trim(),
        preparation_time: parseInt(formData.preparation_time, 10),
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()).filter(i => i) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : []
      };
      const itemId = item?._id ?? item?.id;
      if (isEditMode && !itemId) {
        Alert.alert(i18n.t('menu.alerts.error'), i18n.t('menu.alerts.missingItemId', { defaultValue: 'Missing dish id.' }));
        return;
      }
      if (isEditMode) {
        await updateMenuItem(itemId, menuItemData);
        Alert.alert(
          i18n.t('menu.alerts.success'),
          i18n.t('menu.alerts.itemUpdated'),
          [{ text: i18n.t('common.ok'), onPress: () => navigation.goBack() }]
        );
      } else {
        await addMenuItem(menuItemData);
        Alert.alert(
          i18n.t('menu.alerts.success'),
          i18n.t('menu.alerts.itemAdded'),
          [
            { text: i18n.t('menu.alerts.addAnother'), style: 'default' },
            { text: i18n.t('menu.alerts.done'), onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Error saving dish:', error);
      Alert.alert(
        i18n.t('menu.alerts.error'),
        isEditMode ? i18n.t('menu.alerts.updateFailed') : i18n.t('menu.alerts.addFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handlePriceChange = (text) => {
    const cleanedText = text.replace(/[^0-9.,]/g, '');
    setFormData(prev => ({ ...prev, price: cleanedText }));
  };
  const selectedCategoryName =
    menuCategories.find((c) => String(c._id || c.id) === String(formData.category))?.name || '';

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScreenHeader
          title={isEditMode ? i18n.t('menu.editItem') : i18n.t('menu.addItem')}
          showBackButton
          onLeftPress={() => navigation.goBack()}
          rightComponent={
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={styles.saveButton}
            >
              <Text style={[styles.saveButtonText, isLoading && styles.saveButtonDisabled]}>
                {isLoading ? i18n.t('common.saving') : i18n.t('common.save')}
              </Text>
            </TouchableOpacity>
          }
        />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {}
            <View style={styles.field}>
            <Text style={styles.fieldLabel}>{i18n.t('menu.itemNameLabel')}</Text>
              <TextInput
                style={[styles.textInput, errors.name && styles.textInputError]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder={i18n.t('menu.namePlaceholder')}
                maxLength={100}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>
            {}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('menu.itemDescriptionLabel')}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, errors.description && styles.textInputError]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder={i18n.t('menu.descriptionPlaceholder')}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            </View>
            <View style={styles.field}>
              <RestaurantImagePicker
                variant="profile"
                sectionTitle={`${i18n.t('menu.imageUrl')} *`}
                fieldLabel={i18n.t('menu.imageUrl')}
                value={formData.image}
                onChange={(url) => {
                  setFormData((prev) => ({ ...prev, image: url }));
                  if (errors.image) {
                    setErrors((prev) => ({ ...prev, image: undefined }));
                  }
                }}
                disabled={isLoading}
                urlPlaceholder={i18n.t('restaurantProfile.imageUrlPlaceholder')}
              />
              {errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
            </View>
            {}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('menu.price')} *</Text>
              <TextInput
                style={[styles.textInput, errors.price && styles.textInputError]}
                value={formData.price}
                onChangeText={handlePriceChange}
                placeholder="0.00"
                keyboardType="decimal-pad"
                maxLength={10}
              />
              {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
            </View>
            {}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('menu.preparationTime')} *</Text>
              <TextInput
                style={[styles.textInput, errors.preparation_time && styles.textInputError]}
                value={formData.preparation_time}
                onChangeText={(text) => setFormData(prev => ({ ...prev, preparation_time: text.replace(/[^0-9]/g, '') }))}
                placeholder="15"
                keyboardType="numeric"
                maxLength={3}
              />
              {errors.preparation_time && <Text style={styles.errorText}>{errors.preparation_time}</Text>}
            </View>
            {}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('menu.category')} *</Text>
              {selectedCategoryName ? (
                <Text style={styles.selectedCategoryText}>{selectedCategoryName}</Text>
              ) : null}
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              {menuCategories.length === 0 ? (
                <Text style={styles.fieldHint}>{i18n.t('onboarding.categoriesEmpty')}</Text>
              ) : (
                <View style={styles.categorySuggestions}>
                  <View style={styles.suggestionsContainer}>
                    {menuCategories.map((cat) => {
                      const id = String(cat._id || cat.id);
                      return (
                        <TouchableOpacity
                          key={id}
                          style={[
                            styles.categoryChip,
                            formData.category === id && styles.categoryChipSelected
                          ]}
                          onPress={() => setFormData((prev) => ({ ...prev, category: id }))}
                        >
                          <Text
                            style={[
                              styles.categoryChipText,
                              formData.category === id && styles.categoryChipTextSelected
                            ]}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
            {}
            <View style={styles.field}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.fieldLabel}>{i18n.t('menu.available')}</Text>
                  <Text style={styles.switchDescription}>
                    {i18n.t('menu.availableDescription')}
                  </Text>
                </View>
                <Switch
                  value={formData.available}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, available: value }))}
                  trackColor={{ false: colors.grey[300], true: colors.primary }}
                  thumbColor={formData.available ? colors.white : colors.grey[400]}
                />
              </View>
            </View>
            {}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('menu.ingredients')}</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.ingredients}
                onChangeText={(text) => setFormData(prev => ({ ...prev, ingredients: text }))}
                placeholder={i18n.t('menu.ingredientsPlaceholder')}
                multiline
                numberOfLines={3}
                maxLength={300}
              />
              <Text style={styles.fieldHint}>
                {i18n.t('menu.ingredientsHint')}
              </Text>
            </View>
            {}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('common.tags')}</Text>
              <TextInput
                style={[styles.textInput]}
                value={formData.tags}
                onChangeText={(text) => setFormData(prev => ({ ...prev, tags: text }))}
                placeholder={i18n.t('menu.tagsPlaceholder')}
                maxLength={200}
              />
              <Text style={styles.fieldHint}>
                {i18n.t('menu.tagsHint')}
              </Text>
            </View>
            {}
            <View style={styles.buttonContainer}>
              <Button
                title={isEditMode ? i18n.t('menu.editItem') : i18n.t('menu.addItem')}
                buttonStyle={styles.saveButtonLarge}
                onPress={handleSave}
                loading={isLoading}
                disabled={isLoading}
              />
            </View>
            {}
            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                {i18n.t('menu.requiredFields')}
              </Text>
              <Text style={styles.infoText}>
                {i18n.t('menu.visibilityNote')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  content: {
    padding: constants.SPACING.md,
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
  saveButtonDisabled: {
    color: colors.grey[400],
  },
  field: {
    marginBottom: constants.SPACING.lg,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
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
  textInputError: {
    borderColor: colors.error,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  fieldHint: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: constants.SPACING.xs,
  },
  selectedCategoryText: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: constants.SPACING.sm,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: constants.SPACING.xs,
  },
  categorySuggestions: {
    marginTop: constants.SPACING.md,
  },
  suggestionsLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: constants.SPACING.sm,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: constants.SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.xs,
    borderRadius: constants.BORDER_RADIUS,
    backgroundColor: colors.grey[100],
    borderWidth: 1,
    borderColor: colors.grey[200],
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  categoryChipTextSelected: {
    color: colors.white,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    flex: 1,
    marginRight: constants.SPACING.md,
  },
  switchDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: constants.SPACING.xs,
  },
  buttonContainer: {
    marginTop: constants.SPACING.xl,
    marginBottom: constants.SPACING.lg,
  },
  saveButtonLarge: {
    backgroundColor: colors.primary,
    borderRadius: constants.BORDER_RADIUS,
    paddingVertical: constants.SPACING.md,
  },
  infoContainer: {
    backgroundColor: colors.grey[100],
    padding: constants.SPACING.md,
    borderRadius: constants.BORDER_RADIUS,
    marginBottom: constants.SPACING.xl,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: constants.SPACING.xs,
  },
});
export default AddEditMenuItemScreen;
