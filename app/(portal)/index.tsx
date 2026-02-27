import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { getTickets } from "../../services/tickets";
import { useAppStore } from "../../store/useAppStore";
import { Ionicons } from '@expo/vector-icons';
import type { Ticket } from "../../types/database";

// Basic Status config for colors
const statusColors: Record<string, string> = {
    open: 'bg-blue-500/20 text-blue-500',
    'in-progress': 'bg-amber-500/20 text-amber-500',
    resolved: 'bg-emerald-500/20 text-emerald-500',
    closed: 'bg-slate-500/20 text-slate-400',
};

function TicketCard({ ticket }: { ticket: Ticket }) {
    const statusColor = statusColors[ticket.status] || 'bg-slate-500/20 text-slate-400';
    const statusBg = statusColor.split(' ')[0];
    const statusText = statusColor.split(' ')[1];

    return (
        <TouchableOpacity
            className="bg-card border border-border p-4 rounded-2xl mb-3 shadow-sm"
            onPress={() => router.push(`/ticket/${ticket.id}`)}
        >
            <View className="flex-row justify-between items-start mb-2">
                <Text className="text-muted-foreground font-mono text-xs">#{ticket.number}</Text>
                <View className={`${statusBg} px-2 py-1 rounded-full`}>
                    <Text className={`${statusText} text-[10px] font-bold uppercase`}>{ticket.status.replace('-', ' ')}</Text>
                </View>
            </View>
            <Text className="text-foreground font-semibold text-base mb-1" numberOfLines={1}>{ticket.subject}</Text>
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border">
                <View>
                    <Text className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Category</Text>
                    <Text className="text-sm font-medium text-foreground capitalize">{ticket.category.replace('-', ' ')}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Date</Text>
                    <Text className="text-sm font-medium text-foreground">
                        {new Date(ticket.ticket_date).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function PortalDashboard() {
    const { profile } = useAppStore();

    const { data: tickets, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['portal-tickets', profile?.id],
        queryFn: () => getTickets({ created_by: profile?.id }),
        enabled: !!profile?.id,
    });

    return (
        <View className="flex-1 bg-background pt-12 px-5">
            <View className="flex-row justify-between items-center mb-6">
                <View>
                    <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
                    <Text className="text-muted-foreground mt-1">Welcome back, {profile?.name?.split(' ')[0]}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/report-issue')}
                    className="bg-emerald-600/20 w-12 h-12 rounded-full items-center justify-center border border-emerald-500/30"
                >
                    <Ionicons name="add" size={24} color="#10b981" />
                </TouchableOpacity>
            </View>

            <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground mb-4">Your Recent Tickets</Text>

                {isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="hsl(210 40% 98%)" />
                    </View>
                ) : tickets?.length === 0 ? (
                    <View className="flex-1 items-center justify-center mt-10">
                        <Ionicons name="ticket-outline" size={48} color="hsl(215.4 16.3% 46.9%)" />
                        <Text className="text-muted-foreground mt-4 text-center px-6">
                            You haven't reported any issues yet. Tap the + icon to report a new issue.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={tickets}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <TicketCard ticket={item} />}
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
        </View>
    );
}
