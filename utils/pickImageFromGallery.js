import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api';

/** @typedef {'permission_denied' | 'cancelled' | 'no_asset'} PickFromGalleryFailureReason */

export const PICK_FROM_GALLERY_REASON = {
  PERMISSION_DENIED: 'permission_denied',
  CANCELLED: 'cancelled',
  NO_ASSET: 'no_asset',
};

/**
 * Requests media-library permission, then opens the image picker.
 * Does not show UI; callers should handle `reason` (e.g. Alert on permission denied).
 *
 * @param {ImagePicker.ImagePickerOptions} [launchOptions] merged with defaults (images only, quality 1).
 * @returns {Promise<{ ok: true, link: string } | { ok: false, reason: PickFromGalleryFailureReason }>}
 */
export async function pickImageUriFromGallery(launchOptions = {}) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.PERMISSION_DENIED,
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    ...launchOptions,
  });

  if (result.canceled) {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.CANCELLED,
    };
  }

  const uri = result.assets?.[0]?.uri;

  if (!uri) {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.NO_ASSET,
    };
  }

  // Upload ou génération du lien distant
  const data = await apiClient.createImageLink(uri);
  const link = typeof data === 'string' ? data : data?.url;
  if (!link || typeof link !== 'string') {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.NO_ASSET,
    };
  }

  return {
    ok: true,
    link,
  };
}

export async function pickImageUriFromCamera(launchOptions = {}) {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.PERMISSION_DENIED,
    };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    ...launchOptions,
  });

  if (result.canceled) {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.CANCELLED,
    };
  }

  const uri = result.assets?.[0]?.uri;

  if (!uri) {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.NO_ASSET,
    };
  }

  const data = await apiClient.createImageLink(uri);
  const link = typeof data === 'string' ? data : data?.url;
  if (!link || typeof link !== 'string') {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.NO_ASSET,
    };
  }

  return {
    ok: true,
    link,
  };
}
