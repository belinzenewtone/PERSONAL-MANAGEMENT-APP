import {
    View, Text, FlatList, ActivityIndicator, RefreshControl,
    TouchableOpacity, TextInput, StyleSheet
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { getTickets } from "../../services/tickets";
import { useAppStore } from "../../store/useAppStore";
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from "../../components/ui/GlassCard";
import type { Ticket } from "../../types/database";

const statusColors: Record<string, { dot: string; text: string; pill: string }> = {
    open: { dot: '#3b82f6', text: '#93c5fd', pill: 'rgba(59,130,246,0.15)' },
    'in-progress': { dot: '#f59e0b', text: '#fcd34d', pill: 'rgba(245,158,11,0.15)' },
    resolved: { dot: '#10b981', text: '#6ee7b7', pill: 'rgba(16,185,129,0.15)' },
    closed: { dot: '#64748b', text: '#94a3b8', pill: 'rgba(100,116,139,0.15)' },
};

function TicketListItem({ ticket }: { ticket: Ticket }) {
    const c = statusColors[ticket.status] || statusColors.closed;
    return (
        <TouchableOpacity onPress={() => router.push(`/ticket/${ticket.id}`)} style={{ marginBottom: 10 }}>
            <GlassCard style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.ticketNumber}>#{ticket.number}</Text>
                    <View style={[styles.statusPill, { backgroundColor: c.pill }]}>
                        <View style={[styles.dot, { backgroundColor: c.dot }]} />
                        <Text style={[styles.statusText, { color: c.text }]}>
                            {ticket.status.replace('-', ' ')}
                        </Text>
                    </View>
                </View>
                <Text style={styles.subject} numberOfLines={2}>{ticket.subject}</Text>
                <View style={styles.cardFooter}>
                    <Text style={styles.meta}>{ticket.category.replace('-', ' ')}</Text>
                    <Text style={styles.meta}>{new Date(ticket.ticket_date).toLocaleDateString()}</Text>
                </View>
                {ticket.resolution_notes ? (
                    <View style={styles.resolutionBox}>
                        <Text style={styles.resolutionLabel}>Resolution</Text>
                        <Text style={styles.resolutionText} numberOfLines={2}>{ticket.resolution_notes}</Text>
                    </View>
                ) : null}
            </GlassCard>
        </TouchableOpacity>
    );
}

export default function AdminTickets() {
    const { ticketSearch, setTicketSearch } = useAppStore();

    const { data: tickets, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['admin-tickets-all'],
        queryFn: () => getTickets({}),
    });

    const filtered = (tickets ?? []).filter(t =>
        ticketSearch === '' ||
        t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(ticketSearch.toLowerCase())
    );

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>All Tickets</Text>
                <Text style={styles.count}>{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</Text>
            </View>

            {/* Search */}
            <GlassCard style={styles.searchCard}>
                <View style={styles.searchRow}>
                    <Ionicons name="search-outline" size={17} color="rgba(255,255,255,0.35)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search tickets…"
                        placeholderTextColor="rgba(255,255,255,0.25)"
                        value={ticketSearch}
                        onChangeText={setTicketSearch}
                    />
                    {ticketSearch.length > 0 && (
                        <TouchableOpacity onPress={() => setTicketSearch('')}>
                            <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.35)" />
                        </TouchableOpacity>
                    )}
                </View>
            </GlassCard>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="rgba(255,255,255,0.4)" />
                </View>
            ) : filtered.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="ticket-outline" size={48} color="rgba(255,255,255,0.15)" />
                    <Text style={styles.emptyText}>
                        {ticketSearch ? 'No tickets match your search.' : 'No tickets.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TicketListItem ticket={item} />}
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '700', color: '#fff' },
    count: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
    searchCard: { marginBottom: 16, paddingHorizontal: 14, paddingVertical: 10 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchInput: { flex: 1, color: '#fff', fontSize: 14 },
    card: { padding: 14 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    ticketNumber: { fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)' },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    subject: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 10 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
    meta: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' },
    resolutionBox: { marginTop: 10, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
    resolutionLabel: { fontSize: 10, color: '#6ee7b7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
    resolutionText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: 'rgba(255,255,255,0.3)', marginTop: 12 },
});
