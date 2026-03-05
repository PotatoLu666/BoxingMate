import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  SafeAreaView, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Modal,
  ScrollView 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SessionStorage } from '../../utils/storage';
import { TrainingSession } from '../../types/session';

export default function LogScreen() {
  const { t, i18n } = useTranslation();
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
    <TouchableOpacity style={styles.sessionItem} onPress={() => showDetails(item)}>
      <View style={styles.sessionHeader}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{formatDate(item.startedAt)}</Text>
          <Text style={styles.timeText}>{formatTime(item.startedAt)}</Text>
        </View>
        <View style={styles.durationContainer}>
          <Text style={styles.durationText}>{formatDuration(item.totalSeconds)}</Text>
        </View>
      </View>
      
      <View style={styles.sessionDetails}>
        <Text style={styles.roundsText}>
          {t('log.rounds', { completed: item.completedRounds, planned: item.plannedRounds })}
        </Text>
        <Text style={styles.settingText}>
          {formatSettingTime(item.roundSeconds)} / {formatSettingTime(item.restSeconds)}
        </Text>
      </View>
      
      {item.note && (
        <Text style={styles.notePreview} numberOfLines={1}>
          {item.note}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('log.title')}</Text>
        <Text style={styles.subtitle}>{t('log.recentCount', { count: sessions.length })}</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('log.emptyTitle')}</Text>
          <Text style={styles.emptySubtext}>{t('log.emptySubtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          style={styles.sessionsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 详情模态框 */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.detailModalTitle}>{t('log.detailTitle')}</Text>
              
              {selectedSession && (
                <View style={styles.detailContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>{t('log.timeInfo')}</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('log.date')}</Text>
                      <Text style={styles.detailValue}>
                        {selectedSession.startedAt.toLocaleDateString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US')}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('log.start')}</Text>
                      <Text style={styles.detailValue}>
                        {formatTime(selectedSession.startedAt)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('log.endLabel')}</Text>
                      <Text style={styles.detailValue}>
                        {formatTime(selectedSession.endedAt)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('log.duration')}</Text>
                      <Text style={styles.detailValue}>
                        {formatDuration(selectedSession.totalSeconds)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.sectionTitle}>{t('log.trainingSetting')}</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('log.roundTimeLabel')}</Text>
                      <Text style={styles.detailValue}>
                        {formatSettingTime(selectedSession.roundSeconds)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('log.restTimeLabel')}</Text>
                      <Text style={styles.detailValue}>
                        {formatSettingTime(selectedSession.restSeconds)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('log.plannedRounds')}</Text>
                      <Text style={styles.detailValue}>
                        {selectedSession.plannedRounds}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('log.completedRoundsLabel')}</Text>
                      <Text style={styles.detailValue}>
                        {selectedSession.completedRounds}
                      </Text>
                    </View>
                  </View>

                  {selectedSession.note && (
                    <View style={styles.detailSection}>
                      <Text style={styles.sectionTitle}>{t('log.note')}</Text>
                      <Text style={styles.noteText}>{selectedSession.note}</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowDetailModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('log.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 22,
  },
  sessionsList: {
    flex: 1,
    padding: 20,
  },
  sessionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  durationContainer: {
    alignItems: 'flex-end',
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roundsText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  settingText: {
    fontSize: 14,
    color: '#777',
  },
  notePreview: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  detailModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  detailContent: {
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2ecc71',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  noteText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});