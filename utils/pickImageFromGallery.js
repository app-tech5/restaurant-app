import * as ImagePicker from 'expo-image-picker';
import apiClient from '../api';

/** @typedef {'permission_denied' | 'cancelled' | 'no_asset'} PickFromGalleryFailureReason */

export const PICK_FROM_GALLERY_REASON = {
  PERMISSION_DENIED: 'permission_denied',
  CANCELLED: 'cancelled',
  NO_ASSET: 'no_asset',
};

/**
 * Pick image from gallery + upload to Cloudinary
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

  // ✅ CLOUDINARY UPLOAD
  const data = await apiClient.uploadImageToCloudinary(uri);

  const link = data?.url;

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

/**
 * Pick image from camera + upload to Cloudinary
 */
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

  // ✅ CLOUDINARY UPLOAD
  const data = await apiClient.uploadImageToCloudinary(uri);

  const link = data?.url;

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