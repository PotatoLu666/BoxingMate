import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SessionStorage } from '../../utils/storage';
import { TrainingSession } from '../../types/session';
import { Card, Button, ModalSheet, useTheme } from '@/components/ui';

export default function LogScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 加载训练记录
  const loadSessions = async () => {
    const recentSessions = await SessionStorage.getRecentSessions(20);
    setSessions(recentSessions);
  };

  useEffect(() => {
    // 页面加载时获取数据
    loadSessions();
  }, []);

  // 刷新数据（当页面获得焦点时）
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      loadSessions();
    }, 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // 格式化日期
  const formatDate = (date: Date): string => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const locale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';

    if (sessionDate.getTime() === today.getTime()) {
      return t('log.today');
    } else if (sessionDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return t('log.yesterday');
    } else {
      return date.toLocaleDateString(locale, { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // 格式化时间
  const formatTime = (date: Date): string => {
    const locale = i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US';
    return date.toLocaleTimeString(locale, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 格式化总时长
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // 格式化设置时间
  const formatSettingTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 显示详情
  const showDetails = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  // 渲染单个session
  const renderSession = ({ item }: { item: TrainingSession }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => showDetails(item)}>
      <Card variant="elevated" style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{formatDate(item.startedAt)}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 3 }}>{formatTime(item.startedAt)}</Text>
          </View>
          <View style={{ backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: colors.success, letterSpacing: 0.5 }}>{formatDuration(item.totalSeconds)}</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 10 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>
            {t('log.rounds', { completed: item.completedRounds, planned: item.plannedRounds })}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>
            {formatSettingTime(item.roundSeconds)} / {formatSettingTime(item.restSeconds)}
          </Text>
        </View>

        {item.note && (
          <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic', marginTop: 8 }} numberOfLines={1}>
            {item.note}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>{t('log.title')}</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{t('log.recentCount', { count: sessions.length })}</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🥊</Text>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textSecondary, marginBottom: 8 }}>{t('log.emptyTitle')}</Text>
          <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22 }}>{t('log.emptySubtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 详情模态框 */}
      <ModalSheet
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={t('log.detailTitle')}
      >
        {selectedSession && (
          <View style={{ paddingBottom: 8 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{t('log.timeInfo')}</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('log.date')}</Text>
                  <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                    {selectedSession.startedAt.toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US')}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('log.start')}</Text>
                  <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                    {formatTime(selectedSession.startedAt)}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('log.endLabel')}</Text>
                  <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                    {formatTime(selectedSession.endedAt)}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('log.duration')}</Text>
                  <Text style={{ fontSize: 16, color: colors.success, fontWeight: '800' }}>
                    {formatDuration(selectedSession.totalSeconds)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{t('log.trainingSetting')}</Text>
              <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('log.roundTimeLabel')}</Text>
                  <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                    {formatSettingTime(selectedSession.roundSeconds)}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('log.restTimeLabel')}</Text>
                  <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                    {formatSettingTime(selectedSession.restSeconds)}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('log.plannedRounds')}</Text>
                  <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                    {selectedSession.plannedRounds}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('log.completedRoundsLabel')}</Text>
                  <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                    {selectedSession.completedRounds}
                  </Text>
                </View>
              </View>
            </View>

            {selectedSession.note && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{t('log.note')}</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14 }}>
                  <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>{selectedSession.note}</Text>
                </View>
              </View>
            )}

            <Button
              title={t('log.close')}
              onPress={() => setShowDetailModal(false)}
              variant="primary"
              size="lg"
              fullWidth
            />
          </View>
        )}
      </ModalSheet>
    </SafeAreaView>
  );
}