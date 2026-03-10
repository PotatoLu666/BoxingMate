import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Card, useTheme, type ThemeColors } from '@/components/ui';
import { api } from '@/utils/api';

interface WeeklyStatsProps {
  refreshKey?: number;
}

interface Stats {
  sessionsCount: number;
  totalDuration: number;
  avgIntensity: string | null;
  dates: string[];
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

function intensityColor(intensity: string | null, colors: ThemeColors): string {
  switch (intensity) {
    case 'low':
      return colors.success;
    case 'medium':
      return colors.warning;
    case 'high':
      return colors.danger;
    default:
      return colors.textMuted;
  }
}

export function WeeklyStats({ refreshKey }: WeeklyStatsProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getWeeklyStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  const trainingDays = stats ? new Set(stats.dates).size : 0;

  return (
    <Card variant="elevated">
      <View style={styles.titleRow}>
        <Text style={styles.titleIcon}>📊</Text>
        <Text style={styles.title}>This Week</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : !stats ? (
        <Text style={styles.emptyText}>Unable to load stats</Text>
      ) : (
        <View style={styles.grid}>
          {/* Sessions count */}
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🏋️</Text>
            <Text style={styles.statValue}>{stats.sessionsCount}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>

          {/* Total duration */}
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>⏱</Text>
            <Text style={styles.statValue}>{formatDuration(stats.totalDuration)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>

          {/* Avg intensity */}
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text
              style={[
                styles.statValue,
                { color: intensityColor(stats.avgIntensity, colors) },
              ]}
            >
              {stats.avgIntensity
                ? stats.avgIntensity.charAt(0).toUpperCase() + stats.avgIntensity.slice(1)
                : '—'}
            </Text>
            <Text style={styles.statLabel}>Intensity</Text>
          </View>

          {/* Training days */}
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statValue}>{trainingDays} / 7</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
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
    emptyText: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statBox: {
      width: '47%',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      gap: 2,
    },
    statIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
}
