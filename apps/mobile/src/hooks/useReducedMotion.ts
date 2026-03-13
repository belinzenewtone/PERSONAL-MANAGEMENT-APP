import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Returns true if the user has enabled "Reduce Motion" in system accessibility
 * settings. When true, all animations should either be skipped or replaced with
 * simple opacity crossfades at ~0ms duration.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => sub.remove();
  }, []);

  return reduced;
}
