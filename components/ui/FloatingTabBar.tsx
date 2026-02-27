import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Ticket, Settings, Mail, CheckSquare, MoreHorizontal } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();

    const icons: Record<string, any> = {
        'index': Home,
        'tickets': Ticket,
        'email': Mail,
        'settings': Settings,
        'tasks': CheckSquare,
        'more': MoreHorizontal,
    };

    return (
        <View style={[styles.container, { bottom: insets.bottom + 16 }]}>
            <View className="flex-row items-center justify-between bg-card/90 border border-border/50 backdrop-blur-md rounded-full px-4 py-2 mx-6 shadow-xl shadow-black/20">
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
                            className={`items-center justify-center p-2 rounded-full min-w-[60px] ${isFocused ? 'bg-primary/20' : ''}`}
                        >
                            <Icon size={24} className={isFocused ? 'text-primary' : 'text-muted-foreground'} strokeWidth={isFocused ? 2.5 : 2} />
                            {isFocused && (
                                <Text className="text-[10px] font-medium text-primary mt-1">
                                    {label as string}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
});
