import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { GlassCard } from '../../components/ui/GlassCard';
import { getTickets } from '../../services/tickets';
import { getTasks } from '../../services/tasks';
import { useAppStore } from '../../store/useAppStore';
import { Ionicons } from '@expo/vector-icons';

const statusColors: Record<string, { dot: string; text: string }> = {
    open: { dot: '#3b82f6', text: '#93c5fd' },
    'in-progress': { dot: '#f59e0b', text: '#fcd34d' },
    resolved: { dot: '#10b981', text: '#6ee7b7' },
    closed: { dot: '#64748b', text: '#94a3b8' },
};

export default function AdminDashboard() {
    const { profile } = useAppStore();

    const { data: tickets, isLoading: ticketsLoading } = useQuery({
        queryKey: ['admin-tickets-all'],
        queryFn: () => getTickets({}),
    });

    const { data: tasks, isLoading: tasksLoading } = useQuery({
        queryKey: ['admin-tasks'],
        queryFn: () => getTasks(),
    });

    const isLoading = ticketsLoading || tasksLoading;

    const openTickets = tickets?.filter(t => t.status === 'open').length ?? 0;
    const inProgress = tickets?.filter(t => t.status === 'in-progress').length ?? 0;
    const resolved = tickets?.filter(t => t.status === 'resolved').length ?? 0;
    const pendingTasks = tasks?.filter(t => !t.completed).length ?? 0;
    const recentTickets = (tickets ?? []).slice(0, 5);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = profile?.name?.split(' ')[0] ?? 'Admin';

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="rgba(255,255,255,0.5)" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Greeting */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
                    <Text style={styles.date}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
            </View>

            {/* Stat Cards Row */}
            <View style={styles.statsRow}>
                <StatCard label="Open" value={openTickets} color="#3b82f6" icon="alert-circle-outline" />
                <StatCard label="In Progress" value={inProgress} color="#f59e0b" icon="time-outline" />
                <StatCard label="Resolved" value={resolved} color="#10b981" icon="checkmark-circle-outline" />
            </View>

            {/* Tasks banner */}
            <TouchableOpacity onPress={() => router.push('/(admin)/tasks')}>
                <GlassCard style={styles.tasksBanner}>
                    <View style={styles.tasksBannerContent}>
                        <Ionicons name="checkmark-done-outline" size={22} color="#a78bfa" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.tasksBannerTitle}>Tasks</Text>
                            <Text style={styles.tasksBannerSub}>
                                {pendingTasks > 0 ? `${pendingTasks} pending task${pendingTasks > 1 ? 's' : ''}` : 'All tasks complete 🎉'}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                    </View>
                </GlassCard>
            </TouchableOpacity>

            {/* Recent Tickets */}
            <Text style={styles.sectionTitle}>Recent Tickets</Text>
            {recentTickets.length === 0 ? (
                <GlassCard style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No tickets yet.</Text>
                </GlassCard>
            ) : (
                recentTickets.map(ticket => {
                    const c = statusColors[ticket.status] || statusColors.closed;
                    return (
                        <TouchableOpacity
                            key={ticket.id}
                            onPress={() => router.push(`/ticket/${ticket.id}`)}
                            style={{ marginBottom: 10 }}
                        >
                            <GlassCard style={styles.ticketRow}>
                                <View style={styles.ticketRowInner}>
                                    <View style={[styles.dot, { backgroundColor: c.dot }]} />
                                    <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                                    <Text style={[styles.ticketStatus, { color: c.text }]}>
                                        {ticket.status.replace('-', ' ')}
                                    </Text>
                                </View>
                            </GlassCard>
                        </TouchableOpacity>
                    );
                })
            )}

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
                <ActionBtn icon="add-circle-outline" label="New Ticket" color="#3b82f6" onPress={() => router.push('/report-issue')} />
                <ActionBtn icon="list-outline" label="All Tickets" color="#f59e0b" onPress={() => router.push('/(admin)/tickets')} />
                <ActionBtn icon="checkmark-outline" label="Tasks" color="#a78bfa" onPress={() => router.push('/(admin)/tasks')} />
            </View>
        </ScrollView>
    );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: any }) {
    return (
        <GlassCard style={styles.statCard}>
            <Ionicons name={icon} size={20} color={color} />
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </GlassCard>
    );
}

function ActionBtn({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
            <GlassCard style={styles.actionBtn}>
                <Ionicons name={icon} size={24} color={color} />
                <Text style={styles.actionLabel}>{label}</Text>
            </GlassCard>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'hsl(224, 71%, 4%)' },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'hsl(224, 71%, 4%)' },
    content: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 120 },
    header: { marginBottom: 24 },
    greeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
    date: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 3 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, gap: 4 },
    statValue: { fontSize: 22, fontWeight: '800' },
    statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 },
    tasksBanner: { marginBottom: 20, padding: 14 },
    tasksBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tasksBannerTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
    tasksBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    ticketRow: { padding: 14 },
    ticketRowInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    ticketSubject: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
    ticketStatus: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
    emptyCard: { padding: 20, alignItems: 'center' },
    emptyText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
    actionsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { alignItems: 'center', paddingVertical: 16, gap: 6 },
    actionLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5 },
});
