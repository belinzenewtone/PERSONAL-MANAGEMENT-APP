import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, CheckSquare, Calendar, Wallet, BarChart2, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export const FloatingTabBar = memo(({ state, descriptors, navigation }: BottomTabBarProps) => {
    const insets = useSafeAreaInsets();
    const bottomOffset = insets.bottom + 16;

    const icons: Record<string, any> = {
        'index': Home,
        'tasks': CheckSquare,
        'calendar': Calendar,
        'finance': Wallet,
        'insights': BarChart2,
        'profile': User,
    };

    const pillContent = (
        <View style={styles.pill}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                const isFocused = state.index === index;
                const Icon = icons[route.name] || Home;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={(options as any).tabBarTestID}
                        onPress={onPress}
                        style={[styles.tabButton, isFocused && styles.tabButtonActive]}
                    >
                        <Icon
                            size={20}
                            color={isFocused ? '#fff' : 'rgba(255,255,255,0.4)'}
                            strokeWidth={isFocused ? 2.5 : 2}
                        />
                        {isFocused && (
                            <Text style={styles.label} numberOfLines={1}>{label as string}</Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <View style={[styles.container, { bottom: bottomOffset }]} pointerEvents="box-none">
            {Platform.OS === 'ios' ? (
                <BlurView
                    intensity={65}
                    tint="dark"
                    style={styles.blurWrapper}
                >
                    {pillContent}
                </BlurView>
            ) : (
                <View style={[styles.blurWrapper, styles.androidGlass]}>
                    {pillContent}
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 14,
        right: 14,
        backgroundColor: 'transparent',
        alignItems: 'center',
        zIndex: 1000,
    },
    blurWrapper: {
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        width: '100%',
    },
    androidGlass: {
        backgroundColor: 'rgba(12, 12, 16, 0.92)',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        paddingVertical: 10,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: 8,
        borderRadius: 24,
        minWidth: 44,
        flexDirection: 'row',
    },
    tabButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: 12,
        gap: 6,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.1,
    },
});
