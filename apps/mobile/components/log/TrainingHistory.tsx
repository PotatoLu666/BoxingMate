import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card, useTheme, type ThemeColors } from '@/components/ui';
import { api } from '@/utils/api';

interface TrainingHistoryProps {
  refreshKey?: number;
  selectedDate?: string | null;
}

// --- Type / intensity colour maps ---

const TYPE_COLORS: Record<string, string> = {
  boxing: '#DC2626',
  muay_thai: '#EA580C',
  mma: '#7C3AED',
  kickboxing: '#2563EB',
  sparring: '#16A34A',
  conditioning: '#6B7280',
};

const INTENSITY_COLORS: Record<string, string> = {
  low: '#16A34A',
  medium: '#D97706',
  high: '#DC2626',
};

const SESSION_TYPES = [
  { label: '🥊 Boxing', value: 'boxing' },
  { label: '🦵 Muay Thai', value: 'muay_thai' },
  { label: '🤼 MMA', value: 'mma' },
  { label: '🦶 Kickboxing', value: 'kickboxing' },
  { label: '🥋 Sparring', value: 'sparring' },
  { label: '💪 Conditioning', value: 'conditioning' },
] as const;

const INTENSITIES = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
] as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatRounds(rounds: number, roundDur: number, restDur: number): string {
  const fmtTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}:00`;
  };
  return `${rounds} × ${fmtTime(roundDur)} / ${fmtTime(restDur)} rest`;
}

// ─── Session Card ────────────────────────────────────────

function SessionItem({
  session,
  colors,
  onDelete,
}: {
  session: any;
  colors: ThemeColors;
  onDelete: (id: string) => void;
}) {
  const styles = makeItemStyles(colors);
  const typeColor = TYPE_COLORS[session.type] ?? colors.textMuted;

  const confirmDelete = () => {
    Alert.alert('Delete Session', 'Are you sure you want to delete this training session?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(session.id) },
    ]);
  };

  return (
    <TouchableOpacity onLongPress={confirmDelete} activeOpacity={0.8}>
      <View style={styles.card}>
        {/* Top row: type badge + date */}
        <View style={styles.topRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeBadgeText}>
              {(session.type ?? 'other').replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={styles.date}>{formatDate(session.date)}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text style={styles.duration}>{session.duration} min</Text>
          {session.rounds != null && session.roundDuration != null && session.restDuration != null && (
            <Text style={styles.rounds}>
              {formatRounds(session.rounds, session.roundDuration, session.restDuration)}
            </Text>
          )}
          {session.intensity && (
            <View
              style={[
                styles.intensityBadge,
                { backgroundColor: INTENSITY_COLORS[session.intensity] ?? colors.textMuted },
              ]}
            >
              <Text style={styles.intensityText}>
                {session.intensity.charAt(0).toUpperCase() + session.intensity.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Notes preview */}
        {session.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {session.notes}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ─── New Session Modal ───────────────────────────────────

function NewSessionModal({
  visible,
  colors,
  onClose,
  onCreated,
}: {
  visible: boolean;
  colors: ThemeColors;
  onClose: () => void;
  onCreated: () => void;
}) {
  const styles = makeModalStyles(colors);

  const [type, setType] = useState('boxing');
  const [duration, setDuration] = useState('');
  const [rounds, setRounds] = useState('');
  const [roundDuration, setRoundDuration] = useState('');
  const [restDuration, setRestDuration] = useState('');
  const [intensity, setIntensity] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType('boxing');
    setDuration('');
    setRounds('');
    setRoundDuration('');
    setRestDuration('');
    setIntensity(null);
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!duration.trim()) return;
    setSubmitting(true);
    try {
      await api.createSession({
        date: new Date().toISOString(),
        type,
        duration: parseInt(duration, 10),
        rounds: rounds ? parseInt(rounds, 10) : null,
        roundDuration: roundDuration ? parseInt(roundDuration, 10) : null,
        restDuration: restDuration ? parseInt(restDuration, 10) : null,
        intensity,
        notes: notes.trim() || null,
      });
      reset();
      onCreated();
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>New Session</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
                <FontAwesome name="times" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Type selector */}
            <Text style={styles.label}>Type</Text>
            <View style={styles.pillRow}>
              {SESSION_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={[
                    styles.pill,
                    type === t.value && {
                      backgroundColor: TYPE_COLORS[t.value],
                      borderColor: TYPE_COLORS[t.value],
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      type === t.value && { color: '#FFFFFF' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Duration */}
            <Text style={styles.label}>Duration (minutes) *</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="45"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
            />

            {/* Rounds row */}
            <Text style={styles.label}>Rounds (optional)</Text>
            <View style={styles.inputRow}>
              <View style={styles.inputCol}>
                <TextInput
                  style={styles.input}
                  value={rounds}
                  onChangeText={setRounds}
                  placeholder="Rounds"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inputCol}>
                <TextInput
                  style={styles.input}
                  value={roundDuration}
                  onChangeText={setRoundDuration}
                  placeholder="Round (s)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inputCol}>
                <TextInput
                  style={styles.input}
                  value={restDuration}
                  onChangeText={setRestDuration}
                  placeholder="Rest (s)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Intensity */}
            <Text style={styles.label}>Intensity</Text>
            <View style={styles.pillRow}>
              {INTENSITIES.map((i) => (
                <TouchableOpacity
                  key={i.value}
                  onPress={() =>
                    setIntensity(intensity === i.value ? null : i.value)
                  }
                  style={[
                    styles.pill,
                    intensity === i.value && {
                      backgroundColor: INTENSITY_COLORS[i.value],
                      borderColor: INTENSITY_COLORS[i.value],
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      intensity === i.value && { color: '#FFFFFF' },
                    ]}
                  >
                    {i.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it go?"
              placeholderTextColor={colors.textMuted}
              multiline
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting || !duration.trim()}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>Save Session</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Component ──────────────────────────────────────

export function TrainingHistory({ refreshKey, selectedDate }: TrainingHistoryProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const { items } = await api.getSessions(50, 0);
      setSessions(items);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshKey]);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filterDate = selectedDate || todayStr;
  const filteredSessions = sessions.filter((s) => {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return key === filterDate;
  });
  const displaySessions = showAll ? sessions : filteredSessions;
  const olderCount = sessions.length - filteredSessions.length;
  const isToday = filterDate === todayStr;
  const filterLabel = isToday
    ? "Today's Training"
    : new Date(filterDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshKey]);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      Alert.alert('Error', 'Failed to delete session');
    }
  };

  return (
    <>
      <Card variant="elevated">
        <View style={styles.titleRow}>
          <Text style={styles.titleIcon}>📜</Text>
          <Text style={styles.title}>{showAll ? 'All History' : filterLabel}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : displaySessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🥊</Text>
            <Text style={styles.emptyText}>
              {showAll ? 'No training sessions yet' : `No training on ${isToday ? 'today' : filterLabel}`}
            </Text>
            <Text style={styles.emptySubText}>
              Tap the + button to log a session
            </Text>
          </View>
        ) : (
          <View style={styles.sessionList}>
            {displaySessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                colors={colors}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}

        {/* Toggle today / all */}
        {!loading && (
          <TouchableOpacity
            onPress={() => setShowAll((v) => !v)}
            activeOpacity={0.7}
            style={{ alignSelf: 'center', marginTop: 12, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>
              {showAll ? 'Show Today Only' : `View All (${olderCount} more)`}
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      {/* Floating Action Button */}
      <AddSessionFAB colors={colors} onPress={() => setModalVisible(true)} />

      {/* New Session Modal */}
      <NewSessionModal
        visible={modalVisible}
        colors={colors}
        onClose={() => setModalVisible(false)}
        onCreated={fetchSessions}
      />
    </>
  );
}

// ─── FAB ─────────────────────────────────────────────────

export function AddSessionFAB({
  colors,
  onPress,
}: {
  colors?: ThemeColors;
  onPress: () => void;
}) {
  const theme = useTheme();
  const c = colors ?? theme.colors;

  return (
    <TouchableOpacity
      style={{
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: c.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          },
          android: {
            elevation: 6,
          },
        }),
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <FontAwesome name="plus" size={22} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 24,
      gap: 6,
    },
    emptyIcon: {
      fontSize: 36,
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    emptySubText: {
      fontSize: 13,
      color: colors.textMuted,
    },
    sessionList: {
      gap: 10,
    },
  });
}

function makeItemStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 12,
      gap: 6,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    typeBadge: {
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 12,
    },
    typeBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    date: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    duration: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    rounds: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    intensityBadge: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    intensityText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    notes: {
      fontSize: 13,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
  });
}

function makeModalStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '90%',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 14,
      marginBottom: 6,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pill: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    input: {
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 8,
    },
    inputCol: {
      flex: 1,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 8,
    },
    submitText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}
