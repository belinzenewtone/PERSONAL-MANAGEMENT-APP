import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { Ionicons } from '@expo/vector-icons';
import type { Ticket } from "../../../types/database";

const statusColors: Record<string, string> = {
    open: 'bg-blue-500/20 text-blue-500',
    'in-progress': 'bg-amber-500/20 text-amber-500',
    resolved: 'bg-emerald-500/20 text-emerald-500',
    closed: 'bg-slate-500/20 text-slate-400',
};

const priorityColors: Record<string, string> = {
    low: 'text-slate-400',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    critical: 'text-red-500',
};

export default function TicketDetailScreen() {
    const { id } = useLocalSearchParams();

    const { data: ticket, isLoading } = useQuery({
        queryKey: ['ticket', id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return data as Ticket;
        },
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="hsl(210 40% 98%)" />
            </View>
        );
    }

    if (!ticket) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <Text className="text-foreground">Ticket not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 p-2 bg-primary rounded-lg">
                    <Text className="text-primary-foreground">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusColor = statusColors[ticket.status] || 'bg-slate-500/20 text-slate-400';
    const priorityColor = priorityColors[ticket.priority] || 'text-slate-400';

    return (
        <View className="flex-1 bg-background">
            <View className="flex-row items-center pt-12 pb-4 px-4 bg-card border-b border-border">
                <TouchableOpacity onPress={() => router.back()} className="mr-3 p-2">
                    <Ionicons name="arrow-back" size={24} color="hsl(210 40% 98%)" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-foreground flex-1" numberOfLines={1}>Ticket #{ticket.number}</Text>
            </View>

            <ScrollView className="flex-1 p-5" contentContainerStyle={{ paddingBottom: 80 }}>
                <View className="bg-card p-5 rounded-2xl border border-border shadow-sm">
                    <View className="flex-row justify-between items-start mb-4">
                        <View className={`${statusColor.split(' ')[0]} px-3 py-1.5 rounded-full`}>
                            <Text className={`${statusColor.split(' ')[1]} text-xs font-bold uppercase`}>
                                {ticket.status.replace('-', ' ')}
                            </Text>
                        </View>
                        <Text className={`text-xs font-bold uppercase ${priorityColor}`}>
                            {ticket.priority} Priority
                        </Text>
                    </View>

                    <Text className="text-2xl font-bold text-foreground mb-4">{ticket.subject}</Text>

                    <View className="flex-row flex-wrap gap-y-4 mb-6 pt-4 border-t border-border">
                        <View className="w-1/2">
                            <Text className="text-xs text-muted-foreground uppercase font-medium mb-1">Category</Text>
                            <Text className="text-sm font-semibold text-foreground capitalize">{ticket.category.replace('-', ' ')}</Text>
                        </View>
                        <View className="w-1/2">
                            <Text className="text-xs text-muted-foreground uppercase font-medium mb-1">Date Created</Text>
                            <Text className="text-sm font-semibold text-foreground">
                                {new Date(ticket.ticket_date).toLocaleDateString()}
                            </Text>
                        </View>
                        <View className="w-1/2">
                            <Text className="text-xs text-muted-foreground uppercase font-medium mb-1">Department</Text>
                            <Text className="text-sm font-semibold text-foreground">{ticket.department}</Text>
                        </View>
                        {ticket.assigned_to && (
                            <View className="w-1/2">
                                <Text className="text-xs text-muted-foreground uppercase font-medium mb-1">Assigned To</Text>
                                <Text className="text-sm font-semibold text-foreground">IT Support</Text>
                            </View>
                        )}
                    </View>

                    <View className="bg-background rounded-xl p-4 border border-border mt-2">
                        <Text className="text-xs text-muted-foreground uppercase font-medium mb-2">Description</Text>
                        <Text className="text-sm text-foreground leading-relaxed">
                            {ticket.description || "No description provided."}
                        </Text>
                    </View>
                </View>

                {ticket.resolution_notes && (
                    <View className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 mt-4">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" className="mr-2" />
                            <Text className="text-emerald-500 font-bold ml-2">Resolution Notes</Text>
                        </View>
                        <Text className="text-foreground leading-relaxed">
                            {ticket.resolution_notes}
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
