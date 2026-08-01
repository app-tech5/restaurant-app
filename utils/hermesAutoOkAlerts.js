import { Alert } from 'react-native';

let patched = false;

function pickOkButton(buttons) {
  const list = Array.isArray(buttons) && buttons.length
    ? buttons
    : [{ text: 'OK' }];

  const isOkLabel = (btn) => {
    if (!btn) return false;
    const t = String(btn.text || '').trim().toLowerCase();
    return t === 'ok' || t === 'oui' || t === 'yes' || t === "d'accord" || t === 'continuer';
  };

  return (
    list.find(isOkLabel)
    || list.find((b) => b.style !== 'cancel')
    || list[list.length - 1]
  );
}

export function installHermesAutoOkAlerts() {
  if (patched || globalThis.__HERMES_AUTO_OK_ALERTS__) {
    return { patched: true, already: true };
  }

  Alert.alert = (title, message, buttons, options) => {
    globalThis.__HERMES_LAST_ALERT__ = {
      title: String(title || ''),
      message: String(message || ''),
      at: Date.now(),
    };
    const btn = pickOkButton(buttons);
    if (btn && typeof btn.onPress === 'function') {
      try {
        btn.onPress();
      } catch (e) {
        // ignore callback errors in test mode
      }
    }
  };

  patched = true;
  globalThis.__HERMES_AUTO_OK_ALERTS__ = true;
  return { patched: true };
}

if (__DEV__) {
  globalThis.__installHermesAutoOkAlerts = installHermesAutoOkAlerts;
}
