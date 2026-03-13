/**
 * animation.ts — Central animation configuration for the app.
 *
 * Philosophy:
 * - ALL layout changes (width, height) use timing + Easing.out — springs on
 *   JS-thread layout props are heavy and can drop frames on low-end devices.
 * - Transform/opacity always use useNativeDriver: true — runs on UI thread,
 *   never blocks JS, works perfectly on every device tier.
 * - Durations are short — 160ms feels instant, 220ms feels smooth.
 *   Anything above 300ms feels sluggish on a mid-tier device.
 * - Springs are only used for bounce-feedback (tab bar press, swipe snap) —
 *   never for layout-driving animations.
 *
 * Reduce-motion support: callers should check `prefersReducedMotion` from
 * useReducedMotion() and pass duration: 0 or toValue directly for users
 * who have accessibility > reduce motion enabled.
 */

import { Easing } from 'react-native';

// ─── Easing curves ────────────────────────────────────────────────────────────

/** Standard ease-out — good for things entering the screen */
export const easeOut = Easing.out(Easing.cubic);

/** Ease-in — good for things leaving */
export const easeIn = Easing.in(Easing.cubic);

/** Ease-in-out — good for expand/collapse */
export const easeInOut = Easing.inOut(Easing.quad);

// ─── Duration presets ─────────────────────────────────────────────────────────

export const durations = {
  /** Near-instant: press feedback, micro-interactions */
  micro: 80,
  /** Fast: expand/collapse, filter toggles */
  fast: 150,
  /** Standard: screen fade-in, modal entrance */
  standard: 200,
  /** Comfortable: large layout changes */
  comfortable: 260,
} as const;

// ─── Native-driver configs (transform + opacity only) ─────────────────────────

/** Tab press bounce — native thread, spring */
export const tabPressSpring = {
  useNativeDriver: true,
  tension: 260,
  friction: 8,
} as const;

/** Fade in from slightly below — page entrance */
export const pageEntrance = {
  opacity: { duration: durations.standard, easing: easeOut, useNativeDriver: true },
  translateY: { duration: durations.standard, easing: easeOut, useNativeDriver: true },
} as const;

/** Quick scale punch for confirmations */
export const scalePunch = {
  down: { toValue: 0.88, duration: durations.micro, useNativeDriver: true, easing: easeIn },
  up:   { toValue: 1.0,  useNativeDriver: true, tension: 300, friction: 10 },
} as const;

/** Overlay/modal fade */
export const overlayFade = {
  in:  { duration: durations.fast, easing: easeOut, useNativeDriver: true },
  out: { duration: durations.fast, easing: easeIn,  useNativeDriver: true },
} as const;

/** Toast slide — native thread */
export const toastSlide = {
  in:  { duration: durations.fast, easing: easeOut, useNativeDriver: true },
  out: { duration: durations.fast, easing: easeIn,  useNativeDriver: true },
} as const;

/** Swipe action icon — native thread */
export const swipeIcon = {
  scale: { inputRange: [0, 30, 80], outputRange: [0.6, 0.85, 1] as number[] },
  opacity: { inputRange: [0, 20, 80], outputRange: [0, 0.7, 1] as number[] },
} as const;

// ─── JS-thread configs (layout: width, height, maxHeight) ────────────────────
// These CANNOT use useNativeDriver. Keep durations short to minimise JS-thread
// blocking. Use timing + easeInOut instead of springs.

/** Expand/collapse for FilterToggle panel height */
export const expandCollapse = {
  duration: durations.fast,
  easing: easeInOut,
  useNativeDriver: false,
} as const;

/** SearchBar width expansion */
export const searchExpand = {
  duration: durations.fast,
  easing: easeOut,
  useNativeDriver: false,
} as const;
