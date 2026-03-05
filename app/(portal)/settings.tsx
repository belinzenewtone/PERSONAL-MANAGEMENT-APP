import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from "react-native";
import { useAppStore } from "../../store/useAppStore";
import { signOut } from "../../services/auth";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from "../../components/ui/GlassCard";

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
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.pageTitle}>Settings</Text>

            {/* Profile card */}
            <GlassCard style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{profile?.name?.charAt(0) || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{profile?.name || 'User'}</Text>
                    <Text style={styles.profileEmail}>{profile?.email}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{profile?.role}</Text>
                    </View>
                </View>
            </GlassCard>

            {/* Account options */}
            <Text style={styles.sectionLabel}>Account</Text>
            <GlassCard style={styles.optionGroup}>
                <SettingRow icon="person-outline" label="Edit Profile" onPress={() => { }} />
                <View style={styles.divider} />
                <SettingRow icon="notifications-outline" label="Notifications" onPress={() => { }} />
                <View style={styles.divider} />
                <SettingRow icon="finger-print-outline" label="Biometric Unlock" onPress={() => { }} />
            </GlassCard>

            {/* App info */}
            <Text style={styles.sectionLabel}>App</Text>
            <GlassCard style={styles.optionGroup}>
                <View style={styles.row}>
                    <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.55)" />
                    <Text style={styles.rowLabel}>Version</Text>
                    <Text style={styles.rowValue}>1.0.0</Text>
                </View>
            </GlassCard>

            {/* Logout */}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

function SettingRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.row} onPress={onPress}>
            <Ionicons name={icon} size={20} color="rgba(255,255,255,0.55)" />
            <Text style={styles.rowLabel}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'hsl(224, 71%, 4%)' },
    content: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 120 },
    pageTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 20 },
    profileCard: { flexDirection: 'row', alignItems: 'center', padding: 18, marginBottom: 24, gap: 16 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
    profileName: { fontSize: 18, fontWeight: '700', color: '#fff' },
    profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    roleBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    roleText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5 },
    sectionLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
    optionGroup: { marginBottom: 20 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#fff' },
    rowValue: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 16 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', paddingVertical: 14, borderRadius: 16, marginTop: 8 },
    logoutText: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});
