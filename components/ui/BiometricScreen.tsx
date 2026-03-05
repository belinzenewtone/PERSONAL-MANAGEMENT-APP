import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    onSuccess: () => void;
    onFallback?: () => void;
}

export function BiometricScreen({ onSuccess, onFallback }: Props) {
    const [checking, setChecking] = useState(true);
    const [supported, setSupported] = useState(false);
    const [biometricType, setBiometricType] = useState<'fingerprint' | 'face' | 'none'>('none');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkSupport();
    }, []);

    const checkSupport = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

        const hasFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
        setBiometricType(hasFace ? 'face' : 'fingerprint');
        setSupported(compatible && enrolled);
        setChecking(false);

        if (compatible && enrolled) {
            authenticate();
        }
    };

    const authenticate = async () => {
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
                // Let them retry silently
            } else {
                setError('Authentication failed. Please try again.');
            }
        }
    };

    if (checking) {
        return (
            <View style={s.screen}>
                <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
            </View>
        );
    }

    const icon = biometricType === 'face' ? 'scan-outline' : 'finger-print-outline';

    return (
        <View style={s.screen}>
            <View style={s.card}>
                <View style={s.iconRing}>
                    <Ionicons name={icon as any} size={48} color="#a78bfa" />
                </View>
                <Text style={s.title}>Unlock App</Text>
                <Text style={s.subtitle}>
                    {supported
                        ? `Use ${biometricType === 'face' ? 'Face ID' : 'fingerprint'} to continue`
                        : 'Biometric unlock is not available on this device.'}
                </Text>

                {error && <Text style={s.error}>{error}</Text>}

                {supported && (
                    <TouchableOpacity style={s.btn} onPress={authenticate}>
                        <Ionicons name={icon as any} size={20} color="#4c1d95" />
                        <Text style={s.btnText}>
                            {biometricType === 'face' ? 'Use Face ID' : 'Use Fingerprint'}
                        </Text>
                    </TouchableOpacity>
                )}

                {onFallback && (
                    <TouchableOpacity style={s.fallbackBtn} onPress={onFallback}>
                        <Text style={s.fallbackText}>Skip biometric unlock</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'hsl(224,71%,4%)', alignItems: 'center', justifyContent: 'center', padding: 32 },
    card: { width: '100%', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    iconRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(167,139,250,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)' },
    title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    error: { color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 16 },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#a78bfa', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    btnText: { color: '#4c1d95', fontWeight: '700', fontSize: 15 },
    fallbackBtn: { marginTop: 16 },
    fallbackText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
});
