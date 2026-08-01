import { Platform } from 'react-native';

/** Android often reports insets.bottom === 0 with 3-button nav; keep a floor. */
const ANDROID_NAV_FLOOR = 72;

export function safeBottomPad(insetsBottom = 0, extra = 16) {
  const floor = Platform.OS === 'android' ? ANDROID_NAV_FLOOR : 0;
  return Math.max(Number(insetsBottom) || 0, floor) + extra;
}
