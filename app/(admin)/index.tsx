import { View, Text } from 'react-native';

export default function AdminDashboard() {
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-xl font-bold text-foreground">Admin Dashboard</Text>
            <Text className="text-muted-foreground mt-2">Home screen for Admins</Text>
        </View>
    );
}
