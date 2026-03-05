import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
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
        paddingHorizontal: spacing.sm + 2,
        alignSelf: 'flex-start',
    },
    sm: {
        height: 24,
        minWidth: 50,
    },
    md: {
        height: 32,
        minWidth: 70,
        paddingHorizontal: spacing.md,
    },
    lg: {
        height: 40,
        minWidth: 90,
        paddingHorizontal: spacing.lg,
    },
    iconContainer: {
        marginRight: 4,
    },
    text: {
        fontWeight: fontWeight.bold,
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    text_sm: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    text_md: {
        fontSize: fontSize.xs,
    },
    text_lg: {
        fontSize: fontSize.sm,
    },
});
