import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Card, useTheme, type ThemeColors } from '@/components/ui';
import { api } from '@/utils/api';

interface TodayCheckInProps {
  onRefresh?: () => void;
}

const MOODS = [
  { label: '😄 Great', value: 'great' },
  { label: '🙂 Good', value: 'good' },
  { label: '😐 Okay', value: 'okay' },
  { label: '😔 Bad', value: 'bad' },
  { label: '😩 Terrible', value: 'terrible' },
] as const;

const ENERGIES = [
  { label: '⚡ High', value: 'high' },
  { label: '🔋 Medium', value: 'medium' },
  { label: '🪫 Low', value: 'low' },
] as const;

const MOOD_EMOJI: Record<string, string> = {
  great: '😄',
  good: '🙂',
  okay: '😐',
  bad: '😔',
  terrible: '😩',
};

const ENERGY_EMOJI: Record<string, string> = {
  high: '⚡',
  medium: '🔋',
  low: '🪫',
};

export function TodayCheckIn({ onRefresh }: TodayCheckInProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkIn, setCheckIn] = useState<any>(null);
  const [editing, setEditing] = useState(false);

  // Form state
  const [weight, setWeight] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState<string | null>(null);

  const fetchCheckIn = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTodayCheckIn();
      setCheckIn(data);
    } catch {
      setCheckIn(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckIn();
  }, [fetchCheckIn]);

  const startEditing = () => {
    if (checkIn) {
      setWeight(checkIn.weight != null ? String(checkIn.weight) : '');
      setMood(checkIn.mood ?? null);
      setEnergy(checkIn.energy ?? null);
    }
    setEditing(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data: { weight?: number | null; mood?: string | null; energy?: string | null } = {};
      if (weight.trim()) data.weight = parseFloat(weight);
      else data.weight = null;
      data.mood = mood;
      data.energy = energy;

      const result = await api.checkIn(data);
      setCheckIn(result);
      setWeight('');
      setMood(null);
      setEnergy(null);
      setEditing(false);
      onRefresh?.();
    } catch {
      // silently fail for MVP
    } finally {
      setSubmitting(false);
    }
  };

  const hasCheckedIn = checkIn && checkIn.id;
  const showForm = !hasCheckedIn || editing;

  return (
    <Card variant="elevated">
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.titleIcon}>{hasCheckedIn ? '✅' : '📋'}</Text>
        <Text style={styles.title}>Today's Check-in</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : showForm ? (
        /* Form view */
        <View style={styles.form}>
          {/* Weight input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Weight</Text>
            <View style={styles.weightRow}>
              <TextInput
                style={styles.weightInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={styles.weightSuffix}>kg</Text>
            </View>
          </View>

          {/* Mood selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mood</Text>
            <View style={styles.pillRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setMood(mood === m.value ? null : m.value)}
                  style={[
                    styles.pill,
                    mood === m.value && { backgroundColor: colors.primary },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      mood === m.value && { color: colors.primaryText },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Energy selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Energy</Text>
            <View style={styles.pillRow}>
              {ENERGIES.map((e) => (
                <TouchableOpacity
                  key={e.value}
                  onPress={() => setEnergy(energy === e.value ? null : e.value)}
                  style={[
                    styles.pill,
                    energy === e.value && { backgroundColor: colors.primary },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pillText,
                      energy === e.value && { color: colors.primaryText },
                    ]}
                  >
                    {e.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit / Cancel buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {editing && (
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 1, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setEditing(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.submitText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.submitBtn, { flex: 1 }, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.7}
            >
              {submitting ? (
                <ActivityIndicator color={colors.primaryText} size="small" />
              ) : (
                <Text style={styles.submitText}>{editing ? 'Update' : 'Check In'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Summary view */
        <View>
          <View style={styles.summaryRow}>
            {checkIn.weight != null && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{checkIn.weight}</Text>
                <Text style={styles.summaryLabel}>kg</Text>
              </View>
            )}
            {checkIn.mood && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>
                  {MOOD_EMOJI[checkIn.mood] ?? checkIn.mood}
                </Text>
                <Text style={styles.summaryLabel}>Mood</Text>
              </View>
            )}
            {checkIn.energy && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryEmoji}>
                  {ENERGY_EMOJI[checkIn.energy] ?? checkIn.energy}
                </Text>
                <Text style={styles.summaryLabel}>Energy</Text>
              </View>
            )}
            {!checkIn.weight && !checkIn.mood && !checkIn.energy && (
              <Text style={styles.emptyText}>Checked in ✓</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={startEditing}
            activeOpacity={0.7}
            style={{ alignSelf: 'center', marginTop: 10, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 14, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>Edit</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

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
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    summaryItem: {
      alignItems: 'center',
      gap: 4,
    },
    summaryValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    summaryEmoji: {
      fontSize: 28,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    form: {
      gap: 16,
    },
    fieldGroup: {
      gap: 6,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    weightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
    },
    weightInput: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      paddingVertical: 10,
    },
    weightSuffix: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textMuted,
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
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    submitText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}
