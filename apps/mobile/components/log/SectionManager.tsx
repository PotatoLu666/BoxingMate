import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme, type ThemeColors } from '@/components/ui';

// ─── Types ──────────────────────────────────────────────

export interface SectionConfig {
  id: 'today-checkin' | 'weekly-stats' | 'training-calendar' | 'training-history' | 'dashboard';
  label: string;
  icon: string;
  visible: boolean;
  locked: boolean;
}

const STORAGE_KEY = 'log_section_layout';

const DEFAULT_SECTIONS: SectionConfig[] = [
  { id: 'today-checkin', label: "Today's Check-in", icon: 'check-circle', visible: true, locked: false },
  { id: 'dashboard', label: 'Dashboard', icon: 'line-chart', visible: true, locked: false },
  { id: 'weekly-stats', label: 'Weekly Statistics', icon: 'bar-chart', visible: true, locked: false },
  { id: 'training-calendar', label: 'Training Calendar', icon: 'calendar', visible: true, locked: false },
  { id: 'training-history', label: 'Training History', icon: 'history', visible: true, locked: true },
];

// ─── Hook ───────────────────────────────────────────────

export function useSectionLayout() {
  const [sections, setSectionsState] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: SectionConfig[] = JSON.parse(raw);
          const knownIds = new Set(stored.map((s) => s.id));
          const merged = [
            ...stored,
            ...DEFAULT_SECTIONS.filter((d) => !knownIds.has(d.id)),
          ];
          setSectionsState(merged);
        }
      } catch {
        // fall back to defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setSections = useCallback(
    (next: SectionConfig[] | ((prev: SectionConfig[]) => SectionConfig[])) => {
      setSectionsState((prev) => {
        const value = typeof next === 'function' ? next(prev) : next;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value)).catch(() => {});
        return value;
      });
    },
    [],
  );

  return { sections, setSections, loading };
}

// ─── Modal ──────────────────────────────────────────────

interface SectionManagerModalProps {
  visible: boolean;
  onClose: () => void;
  sections: SectionConfig[];
  onSectionsChange: (sections: SectionConfig[]) => void;
}

export function SectionManagerModal({
  visible,
  onClose,
  sections,
  onSectionsChange,
}: SectionManagerModalProps) {
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors, isDark);

  const handleToggle = (id: string) => {
    const updated = sections.map((s) =>
      s.id === id && !s.locked ? { ...s, visible: !s.visible } : s,
    );
    onSectionsChange(updated);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<SectionConfig>) => (
    <ScaleDecorator>
      <TouchableOpacity
        activeOpacity={0.7}
        onLongPress={drag}
        disabled={isActive}
        style={[styles.row, isActive && styles.rowActive]}
      >
        <TouchableOpacity onPressIn={drag} style={styles.dragHandle}>
          <FontAwesome name="bars" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <FontAwesome
          name={item.icon as any}
          size={18}
          color={item.visible ? colors.primary : colors.textMuted}
          style={styles.sectionIcon}
        />

        <Text
          style={[styles.label, !item.visible && { color: colors.textMuted }]}
          numberOfLines={1}
        >
          {item.label}
        </Text>

        {item.locked ? (
          <FontAwesome
            name="lock"
            size={14}
            color={colors.textMuted}
            style={{ marginLeft: 'auto' }}
          />
        ) : (
          <Switch
            value={item.visible}
            onValueChange={() => handleToggle(item.id)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
            style={{ marginLeft: 'auto' }}
          />
        )}
      </TouchableOpacity>
    </ScaleDecorator>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Customize Sections</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
              <FontAwesome name="times" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            Long-press and drag to reorder. Toggle to show or hide sections.
          </Text>

          <DraggableFlatList
            data={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onDragEnd={({ data }) => onSectionsChange(data)}
            containerStyle={{ flexGrow: 0 }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ─────────────────────────────────────────────

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: isDark ? colors.surface : colors.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 36,
      maxHeight: '70%',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    hint: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    rowActive: {
      opacity: 0.9,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    dragHandle: {
      padding: 4,
      marginRight: 12,
    },
    sectionIcon: {
      width: 22,
      textAlign: 'center',
      marginRight: 10,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      flexShrink: 1,
    },
  });
}
