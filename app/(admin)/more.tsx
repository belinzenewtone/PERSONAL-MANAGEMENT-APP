import { View, Text } from 'react-native';

export default function MoreScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-xl font-bold text-foreground">More Settings</Text>
            <Text className="text-muted-foreground mt-2">Machines and Reports</Text>
        </View>
    );
}
