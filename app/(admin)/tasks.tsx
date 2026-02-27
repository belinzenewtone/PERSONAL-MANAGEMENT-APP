import { View, Text } from 'react-native';

export default function TasksScreen() {
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-xl font-bold text-foreground">Tasks Module</Text>
            <Text className="text-muted-foreground mt-2">Manage tasks here</Text>
        </View>
    );
}
