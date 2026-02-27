import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { getTickets } from "../../services/tickets";
import { useAppStore } from "../../store/useAppStore";
import { Ionicons } from '@expo/vector-icons';
import type { Ticket } from "../../types/database";

const statusColors: Record<string, string> = {
    open: 'bg-blue-500/20 text-blue-500',
    'in-progress': 'bg-amber-500/20 text-amber-500',
    resolved: 'bg-emerald-500/20 text-emerald-500',
    closed: 'bg-slate-500/20 text-slate-400',
};

function TicketListItem({ ticket }: { ticket: Ticket }) {
    const statusColor = statusColors[ticket.status] || 'bg-slate-500/20 text-slate-400';
    const statusBg = statusColor.split(' ')[0];
    const statusText = statusColor.split(' ')[1];

    return (
        <TouchableOpacity
            className="bg-card border border-border p-4 rounded-2xl mb-3 shadow-sm mx-5"
            onPress={() => router.push(`/ticket/${ticket.id}`)}
        >
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-muted-foreground font-mono text-xs">#{ticket.number}</Text>
                <View className={`${statusBg} px-2 py-1 rounded-full`}>
                    <Text className={`${statusText} text-[10px] font-bold uppercase`}>{ticket.status.replace('-', ' ')}</Text>
                </View>
            </View>
            <Text className="text-foreground font-semibold text-base mb-1">{ticket.subject}</Text>
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
                <Text className="text-sm font-medium text-foreground capitalize">{ticket.category.replace('-', ' ')}</Text>
                <Text className="text-sm font-medium text-foreground">{new Date(ticket.ticket_date).toLocaleDateString()}</Text>
            </View>
            {ticket.resolution_notes && (
                <View className="mt-3 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <Text className="text-xs text-emerald-500 font-semibold mb-1">Resolution Summary</Text>
                    <Text className="text-sm text-foreground" numberOfLines={2}>{ticket.resolution_notes}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

export default function PortalTickets() {
    const { profile } = useAppStore();

    const { data: tickets, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['portal-tickets-all', profile?.id],
        queryFn: () => getTickets({ created_by: profile?.id }),
        enabled: !!profile?.id,
    });

    return (
        <View className="flex-1 bg-background pt-12">
            <View className="px-5 mb-4">
                <Text className="text-2xl font-bold text-foreground">All Tickets</Text>
                <Text className="text-muted-foreground mt-1">History of your reported issues</Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="hsl(210 40% 98%)" />
                </View>
            ) : tickets?.length === 0 ? (
                <View className="flex-1 items-center justify-center mt-10">
                    <Ionicons name="ticket-outline" size={48} color="hsl(215.4 16.3% 46.9%)" />
                    <Text className="text-muted-foreground mt-4 text-center px-6">
                        No tickets found.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={tickets}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TicketListItem ticket={item} />}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor="hsl(210 40% 98%)"
                        />
                    }
                />
            )}
        </View>
    );
}
