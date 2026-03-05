import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, TextInput, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { getTickets } from "../../services/tickets";
import { useAppStore } from "../../store/useAppStore";
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from "../../components/ui/GlassCard";
import type { Ticket } from "../../types/database";

const statusColors: Record<string, { pill: string; dot: string; text: string }> = {
    open: { pill: 'rgba(59,130,246,0.15)', dot: '#3b82f6', text: '#93c5fd' },
    'in-progress': { pill: 'rgba(245,158,11,0.15)', dot: '#f59e0b', text: '#fcd34d' },
    resolved: { pill: 'rgba(16,185,129,0.15)', dot: '#10b981', text: '#6ee7b7' },
    closed: { pill: 'rgba(100,116,139,0.15)', dot: '#64748b', text: '#94a3b8' },
};

function TicketCard({ ticket }: { ticket: Ticket }) {
    const c = statusColors[ticket.status] || statusColors.closed;
    return (
        <TouchableOpacity onPress={() => router.push(`/ticket/${ticket.id}`)} style={styles.cardWrapper}>
            <GlassCard style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.ticketNumber}>#{ticket.number}</Text>
                    <View style={[styles.statusPill, { backgroundColor: c.pill }]}>
                        <View style={[styles.statusDot, { backgroundColor: c.dot }]} />
                        <Text style={[styles.statusText, { color: c.text }]}>
                            {ticket.status.replace('-', ' ')}
                        </Text>
                    </View>
                </View>
                <Text style={styles.subject} numberOfLines={1}>{ticket.subject}</Text>
                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.metaLabel}>Category</Text>
                        <Text style={styles.metaValue}>{ticket.category.replace('-', ' ')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.metaLabel}>Date</Text>
                        <Text style={styles.metaValue}>{new Date(ticket.ticket_date).toLocaleDateString()}</Text>
                    </View>
                </View>
            </GlassCard>
        </TouchableOpacity>
    );
}

export default function PortalDashboard() {
    const { profile, ticketSearch, setTicketSearch } = useAppStore();

    const { data: tickets, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['portal-tickets', profile?.id],
        queryFn: () => getTickets({ created_by: profile?.id }),
        enabled: !!profile?.id,
    });

    const filtered = (tickets ?? []).filter(t =>
        ticketSearch === '' ||
        t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(ticketSearch.toLowerCase())
    );

    const firstName = profile?.name?.split(' ')[0] ?? 'there';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
                    <Text style={styles.subtitle}>Here are your recent tickets</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/report-issue')}
                    style={styles.fab}
                >
                    <Ionicons name="add" size={24} color="#10b981" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <GlassCard style={styles.searchCard}>
                <View style={styles.searchRow}>
                    <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.4)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search tickets…"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={ticketSearch}
                        onChangeText={setTicketSearch}
                        returnKeyType="search"
                    />
                    {ticketSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setTicketSearch('')}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>
            </GlassCard>

            {/* List */}
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="ticket-outline" size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyText}>
                        {ticketSearch ? 'No tickets match your search.' : "No tickets yet. Tap + to report an issue."}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TicketCard ticket={item} />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 110 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor="rgba(255,255,255,0.4)"
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'hsl(224, 71%, 4%)', paddingTop: 56, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    fab: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
    searchCard: { marginBottom: 16, paddingHorizontal: 14, paddingVertical: 10 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 2 },
    cardWrapper: { marginBottom: 12 },
    card: { padding: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    ticketNumber: { fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    subject: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 12 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
    metaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    metaValue: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: 'rgba(255,255,255,0.35)', marginTop: 12, textAlign: 'center', paddingHorizontal: 24 },
});
