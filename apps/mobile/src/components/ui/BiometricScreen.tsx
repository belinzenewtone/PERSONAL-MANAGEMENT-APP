import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { spacing, radius, fontSize, fontWeight, useAppTheme } from '../../lib/theme';

interface Props {
    onSuccess: () => void;
    onFallback?: () => void;
}

export function BiometricScreen({ onSuccess, onFallback }: Props) {
    const { colors } = useAppTheme();
    const s = useMemo(() => createStyles(colors), [colors]);
    const [checking, setChecking] = useState(true);
    const [supported, setSupported] = useState(false);
    const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkSupport();
    }, []);

    const checkSupport = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        setBiometricType(types);
        setSupported(compatible && enrolled);
        setChecking(false);

        if (compatible && enrolled) {
            authenticate(types);
            return;
        }

        (onFallback ?? onSuccess)();
    };

    const authenticate = async (types: LocalAuthentication.AuthenticationType[] = biometricType) => {
        setError(null);
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verify your identity',
            fallbackLabel: 'Use PIN',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
        });

        if (result.success) {
            onSuccess();
        } else {
            const errCode = (result as { success: false; error: string; warning?: string }).error;
            if (errCode === 'user_cancel' || errCode === 'system_cancel') {
                // Let them retry silently via the button
            } else {
                setError('Authentication failed. Please try again.');
            }
        }
    };

    if (checking) {
        return (
            <View style={s.screen}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    const hasFace = biometricType.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    const icon = hasFace ? 'scan-outline' : 'finger-print-outline';

    return (
        <View style={s.screen}>
            <View style={s.card}>
                <View style={s.iconRing}>
                    <Ionicons name={icon as any} size={48} color={colors.accentLight} />
                </View>
                <Text style={s.title}>Unlock App</Text>
                <Text style={s.subtitle}>
                    {supported
                        ? `Use ${hasFace ? 'Face ID' : 'fingerprint'} to continue`
                        : 'Biometric unlock is not available on this device.'}
                </Text>

                {error && <Text style={s.error}>{error}</Text>}

                {supported && (
                    <TouchableOpacity style={s.btn} onPress={() => authenticate()}>
                        <Ionicons name={icon as any} size={20} color={colors.textPrimary} />
                        <Text style={s.btnText}>
                            {hasFace ? 'Use Face ID' : 'Use Fingerprint'}
                        </Text>
                    </TouchableOpacity>
                )}

                {onFallback && !supported && (
                    <TouchableOpacity style={s.fallbackBtn} onPress={onFallback}>
                        <Text style={s.fallbackText}>Skip biometric unlock</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    card: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.xxl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.borderStrong,
    },
    iconRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: `${colors.accent}22`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: `${colors.accent}44`,
    },
    title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.xs },
    subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
    error: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center', marginBottom: spacing.md },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: `${colors.accentLight}55`,
    },
    btnText: { color: colors.textPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.md },
    fallbackBtn: { marginTop: spacing.md },
    fallbackText: { color: colors.textMuted, fontSize: fontSize.sm },
});
