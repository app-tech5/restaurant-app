import { Alert, Platform } from 'react-native';

/**
 * RN-web Alert.alert is often a no-op in mobile Chrome.
 * Polyfill with window.alert / window.confirm so Logout and other dialogs work.
 */
export function installWebAlertPolyfill() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (window.__GF_WEB_ALERT_POLYFILL__) return;
  window.__GF_WEB_ALERT_POLYFILL__ = true;

  Alert.alert = (title, message, buttons) => {
    const list =
      Array.isArray(buttons) && buttons.length > 0
        ? buttons
        : [{ text: 'OK' }];

    const text = [title, message].filter(Boolean).join('\n\n');

    if (list.length === 1) {
      window.alert(text);
      try {
        list[0]?.onPress?.();
      } catch (_) {
        /* ignore */
      }
      return;
    }

    const cancelBtn = list.find((b) => b?.style === 'cancel');
    const actionBtn =
      list.find((b) => b?.style === 'destructive') ||
      list.find((b) => b !== cancelBtn) ||
      list[list.length - 1];

    const ok = window.confirm(text);
    try {
      if (ok) actionBtn?.onPress?.();
      else cancelBtn?.onPress?.();
    } catch (_) {
      /* ignore */
    }
  };
}
