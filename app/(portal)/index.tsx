import { View, Text } from "react-native";

export default function PortalDashboard() {
    return (
        <View className="flex-1 items-center justify-center">
            <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
            <Text className="text-muted-foreground mt-2">Welcome to the AI Ticketing System</Text>
        </View>
    );
}
