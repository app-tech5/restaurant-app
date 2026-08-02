import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Input, Button, Icon } from 'react-native-elements';
import { colors, constants } from '../global';
import i18n from '../i18n';
import {
  pickImageUriFromGallery,
  pickImageUriFromCamera,
  PICK_FROM_GALLERY_REASON,
} from '../utils/pickImageFromGallery';

export default function RestaurantImagePicker({
  value = '',
  onChange,
  disabled = false,
  variant = 'elements',
  sectionTitle,
  fieldLabel,
  urlPlaceholder,
  pickFromGalleryLabel,
  takePhotoLabel,
  uploadingLabel,
}) {
  const [loading, setLoading] = useState(null);

  const labels = {
    url: urlPlaceholder || i18n.t('onboarding.fields.imageUrl'),
    gallery: pickFromGalleryLabel || i18n.t('onboarding.pickFromGallery'),
    camera: takePhotoLabel || i18n.t('onboarding.takePhoto'),
    uploading: uploadingLabel || i18n.t('onboarding.uploadingImage'),
  };

  const busy = !!loading;
  const locked = disabled || busy;

  const applyUrl = (url) => {
    if (onChange) onChange(url);
  };

  const pickFromGallery = async () => {
    setLoading('gallery');
    try {
      const result = await pickImageUriFromGallery();
      if (!result.ok && result.reason === PICK_FROM_GALLERY_REASON.PERMISSION_DENIED) {
        Alert.alert(i18n.t('common.error'), i18n.t('common.galleryPermission'));
        return;
      }
      if (result.ok) applyUrl(result.link);
    } finally {
      setLoading(null);
    }
  };

  const takePhoto = async () => {
    setLoading('camera');
    try {
      const result = await pickImageUriFromCamera();
      if (!result.ok && result.reason === PICK_FROM_GALLERY_REASON.PERMISSION_DENIED) {
        Alert.alert(i18n.t('common.error'), i18n.t('common.cameraPermission'));
        return;
      }
      if (result.ok) applyUrl(result.link);
    } finally {
      setLoading(null);
    }
  };

  const urlField =
    variant === 'profile' ? (
      <View style={styles.profileField}>
        {fieldLabel ? <Text style={styles.profileLabel}>{fieldLabel}</Text> : null}
        <TextInput
          style={[styles.profileInput, locked && styles.profileInputDisabled]}
          value={value}
          onChangeText={applyUrl}
          placeholder={busy ? labels.uploading : labels.url}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!locked}
        />
        {busy ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.profileLoader}
          />
        ) : null}
      </View>
    ) : (
      <Input
        placeholder={busy ? labels.uploading : labels.url}
        value={value}
        onChangeText={applyUrl}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!locked}
        leftIcon={<Icon name="image" type="material" size={20} color={colors.grey[500]} />}
        rightIcon={
          busy ? <ActivityIndicator size="small" color={colors.primary} /> : undefined
        }
        containerStyle={styles.elementsInput}
        inputStyle={styles.elementsInputText}
      />
    );

  return (
    <View>
      {sectionTitle ? (
        <Text
          style={variant === 'profile' ? styles.profileSectionTitle : styles.elementsSectionTitle}
        >
          {sectionTitle}
        </Text>
      ) : null}
      {urlField}
      <Button
        type="outline"
        title={labels.gallery}
        onPress={pickFromGallery}
        loading={loading === 'gallery'}
        disabled={locked}
        buttonStyle={styles.outlineButton}
        titleStyle={styles.outlineButtonTitle}
        containerStyle={styles.outlineButtonContainer}
        icon={
          <Icon
            name="photo-library"
            type="material"
            size={20}
            color={colors.primary}
            style={styles.buttonIcon}
          />
        }
      />
      <Button
        type="outline"
        title={labels.camera}
        onPress={takePhoto}
        loading={loading === 'camera'}
        disabled={locked}
        buttonStyle={styles.outlineButton}
        titleStyle={styles.outlineButtonTitle}
        containerStyle={styles.outlineButtonContainer}
        icon={
          <Icon
            name="photo-camera"
            type="material"
            size={20}
            color={colors.primary}
            style={styles.buttonIcon}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  elementsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: constants.SPACING.md,
  },
  elementsInput: {
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  elementsInputText: {
    color: colors.text.primary,
    fontSize: 15,
  },
  profileField: {
    marginBottom: constants.SPACING.md,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: constants.SPACING.xs,
  },
  profileInput: {
    borderWidth: 1,
    borderColor: colors.grey[300],
    borderRadius: constants.BORDER_RADIUS,
    paddingHorizontal: constants.SPACING.md,
    paddingVertical: constants.SPACING.sm,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  profileInputDisabled: {
    backgroundColor: colors.grey[50],
    color: colors.grey[600],
  },
  profileLoader: {
    marginTop: constants.SPACING.sm,
  },
  outlineButtonContainer: {
    marginTop: 4,
    marginBottom: 4,
  },
  outlineButton: {
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  outlineButtonTitle: {
    color: colors.primary,
    fontSize: 15,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
