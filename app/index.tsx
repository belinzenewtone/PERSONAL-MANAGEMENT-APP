import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function Index() {
    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Text className="text-3xl font-bold text-foreground mb-4">
                Ticketing System App
            </Text>
            <Link href="/(portal)" asChild>
                <TouchableOpacity className="bg-primary px-6 py-3 rounded-md">
                    <Text className="text-primary-foreground font-medium">Go to Portal</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}
