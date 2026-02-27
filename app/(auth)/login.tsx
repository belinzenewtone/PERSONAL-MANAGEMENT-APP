import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { signIn } from "../../services/auth";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please enter your email and password.");
            return;
        }

        setIsLoading(true);
        try {
            await signIn(email, password);
            // Our AuthProvider in _layout will catch the session change and redirect
        } catch (error: any) {
            Alert.alert("Login Failed", error.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

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
                            value={email}
                            onChangeText={setEmail}
                            editable={!isLoading}
                        />
                    </View>

                    <View className="space-y-2">
                        <Text className="text-sm font-medium text-foreground">Password</Text>
                        <TextInput
                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-foreground"
                            placeholder="••••••••"
                            placeholderTextColor="hsl(215.4 16.3% 56.9%)"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!isLoading}
                        />
                    </View>

                    <TouchableOpacity
                        className={`w-full bg-primary rounded-md py-3 items-center justify-center mt-6 ${isLoading ? 'opacity-70' : ''}`}
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="hsl(210 40% 98%)" />
                        ) : (
                            <Text className="text-primary-foreground font-medium">Sign in</Text>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center pt-2">
                        <Text className="text-muted-foreground text-sm">Don't have an account? </Text>
                        <Text className="text-primary text-sm font-medium">Contact IT</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
