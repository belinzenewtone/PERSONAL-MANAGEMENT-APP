import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    StyleSheet, Alert, ActivityIndicator, Modal, Pressable, ScrollView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, addTask, updateTask, deleteTask } from '../../services/tasks';
import { useAppStore } from '../../store/useAppStore';
import { GlassCard } from '../../components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring,
    runOnJS, withTiming, interpolateColor
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import type { Task, ImportanceLevel } from '../../types/database';
import { useState } from 'react';

// ─── Status helpers ────────────────────────────────────────────────────────────
type TaskStatus = 'pending' | 'in_progress' | 'completed';

const STATUS_CYCLE: TaskStatus[] = ['pending', 'in_progress', 'completed'];
const STATUS_CONFIG: Record<TaskStatus, { color: string; bg: string; icon: string; label: string }> = {
    pending: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', icon: 'ellipse-outline', label: 'Pending' },
    in_progress: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', icon: 'radio-button-on-outline', label: 'In Progress' },
    completed: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: 'checkmark-circle', label: 'Done' },
};

const IMPORTANCE_CONFIG: Record<ImportanceLevel, { color: string; label: string }> = {
    urgent: { color: '#ef4444', label: 'Urgent' },
    important: { color: '#f59e0b', label: 'Important' },
    neutral: { color: '#64748b', label: 'Neutral' },
};

function getTaskStatus(task: Task): TaskStatus {
    // Gracefully support both old boolean `completed` and new `status` field
    if ((task as any).status) return (task as any).status as TaskStatus;
    return task.completed ? 'completed' : 'pending';
}

function nextStatus(current: TaskStatus): TaskStatus {
    const i = STATUS_CYCLE.indexOf(current);
    return STATUS_CYCLE[(i + 1) % STATUS_CYCLE.length];
}

// ─── Swipeable Task Row ────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 80;

function SwipeableTaskRow({ task, onStatusChange, onDelete }: {
    task: Task;
    onStatusChange: (id: string, status: TaskStatus) => void;
    onDelete: (id: string) => void;
}) {
    const translateX = useSharedValue(0);
    const status = getTaskStatus(task);
    const sc = STATUS_CONFIG[status];
    const ic = IMPORTANCE_CONFIG[task.importance];

    const handleComplete = () => onStatusChange(task.id, nextStatus(status));
    const handleDelete = () => {
        Alert.alert('Delete Task', 'Delete this task?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
        ]);
    };

    const pan = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onUpdate(e => {
            translateX.value = e.translationX;
        })
        .onEnd(e => {
            if (e.translationX > SWIPE_THRESHOLD) {
                // swipe right → cycle status
                runOnJS(handleComplete)();
                translateX.value = withSpring(0);
            } else if (e.translationX < -SWIPE_THRESHOLD) {
                // swipe left → delete
                runOnJS(handleDelete)();
                translateX.value = withSpring(0);
            } else {
                translateX.value = withSpring(0);
            }
        });

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={rowStyles.wrapper}>
            {/* Reveal layers */}
            <View style={[rowStyles.revealRight, { backgroundColor: sc.bg }]}>
                <Ionicons name={sc.icon as any} size={22} color={sc.color} />
                <Text style={[rowStyles.revealText, { color: sc.color }]}>{sc.label}</Text>
            </View>
            <View style={rowStyles.revealLeft}>
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
                <Text style={[rowStyles.revealText, { color: '#ef4444' }]}>Delete</Text>
            </View>

            <GestureDetector gesture={pan}>
                <Animated.View style={animStyle}>
                    <GlassCard style={rowStyles.card}>
                        {/* Status tap */}
                        <TouchableOpacity onPress={handleComplete} style={[rowStyles.statusBtn, { backgroundColor: sc.bg }]}>
                            <Ionicons name={sc.icon as any} size={20} color={sc.color} />
                        </TouchableOpacity>

                        <View style={{ flex: 1 }}>
                            <Text style={[rowStyles.text, status === 'completed' && rowStyles.done]}>
                                {task.text}
                            </Text>
                            <Text style={rowStyles.date}>
                                {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                        </View>

                        {/* Importance badge */}
                        <View style={[rowStyles.badge, { backgroundColor: ic.color + '22' }]}>
                            <Text style={[rowStyles.badgeText, { color: ic.color }]}>{ic.label}</Text>
                        </View>
                    </GlassCard>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const rowStyles = StyleSheet.create({
    wrapper: { marginBottom: 10, position: 'relative' },
    revealRight: { position: 'absolute', left: 0, top: 0, bottom: 0, right: 0, borderRadius: 16, alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 20, flexDirection: 'row', gap: 6 },
    revealLeft: { position: 'absolute', right: 0, top: 0, bottom: 0, left: 0, borderRadius: 16, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 20, flexDirection: 'row', gap: 6 },
    revealText: { fontSize: 12, fontWeight: '700', alignSelf: 'center' },
    card: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    statusBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    text: { fontSize: 14, color: '#fff', fontWeight: '500', flex: 1, flexWrap: 'wrap' },
    done: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.35)' },
    date: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 10, fontWeight: '700' },
});

// ─── Add Task Modal ────────────────────────────────────────────────────────────
function AddTaskModal({ visible, onClose, onSave }: {
    visible: boolean;
    onClose: () => void;
    onSave: (text: string, date: string, importance: ImportanceLevel) => void;
}) {
    const [text, setText] = useState('');
    const [importance, setImportance] = useState<ImportanceLevel>('neutral');
    const today = new Date().toISOString().split('T')[0];

    const handleSave = () => {
        if (!text.trim()) return;
        onSave(text.trim(), today, importance);
        setText('');
        setImportance('neutral');
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={modal.overlay} onPress={onClose} />
            <View style={modal.sheet}>
                <View style={modal.handle} />
                <Text style={modal.title}>New Task</Text>

                <Text style={modal.label}>Description</Text>
                <GlassCard style={modal.inputCard}>
                    <TextInput
                        style={modal.input}
                        value={text}
                        onChangeText={setText}
                        placeholder="What needs to be done?"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        multiline
                        autoFocus
                    />
                </GlassCard>

                <Text style={modal.label}>Priority</Text>
                <View style={modal.importanceRow}>
                    {(['urgent', 'important', 'neutral'] as ImportanceLevel[]).map(i => {
                        const c = IMPORTANCE_CONFIG[i];
                        const active = importance === i;
                        return (
                            <TouchableOpacity
                                key={i}
                                onPress={() => setImportance(i)}
                                style={[modal.importanceBtn, active && { backgroundColor: c.color + '30', borderColor: c.color }]}
                            >
                                <Text style={[modal.importanceTxt, { color: active ? c.color : 'rgba(255,255,255,0.4)' }]}>
                                    {c.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity style={modal.saveBtn} onPress={handleSave}>
                    <Text style={modal.saveTxt}>Add Task</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const modal = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
    sheet: { backgroundColor: 'hsl(224,71%,6%)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'center', marginBottom: 20 },
    title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20 },
    label: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    inputCard: { marginBottom: 20, padding: 14 },
    input: { color: '#fff', fontSize: 15, minHeight: 60 },
    importanceRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    importanceBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center' },
    importanceTxt: { fontSize: 13, fontWeight: '600' },
    saveBtn: { backgroundColor: 'rgba(167,139,250,0.2)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.4)', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    saveTxt: { color: '#a78bfa', fontWeight: '700', fontSize: 15 },
});

// ─── Main Tasks Screen ──────────────────────────────────────────────────────────
const FILTERS: { label: string; value: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Done', value: 'completed' },
];

export default function TasksScreen() {
    const { taskSearch, setTaskSearch } = useAppStore();
    const [activeFilter, setActiveFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const qc = useQueryClient();

    const { data: tasks, isLoading } = useQuery({
        queryKey: ['admin-tasks'],
        queryFn: () => getTasks(),
    });

    const mutateStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
            updateTask(id, { completed: status === 'completed', ...(({ status } as any)) }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tasks'] }),
    });

    const mutateDelete = useMutation({
        mutationFn: (id: string) => deleteTask(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tasks'] }),
    });

    const mutateAdd = useMutation({
        mutationFn: (input: { text: string; date: string; importance: ImportanceLevel }) => addTask(input),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-tasks'] }),
    });

    const filtered = (tasks ?? []).filter(t => {
        const s = getTaskStatus(t);
        const matchesFilter = activeFilter === 'all' || s === activeFilter;
        const matchesSearch = taskSearch === '' || t.text.toLowerCase().includes(taskSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={scr.screen}>
                {/* Header */}
                <View style={scr.header}>
                    <Text style={scr.title}>Tasks</Text>
                    <TouchableOpacity onPress={() => setShowModal(true)} style={scr.addBtn}>
                        <Ionicons name="add" size={22} color="#a78bfa" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <GlassCard style={scr.searchCard}>
                    <View style={scr.searchRow}>
                        <Ionicons name="search-outline" size={17} color="rgba(255,255,255,0.35)" />
                        <TextInput
                            style={scr.searchInput}
                            placeholder="Search tasks…"
                            placeholderTextColor="rgba(255,255,255,0.25)"
                            value={taskSearch}
                            onChangeText={setTaskSearch}
                        />
                        {taskSearch.length > 0 && (
                            <TouchableOpacity onPress={() => setTaskSearch('')}>
                                <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.35)" />
                            </TouchableOpacity>
                        )}
                    </View>
                </GlassCard>

                {/* Filter chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={scr.filters} contentContainerStyle={{ gap: 8 }}>
                    {FILTERS.map(f => {
                        const active = activeFilter === f.value;
                        return (
                            <TouchableOpacity
                                key={f.value}
                                onPress={() => setActiveFilter(f.value)}
                                style={[scr.chip, active && scr.chipActive]}
                            >
                                <Text style={[scr.chipText, active && scr.chipTextActive]}>{f.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Hint */}
                <Text style={scr.hint}>← Swipe left to delete  •  Swipe right to cycle status →</Text>

                {/* List */}
                {isLoading ? (
                    <View style={scr.center}>
                        <ActivityIndicator size="large" color="rgba(255,255,255,0.4)" />
                    </View>
                ) : filtered.length === 0 ? (
                    <View style={scr.center}>
                        <Ionicons name="checkmark-done-outline" size={48} color="rgba(255,255,255,0.15)" />
                        <Text style={scr.emptyText}>
                            {taskSearch ? 'No tasks match your search.' : 'No tasks here.'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={t => t.id}
                        renderItem={({ item }) => (
                            <SwipeableTaskRow
                                task={item}
                                onStatusChange={(id, s) => mutateStatus.mutate({ id, status: s })}
                                onDelete={(id) => mutateDelete.mutate(id)}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    />
                )}

                {/* Add Modal */}
                <AddTaskModal
                    visible={showModal}
                    onClose={() => setShowModal(false)}
                    onSave={(text, date, importance) => mutateAdd.mutate({ text, date, importance })}
                />
            </View>
        </GestureHandlerRootView>
    );
}

const scr = StyleSheet.create({
    screen: { flex: 1, backgroundColor: 'hsl(224, 71%, 4%)', paddingTop: 56, paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 26, fontWeight: '700', color: '#fff' },
    addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(167,139,250,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)' },
    searchCard: { marginBottom: 12, paddingHorizontal: 14, paddingVertical: 10 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    searchInput: { flex: 1, color: '#fff', fontSize: 14 },
    filters: { marginBottom: 8, flexGrow: 0 },
    chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
    chipActive: { backgroundColor: 'rgba(167,139,250,0.18)', borderColor: 'rgba(167,139,250,0.5)' },
    chipText: { fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: '500' },
    chipTextActive: { color: '#a78bfa', fontWeight: '700' },
    hint: { fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginBottom: 12, letterSpacing: 0.3 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: 'rgba(255,255,255,0.3)', marginTop: 12, textAlign: 'center' },
});
