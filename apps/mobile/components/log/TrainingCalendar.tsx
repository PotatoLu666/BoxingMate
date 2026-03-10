import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card, useTheme, type ThemeColors } from '@/components/ui';
import { api } from '@/utils/api';

interface TrainingCalendarProps {
  refreshKey?: number;
  onSelectDate?: (date: string | null) => void;
  selectedDate?: string | null;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns Monday-based offset (0 = Mon, 6 = Sun) */
function getMondayOffset(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function TrainingCalendar({ refreshKey, onSelectDate, selectedDate }: TrainingCalendarProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [loading, setLoading] = useState(true);
  const [trainingDates, setTrainingDates] = useState<Set<string>>(new Set());

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch a large batch and filter client-side
      const { items } = await api.getSessions(200, 0);
      const dates = new Set<string>();
      for (const session of items) {
        if (session.date) {
          // session.date might be ISO string — extract just the date part
          const dateStr = String(session.date).slice(0, 10);
          dates.add(dateStr);
        }
      }
      setTrainingDates(dates);
    } catch {
      setTrainingDates(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, refreshKey]);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const offset = getMondayOffset(viewYear, viewMonth);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const todayKey = toDateKey(now);

  // Build calendar cells: blank offset + day numbers
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Card variant="elevated">
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.titleIcon}>🗓️</Text>
        <Text style={styles.title}>Training Calendar</Text>
      </View>

      {/* Month navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={goPrev} style={styles.navBtn} activeOpacity={0.6}>
          <FontAwesome name="chevron-left" size={14} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={goNext} style={styles.navBtn} activeOpacity={0.6}>
          <FontAwesome name="chevron-right" size={14} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <>
          {/* Day-of-week headers */}
          <View style={styles.weekRow}>
            {DAY_LABELS.map((label) => (
              <View key={label} style={styles.dayHeaderCell}>
                <Text style={styles.dayHeaderText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Day grid */}
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`blank-${idx}`} style={styles.dayCell} />;
              }

              const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateKey === todayKey;
              const hasTraining = trainingDates.has(dateKey);

              const isSelected = dateKey === selectedDate;

              return (
                <TouchableOpacity
                  key={dateKey}
                  style={styles.dayCell}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (onSelectDate) {
                      onSelectDate(isSelected ? null : dateKey);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.dayNumber,
                      isToday && !isSelected && { backgroundColor: colors.primary },
                      isSelected && { backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.text },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        (isToday || isSelected) && { color: colors.primaryText, fontWeight: '800' },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {hasTraining && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
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
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    navBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceAlt,
    },
    monthLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    dayHeaderCell: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
    },
    dayHeaderText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: `${100 / 7}%`,
      alignItems: 'center',
      paddingVertical: 4,
      minHeight: 40,
    },
    dayNumber: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      marginTop: 2,
    },
  });
}
