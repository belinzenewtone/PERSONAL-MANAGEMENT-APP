import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp, Platform } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '../../lib/theme';

interface CapsuleProps {
    label: string;
    color?: string;
    variant?: 'solid' | 'subtle' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

/**
 * Capsule — A uniform enclosure for badges, tags, and chips.
 * Ensures consistent height, centering, and padding across the app.
 */
export function Capsule({
    label,
    color = colors.accent,
    variant = 'subtle',
    size = 'sm',
    icon,
    style,
    textStyle,
}: CapsuleProps) {
    const isSolid = variant === 'solid';
    const isOutline = variant === 'outline';

    const containerStyle: ViewStyle = {
        backgroundColor: isSolid ? color : isOutline ? 'transparent' : `${color}22`,
        borderColor: isOutline ? color : 'transparent',
        borderWidth: isOutline ? 1 : 0,
    };

    const finalTextStyle: TextStyle = {
        color: isSolid ? '#fff' : color,
    };

    return (
        <View style={[styles.base, styles[size], containerStyle, style]}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
                style={[styles.text, styles[`text_${size}`], finalTextStyle, textStyle]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.full,
        alignSelf: 'flex-start',
    },
    sm: {
        height: 28, // Increased from 24
        paddingHorizontal: spacing.sm + 2,
    },
    md: {
        height: 36, // Increased from 32
        paddingHorizontal: spacing.md,
    },
    lg: {
        height: 44, // Increased from 40
        paddingHorizontal: spacing.lg,
    },
    iconContainer: {
        marginRight: 6,
    },
    text: {
        fontWeight: fontWeight.semibold, // Switched to semibold for better clarity
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
        lineHeight: Platform.OS === 'ios' ? 0 : undefined, // Fix centering on iOS if needed
    },
    text_sm: {
        fontSize: 11, // Slightly larger
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    text_md: {
        fontSize: fontSize.sm, // Slightly larger
    },
    text_lg: {
        fontSize: fontSize.md,
    },
});
