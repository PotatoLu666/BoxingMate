import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Card, useTheme, type ThemeColors } from '@/components/ui';
import { api } from '@/utils/api';

type Span = 'week' | 'month' | 'year';
type Metric = 'sessions' | 'duration' | 'weight' | 'mood' | 'energy';

interface DashboardProps {
  refreshKey?: number;
}

const SPANS: { label: string; value: Span }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const METRICS: { label: string; value: Metric }[] = [
  { label: 'Sessions', value: 'sessions' },
  { label: 'Duration', value: 'duration' },
  { label: 'Weight', value: 'weight' },
  { label: 'Mood', value: 'mood' },
  { label: 'Energy', value: 'energy' },
];

const MOOD_EMOJI_SCALE: Record<number, string> = { 1: '😩', 2: '😔', 3: '😐', 4: '🙂', 5: '😄' };
const ENERGY_EMOJI_SCALE: Record<number, string> = { 1: '🪫', 2: '🔋', 3: '⚡' };

function formatYLabel(metric: Metric) {
  return (value: string) => {
    const n = Number(value);
    if (metric === 'duration') return `${n}m`;
    if (metric === 'weight') return `${n}kg`;
    return String(n);
  };
}

function formatSummary(metric: Metric, data: number[]): string {
  const nonZero = data.filter((v) => v > 0);
  if (nonZero.length === 0) return '';

  switch (metric) {
    case 'sessions': {
      const total = data.reduce((a, b) => a + b, 0);
      return `${total} session${total !== 1 ? 's' : ''}`;
    }
    case 'duration': {
      const total = data.reduce((a, b) => a + b, 0);
      const h = Math.floor(total / 60);
      const m = total % 60;
      return h > 0 ? `${h}h ${m}m total` : `${m}m total`;
    }
    case 'weight': {
      const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
      return `${avg.toFixed(1)} kg avg`;
    }
    case 'mood': {
      const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
      const rounded = Math.round(avg);
      const emoji = MOOD_EMOJI_SCALE[rounded] ?? '😐';
      return `${emoji} ${avg.toFixed(1)} avg`;
    }
    case 'energy': {
      const avg = nonZero.reduce((a, b) => a + b, 0) / nonZero.length;
      const rounded = Math.round(avg);
      const emoji = ENERGY_EMOJI_SCALE[rounded] ?? '🔋';
      return `${emoji} ${avg.toFixed(1)} avg`;
    }
  }
}

export function Dashboard({ refreshKey }: DashboardProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [span, setSpan] = useState<Span>('week');
  const [metric, setMetric] = useState<Metric>('sessions');
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<string[]>([]);
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.getTrends(span, metric);
        if (!cancelled) {
          setLabels(res.labels);
          setData(res.data);
        }
      } catch {
        if (!cancelled) {
          setLabels([]);
          setData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [span, metric, refreshKey]);

  const chartWidth = Dimensions.get('window').width - 80;
  const hasData = data.some((v) => v > 0);

  return (
    <Card variant="elevated">
      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.titleIcon}>📊</Text>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Span selector */}
      <View style={styles.pillRow}>
        {SPANS.map((s) => (
          <TouchableOpacity
            key={s.value}
            onPress={() => setSpan(s.value)}
            style={[styles.pill, span === s.value && { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, span === s.value && { color: colors.primaryText }]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Metric selector */}
      <View style={styles.pillRow}>
        {METRICS.map((m) => (
          <TouchableOpacity
            key={m.value}
            onPress={() => setMetric(m.value)}
            style={[styles.pill, metric === m.value && { backgroundColor: colors.primary }]}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, metric === m.value && { color: colors.primaryText }]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Chart area */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
      ) : !hasData ? (
        <Text style={styles.emptyText}>No data for this period</Text>
      ) : (
        <>
          <LineChart
            data={{
              labels,
              datasets: [{ data: data.map((v) => v || 0) }],
            }}
            width={chartWidth}
            height={200}
            yAxisSuffix=""
            formatYLabel={formatYLabel(metric)}
            chartConfig={{
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalCount: metric === 'weight' ? 1 : 0,
              color: () => colors.primary,
              labelColor: () => colors.textSecondary,
              propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
              propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '' },
            }}
            bezier
            style={styles.chart}
          />

          {/* Summary */}
          <Text style={styles.summary}>{formatSummary(metric, data)}</Text>
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
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
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
    chart: {
      borderRadius: 12,
      marginVertical: 8,
      alignSelf: 'center',
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 14,
      marginVertical: 24,
    },
    summary: {
      textAlign: 'center',
      fontSize: 15,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 4,
    },
  });
}
