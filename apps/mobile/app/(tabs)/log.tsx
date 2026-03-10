import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme, type ThemeColors } from '@/components/ui';
import { TodayCheckIn } from '@/components/log/TodayCheckIn';
import { WeeklyStats } from '@/components/log/WeeklyStats';
import { TrainingCalendar } from '@/components/log/TrainingCalendar';
import { TrainingHistory } from '@/components/log/TrainingHistory';
import { Dashboard } from '@/components/log/Dashboard';
import {
  useSectionLayout,
  SectionManagerModal,
} from '@/components/log/SectionManager';

export default function LogScreen() {
  const { colors } = useTheme();
  const { sections, setSections, loading } = useSectionLayout();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showManager, setShowManager] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Re-fetch all sections when tab gains focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const renderSection = (id: string) => {
    switch (id) {
      case 'today-checkin':
        return <TodayCheckIn key={id} onRefresh={refresh} />;
      case 'weekly-stats':
        return <WeeklyStats key={id} refreshKey={refreshKey} />;
      case 'training-calendar':
        return <TrainingCalendar key={id} refreshKey={refreshKey} onSelectDate={setSelectedDate} selectedDate={selectedDate} />;
      case 'training-history':
        return <TrainingHistory key={id} refreshKey={refreshKey} selectedDate={selectedDate} />;
      case 'dashboard':
        return <Dashboard key={id} refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Log</Text>
        <TouchableOpacity
          onPress={() => setShowManager(true)}
          activeOpacity={0.6}
          style={styles.gearBtn}
        >
          <FontAwesome name="cog" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Sections */}
      {!loading && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {sections
            .filter((s) => s.visible)
            .map((s) => (
              <View key={s.id} style={styles.sectionWrap}>
                {renderSection(s.id)}
              </View>
            ))}
        </ScrollView>
      )}

      {/* Section Manager Modal */}
      <SectionManagerModal
        visible={showManager}
        onClose={() => setShowManager(false)}
        sections={sections}
        onSectionsChange={setSections}
      />
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    gearBtn: {
      padding: 4,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 80,
    },
    sectionWrap: {
      marginBottom: 16,
    },
  });
}