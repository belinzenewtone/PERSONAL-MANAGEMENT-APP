import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useAppStore } from "../../store/useAppStore";
import { signOut } from "../../services/auth";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function PortalSettings() {
    const { profile, setProfile } = useAppStore();

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                            setProfile(null);
                            router.replace('/(auth)');
                        } catch (error: any) {
                            Alert.alert('Logout Error', error.message);
                        }
                    }
                }
            ]
        );
    };

    return (
        <ScrollView className="flex-1 bg-background pt-12 px-5 pb-8">
            <Text className="text-2xl font-bold text-foreground mb-6">Settings</Text>

            <View className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-6 flex-row items-center">
                <View className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mr-4 border border-primary/30">
                    <Text className="text-primary font-bold text-2xl">
                        {profile?.name?.charAt(0) || '?'}
                    </Text>
                </View>
                <View className="flex-1">
                    <Text className="text-xl font-bold text-foreground">{profile?.name || 'User'}</Text>
                    <Text className="text-muted-foreground">{profile?.email}</Text>
                    <View className="mt-2 bg-secondary self-start px-2 py-1 rounded-md">
                        <Text className="text-secondary-foreground text-xs font-semibold">{profile?.role}</Text>
                    </View>
                </View>
            </View>

            <View className="mb-6">
                <Text className="text-muted-foreground font-semibold uppercase tracking-wider text-xs mb-2 ml-1">Account Options</Text>
                <View className="bg-card rounded-2xl border border-border overflow-hidden">
                    <TouchableOpacity className="flex-row items-center p-4 border-b border-border">
                        <Ionicons name="person-outline" size={20} color="hsl(210 40% 98%)" className="mr-3" />
                        <Text className="text-foreground font-medium flex-1 pl-3">Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color="hsl(215.4 16.3% 46.9%)" />
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center p-4">
                        <Ionicons name="notifications-outline" size={20} color="hsl(210 40% 98%)" className="mr-3" />
                        <Text className="text-foreground font-medium flex-1 pl-3">Notifications</Text>
                        <Ionicons name="chevron-forward" size={20} color="hsl(215.4 16.3% 46.9%)" />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="mb-6">
                <Text className="text-muted-foreground font-semibold uppercase tracking-wider text-xs mb-2 ml-1">App</Text>
                <View className="bg-card rounded-2xl border border-border overflow-hidden">
                    <View className="flex-row items-center p-4 border-b border-border">
                        <Ionicons name="information-circle-outline" size={20} color="hsl(210 40% 98%)" className="mr-3" />
                        <Text className="text-foreground font-medium flex-1 pl-3">Version</Text>
                        <Text className="text-muted-foreground">1.0.0</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex-row justify-center items-center mt-4"
            >
                <Ionicons name="log-out-outline" size={20} color="#ef4444" className="mr-2" />
                <Text className="text-destructive font-semibold pr-2">Log Out</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}
