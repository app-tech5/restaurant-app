import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import apiClient from '../api';

const MAX_UPLOAD_WIDTH = 1200;
const UPLOAD_JPEG_QUALITY = 0.8;

export const PICK_FROM_GALLERY_REASON = {
  PERMISSION_DENIED: 'permission_denied',
  CANCELLED: 'cancelled',
  NO_ASSET: 'no_asset',
};

const pickerDefaults = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: UPLOAD_JPEG_QUALITY,
};

async function prepareImageForUpload(uri) {
  const { uri: preparedUri } = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_UPLOAD_WIDTH } }],
    { compress: UPLOAD_JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
  );
  return preparedUri;
}

async function uploadPreparedImage(uri) {
  const preparedUri = await prepareImageForUpload(uri);
  const data = await apiClient.uploadImageToCloudinary(preparedUri);
  const link = data?.url;
  if (!link || typeof link !== 'string') {
    return { ok: false, reason: PICK_FROM_GALLERY_REASON.NO_ASSET };
  }
  return { ok: true, link };
}

export async function pickImageUriFromGallery(launchOptions = {}) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    return {
      ok: false,
      reason: PICK_FROM_GALLERY_REASON.PERMISSION_DENIED,
    };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    ...pickerDefaults,
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

  return uploadPreparedImage(uri);
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
    ...pickerDefaults,
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

  return uploadPreparedImage(uri);
}
