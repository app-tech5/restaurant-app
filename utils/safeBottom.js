import { Platform } from 'react-native';

const ANDROID_NAV_FLOOR = 72;

export function safeBottomPad(insetsBottom = 0, extra = 16) {
  const floor = Platform.OS === 'android' ? ANDROID_NAV_FLOOR : 0;
  return Math.max(Number(insetsBottom) || 0, floor) + extra;
}
