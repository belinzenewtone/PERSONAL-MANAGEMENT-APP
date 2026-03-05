import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, CheckSquare, Calendar, Wallet, BarChart2, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    // insets.bottom gives the height of the home indicator (iOS) or on-screen navigation buttons (Android).
    // By adding 16 to it, we ensure the bar always floats 16px ABOVE the system navigation area,
    // making it perfectly suitable for both gestures and button-based navigation.
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
                            size={22}
                            color={isFocused ? '#fff' : 'rgba(255,255,255,0.45)'}
                            strokeWidth={isFocused ? 2.5 : 2}
                        />
                        {isFocused && (
                            <Text style={styles.label}>{label as string}</Text>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <View style={[styles.container, { bottom: bottomOffset }]}>
            {Platform.OS === 'ios' ? (
                <BlurView
                    intensity={60}
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
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 10,
        right: 10,
        backgroundColor: 'transparent',
        alignItems: 'center',
    },
    blurWrapper: {
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.10)',
        width: '100%',
    },
    androidGlass: {
        backgroundColor: 'rgba(16, 24, 48, 0.88)',
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 4,
        paddingVertical: 8,
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 30,
        minWidth: 44,
    },
    tabButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        flexDirection: 'row',
        gap: 4,
    },
    label: {
        fontSize: 10,
        fontWeight: '600',
        color: '#fff',
        letterSpacing: 0.2,
    },
});
