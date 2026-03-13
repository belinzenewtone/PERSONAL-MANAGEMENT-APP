/**
 * feedback.ts — Haptic / vibration feedback helpers.
 *
 * On iOS, Vibration.vibrate does nothing meaningful (iOS ignores durations).
 * On Android it uses the vibrator motor — keep durations very short to avoid
 * feeling heavy on low-end devices.
 *
 * When expo-haptics is available it should be preferred; for now we fall back
 * to the RN Vibration API which is always available.
 */
import { Platform, Vibration } from 'react-native';

/** Fires only on Android — iOS vibration is not user-controllable via RN */
function vibe(ms: number) {
  if (Platform.OS === 'android') {
    Vibration.vibrate(ms);
  }
}

/** Light tap — navigation, selection changes */
export function selectionTap() {
  vibe(6);
}

/** Medium confirmation — task done, save succeeded */
export function successTap() {
  vibe(10);
}

/** Stronger impact — destructive actions, errors */
export function impactTap() {
  vibe(14);
}

/** Double-pulse — warning / are-you-sure moments */
export function warningTap() {
  if (Platform.OS === 'android') {
    Vibration.vibrate([0, 10, 60, 10]);
  }
}
