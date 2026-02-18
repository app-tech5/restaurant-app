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
import { ScreenHeader } from '../components';
import { colors, constants } from '../global';
import i18n from '../i18n';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  const isEditMode = mode === 'edit';

  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price ? item.price.toString() : '',
        category: item.category || '',
        available: item.available !== false,
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
      newErrors.name = 'Le nom du plat est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Le prix est requis';
    } else {
      const priceNum = parseFloat(formData.price.replace(',', '.'));
      if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = 'Le prix doit être un nombre positif';
      }
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La catégorie est requise';
    }

    if (!formData.image.trim()) {
      newErrors.image = 'L\'image est requise';
    }

    if (!formData.preparation_time.trim()) {
      newErrors.preparation_time = 'Le temps de préparation est requis';
    } else {
      const prepTime = parseInt(formData.preparation_time);
      if (isNaN(prepTime) || prepTime <= 0) {
        newErrors.preparation_time = 'Le temps de préparation doit être un nombre positif';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const menuItemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price.replace(',', '.')),
        category: formData.category.trim(),
        available: formData.available,
        image: formData.image.trim(),
        preparation_time: parseInt(formData.preparation_time),
        ingredients: formData.ingredients ? formData.ingredients.split(',').map(i => i.trim()).filter(i => i) : [],
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : []
      };

      if (isEditMode) {
        await updateMenuItem(item._id, menuItemData);
        Alert.alert(
          'Succès',
          'Le plat a été modifié avec succès',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        await addMenuItem(menuItemData);
        Alert.alert(
          'Succès',
          'Le plat a été ajouté avec succès',
          [
            { text: 'Ajouter un autre', style: 'default' },
            { text: 'Terminé', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur sauvegarde plat:', error);
      Alert.alert(
        'Erreur',
        `Impossible de ${isEditMode ? 'modifier' : 'ajouter'} le plat`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (text) => {
    
    const cleanedText = text.replace(/[^0-9.,]/g, '');
    setFormData(prev => ({ ...prev, price: cleanedText }));
  };

  const commonCategories = [
    i18n.t('menu.categoryTypes.appetizers'),
    i18n.t('menu.categoryTypes.mainCourses'),
    i18n.t('menu.categoryTypes.desserts'),
    i18n.t('menu.categoryTypes.beverages'),
    i18n.t('menu.categoryTypes.sides'),
    i18n.t('menu.categoryTypes.specialties')
  ];

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

            {}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{i18n.t('menu.imageUrl')} *</Text>
              <TextInput
                style={[styles.textInput, errors.image && styles.textInputError]}
                value={formData.image}
                onChangeText={(text) => setFormData(prev => ({ ...prev, image: text }))}
                placeholder="https://exemple.com/image.jpg"
                maxLength={500}
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
              <TextInput
                style={[styles.textInput, errors.category && styles.textInputError]}
                value={formData.category}
                onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                placeholder="Ex: Plats principaux, Desserts..."
                maxLength={50}
              />
              {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

              {}
              <View style={styles.categorySuggestions}>
                <Text style={styles.suggestionsLabel}>{i18n.t('menu.suggestions')} :</Text>
                <View style={styles.suggestionsContainer}>
                  {commonCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        formData.category === cat && styles.categoryChipSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, category: cat }))}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        formData.category === cat && styles.categoryChipTextSelected
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
              <Text style={styles.fieldLabel}>Tags</Text>
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
