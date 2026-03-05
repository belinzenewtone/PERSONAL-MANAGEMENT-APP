import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    className?: string;
}

/**
 * GlassCard — frosted-glass card inspired by the ChatGPT dark-glass aesthetic.
 * Uses BlurView on iOS and a semi-transparent fallback on Android.
 */
export function GlassCard({ children, style, intensity = 25, className }: GlassCardProps) {
    if (Platform.OS === 'ios') {
        return (
            <BlurView
                intensity={intensity}
                tint="dark"
                style={[styles.base, style]}
            >
                {children}
            </BlurView>
        );
    }

    // Android fallback — no real blur but matches the colour depth
    return (
        <View style={[styles.base, styles.androidFallback, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    androidFallback: {
        backgroundColor: 'rgba(24, 33, 60, 0.85)',
    },
});
