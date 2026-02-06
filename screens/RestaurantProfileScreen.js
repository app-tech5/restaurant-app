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

const RestaurantProfileScreen = ({ navigation }) => {
  const { restaurant, isAuthenticated } = useRestaurant();

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    description: ''
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        email: restaurant.email || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        description: restaurant.description || ''
      });
    }
  }, [restaurant]);

  const handleSave = async () => {
    // Validation basique
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom du restaurant est requis');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Erreur', 'L\'email n\'est pas valide');
      return;
    }

    try {
      setIsLoading(true);

      // TODO: Implémenter l'API pour mettre à jour le profil
      // await apiClient.updateRestaurantProfile(formData);

      Alert.alert(
        'Succès',
        'Les informations du restaurant ont été mises à jour',
        [{ text: 'OK', onPress: () => setIsEditing(false) }]
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
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
        description: restaurant.description || ''
      });
    }
    setIsEditing(false);
  };

  if (!restaurant) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title="Profil restaurant"
          showBackButton
          onLeftPress={() => navigation.goBack()}
        />
        <Loading fullScreen text="Chargement..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader
        title="Profil restaurant"
        showBackButton
        onLeftPress={() => navigation.goBack()}
        rightComponent={
          isEditing ? (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Informations de base */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations générales</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nom du restaurant *</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Nom du restaurant"
                editable={isEditing}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email *</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="email@restaurant.com"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={isEditing}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Téléphone</Text>
              <TextInput
                style={[styles.textInput, !isEditing && styles.textInputDisabled]}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                placeholder="+33123456789"
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Adresse</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, !isEditing && styles.textInputDisabled]}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholder="123 Rue de la Paix, 75001 Paris"
                multiline
                numberOfLines={3}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description du restaurant</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, !isEditing && styles.textInputDisabled]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Décrivez votre restaurant, sa cuisine, son ambiance..."
                multiline
                numberOfLines={5}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Informations système (lecture seule) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations système</Text>

            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Statut</Text>
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
                  {restaurant.status === 'active' ? 'Actif' : 'Inactif'}
                </Text>
              </View>
            </View>

            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>ID Restaurant</Text>
              <Text style={styles.infoValue}>{restaurant._id}</Text>
            </View>

            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>
                {restaurant.type === 'restaurant' ? 'Restaurant' : restaurant.type}
              </Text>
            </View>
          </View>
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
