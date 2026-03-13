import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { controlHeights, radius, spacing, fontSize, fontWeight, useAppTheme } from '../../lib/theme';

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
    color,
    variant = 'subtle',
    size = 'sm',
    icon,
    style,
    textStyle,
}: CapsuleProps) {
    const { colors } = useAppTheme();
    const styles = staticStyles;
    const resolvedColor = color ?? colors.accent;
    const isSolid = variant === 'solid';
    const isOutline = variant === 'outline';

    const containerStyle: ViewStyle = {
        backgroundColor: isSolid ? resolvedColor : isOutline ? colors.surfaceSoft : `${resolvedColor}18`,
        borderColor: isOutline ? `${resolvedColor}aa` : isSolid ? 'transparent' : `${resolvedColor}26`,
        borderWidth: 1,
    };

    const finalTextStyle: TextStyle = {
        color: isSolid ? colors.textPrimary : resolvedColor,
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

const staticStyles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.full,
        alignSelf: 'flex-start',
        minWidth: 56,
    },
    sm: {
        height: controlHeights.chipSm,
        paddingHorizontal: spacing.md,
        paddingVertical: 0,     // height is fixed, no vertical padding needed
    },
    md: {
        height: controlHeights.chipMd,
        paddingHorizontal: spacing.md,
        paddingVertical: 0,
    },
    lg: {
        height: controlHeights.chipLg,
        paddingHorizontal: spacing.lg,
        paddingVertical: 0,
    },
    iconContainer: {
        marginRight: 6,
    },
    text: {
        fontWeight: fontWeight.semibold,
        textAlign: 'center',
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    text_sm: {
        fontSize: fontSize.xs,
        letterSpacing: 0.2,
    },
    text_md: {
        fontSize: fontSize.sm,
    },
    text_lg: {
        fontSize: fontSize.md,
    },
});
