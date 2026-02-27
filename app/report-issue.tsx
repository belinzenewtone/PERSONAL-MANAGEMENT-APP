import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTicket } from "../services/tickets";
import { useAppStore } from "../store/useAppStore";
import type { TicketCategory } from "../types/database";

const CATEGORIES: { label: string; value: TicketCategory }[] = [
    { label: 'Email', value: 'email' },
    { label: 'Account / Login', value: 'account-login' },
    { label: 'Password Reset', value: 'password-reset' },
    { label: 'Hardware', value: 'hardware' },
    { label: 'Software', value: 'software' },
    { label: 'Network / VPN', value: 'network-vpn' },
    { label: 'Other', value: 'other' },
];

export default function ReportIssueModal() {
    const { profile } = useAppStore();
    const queryClient = useQueryClient();

    const [category, setCategory] = useState<TicketCategory>('email');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    const createMut = useMutation({
        mutationFn: addTicket,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['portal-tickets'] });
            Alert.alert("Success", "Ticket submitted successfully");
            router.back();
        },
        onError: (e: Error) => {
            Alert.alert("Error", e.message);
        },
    });

    const handleSubmit = () => {
        if (!profile) {
            Alert.alert("Error", "Profile not loaded. Please log in again.");
            return;
        }
        if (!subject.trim()) {
            Alert.alert("Validation", "Subject is required");
            return;
        }

        createMut.mutate({
            ticket_date: new Date().toISOString().split('T')[0],
            employee_name: profile.name,
            department: 'Employee Portal',
            created_by: profile.id,
            category,
            // For now, defaulting priority and sentiment since we don't have the AI service properly running in mobile yet.
            priority: 'medium',
            sentiment: 'neutral',
            subject,
            description,
        });
    };

    return (
        <ScrollView className="flex-1 bg-background px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="mb-6">
                <Text className="text-2xl font-bold text-foreground">Report an Issue</Text>
                <Text className="text-muted-foreground mt-2">Describe the problem below.</Text>
            </View>

            <View className="space-y-4">
                <View>
                    <Text className="text-foreground font-medium mb-2">Category</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat.value}
                                onPress={() => setCategory(cat.value)}
                                className={`px-4 py-2 rounded-full border ${category === cat.value ? 'bg-primary border-primary' : 'bg-transparent border-border'
                                    }`}
                            >
                                <Text className={category === cat.value ? 'text-primary-foreground font-medium' : 'text-foreground'}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View className="mt-4">
                    <Text className="text-foreground font-medium mb-2">Subject</Text>
                    <TextInput
                        value={subject}
                        onChangeText={setSubject}
                        placeholder="Short summary of the issue"
                        placeholderTextColor="hsl(215.4 16.3% 46.9%)"
                        className="bg-card text-foreground px-4 py-3 rounded-xl border border-border"
                    />
                </View>

                <View className="mt-4">
                    <Text className="text-foreground font-medium mb-2">Description</Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        placeholder="More details about what's going wrong..."
                        placeholderTextColor="hsl(215.4 16.3% 46.9%)"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        className="bg-card text-foreground px-4 py-3 rounded-xl border border-border min-h-[120px]"
                    />
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={createMut.isPending}
                    className="bg-primary py-4 rounded-xl items-center mt-6 flex-row justify-center"
                >
                    {createMut.isPending ? (
                        <ActivityIndicator color="hsl(210 40% 98%)" />
                    ) : (
                        <Text className="text-primary-foreground font-semibold text-base">Submit Ticket</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="py-4 items-center mt-2"
                >
                    <Text className="text-muted-foreground font-medium">Cancel</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
