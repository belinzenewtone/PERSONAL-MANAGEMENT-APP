import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function LoginScreen() {
    return (
        <View className="flex-1 items-center justify-center p-6 bg-background">
            <View className="w-full max-w-sm space-y-6">
                <View className="items-center">
                    <Text className="text-3xl font-bold tracking-tight text-foreground">Welcome back</Text>
                    <Text className="text-muted-foreground text-sm mt-2">Sign in to your account</Text>
                </View>

                <View className="space-y-4 pt-10">
                    <View className="space-y-2">
                        <Text className="text-sm font-medium text-foreground">Email</Text>
                        <TextInput
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
                            placeholder="m@example.com"
                            placeholderTextColor="hsl(215.4 16.3% 56.9%)"
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View className="space-y-2">
                        <Text className="text-sm font-medium text-foreground">Password</Text>
                        <TextInput
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
                            placeholder="••••••••"
                            placeholderTextColor="hsl(215.4 16.3% 56.9%)"
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity className="w-full bg-primary rounded-md py-3 items-center justify-center mt-6">
                        <Text className="text-primary-foreground font-medium">Sign in</Text>
                    </TouchableOpacity>

                    <View className="flex-row justify-center pt-2">
                        <Text className="text-muted-foreground text-sm">Don't have an account? </Text>
                        <Text className="text-primary text-sm font-medium">Register here</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
