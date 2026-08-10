import { Alert, Platform } from 'react-native';

/**
 * Confirm dialog that works on web (RN Alert often fails in Chrome).
 */
export function confirmAction({ title, message, confirmText, cancelText }) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const ok = window.confirm([title, message].filter(Boolean).join('\n\n'));
    return Promise.resolve(ok);
  }

  return new Promise((resolve) => {
    Alert.alert(String(title || ''), String(message || ''), [
      {
        text: cancelText || 'Cancel',
        style: 'cancel',
        onPress: () => resolve(false),
      },
      {
        text: confirmText || 'OK',
        style: 'destructive',
        onPress: () => resolve(true),
      },
    ]);
  });
}
