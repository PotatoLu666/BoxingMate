import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SessionStorage } from '../../utils/storage';
import { TrainingSession, SessionSummary } from '../../types/session';
import { Button, Card, Input, ModalSheet, ConfirmModal, useTheme } from '@/components/ui';

type TimerState = 'idle' | 'round' | 'rest' | 'paused' | 'finished';

interface TimerConfig {
  roundSeconds: number;
  restSeconds: number;
  totalRounds: number;
}

export default function TrainScreen() {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const [state, setState] = useState<TimerState>('idle');
  const [currentRound, setCurrentRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [note, setNote] = useState('');
  const [config, setConfig] = useState<TimerConfig>({
    roundSeconds: 180,
    restSeconds: 60,
    totalRounds: 6,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  // 清理定时器
  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 启动定时器
  const startTimer = () => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // 时间到了，切换状态
          setState((currentState) => {
            if (currentState === 'round') {
              // Round 结束
              if (currentRound >= config.totalRounds) {
                // 最后一回合结束，显示总结
                clearTimer();
                setTimeout(() => showTrainingSummary(), 100);
                return 'finished';
              } else {
                // 进入休息
                setTimeLeft(config.restSeconds);
                return 'rest';
              }
            } else if (currentState === 'rest') {
              // Rest 结束，下一回合
              setCurrentRound((round) => round + 1);
              setTimeLeft(config.roundSeconds);
              return 'round';
            }
            return currentState;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 开始训练
  const handleStart = () => {
    setCurrentRound(1);
    setTimeLeft(config.roundSeconds);
    setState('round');
    sessionStartTimeRef.current = new Date();
  };

  // 暂停/继续
  const handlePauseResume = () => {
    if (state === 'paused') {
      setState(state === 'paused' ? 'round' : 'rest');
    } else {
      setState('paused');
    }
  };

  // 结束训练
  const handleEnd = () => {
    setShowEndModal(true);
  };

  // 确认结束训练
  const confirmEnd = () => {
    clearTimer();
    showTrainingSummary();
    setShowEndModal(false);
  };

  // 显示训练总结
  const showTrainingSummary = () => {
    if (!sessionStartTimeRef.current) return;
    
    const endTime = new Date();
    const startTime = sessionStartTimeRef.current;
    const totalSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    const summary: SessionSummary = {
      roundSeconds: config.roundSeconds,
      restSeconds: config.restSeconds,
      plannedRounds: config.totalRounds,
      completedRounds: currentRound - (state === 'round' ? 0 : 1),
      totalSeconds,
      startedAt: startTime,
      endedAt: endTime,
    };
    
    setSessionSummary(summary);
    setShowSummaryModal(true);
  };

  // 保存训练记录
  const saveTrainingSession = async () => {
    if (!sessionSummary) return;
    
    const session: TrainingSession = {
      id: SessionStorage.generateId(),
      ...sessionSummary,
      note: note.trim() || undefined,
    };
    
    await SessionStorage.saveSession(session);
    
    // 重置状态
    setState('idle');
    setCurrentRound(1);
    setTimeLeft(0);
    setNote('');
    setShowSummaryModal(false);
    setSessionSummary(null);
    sessionStartTimeRef.current = null;
  };

  // 取消保存
  const cancelSave = () => {
    setState('idle');
    setCurrentRound(1);
    setTimeLeft(0);
    setNote('');
    setShowSummaryModal(false);
    setSessionSummary(null);
    sessionStartTimeRef.current = null;
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化总时长
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // 获取状态显示文本
  const getStateText = (): string => {
    switch (state) {
      case 'idle': return t('train.readyToTrain');
      case 'round': return t('train.round');
      case 'rest': return t('train.rest');
      case 'paused': return t('train.paused');
      case 'finished': return t('train.trainingComplete');
      default: return '';
    }
  };

  // 获取状态颜色
  const getStateColor = (): string => {
    switch (state) {
      case 'round': return '#e74c3c';
      case 'rest': return '#2ecc71';
      case 'paused': return '#f39c12';
      case 'finished': return '#9b59b6';
      default: return colors.text;
    }
  };

  // 设置配置
  const updateConfig = (key: keyof TimerConfig, delta: number) => {
    if (state !== 'idle') return;

    setConfig(prev => {
      const newValue = prev[key] + delta;
      
      if (key === 'roundSeconds') {
        return { ...prev, [key]: Math.max(30, newValue) };
      } else if (key === 'restSeconds') {
        return { ...prev, [key]: Math.max(0, newValue) };
      } else if (key === 'totalRounds') {
        return { ...prev, [key]: Math.max(1, Math.min(20, newValue)) };
      }
      
      return prev;
    });
  };

  // 启动/停止定时器效果
  useEffect(() => {
    if (state === 'round' || state === 'rest') {
      startTimer();
    } else {
      clearTimer();
    }

    return () => clearTimer();
  }, [state]);

  // 组件卸载时清理
  useEffect(() => {
    return () => clearTimer();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status */}
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 2,
              color: getStateColor(),
            }}
          >
            {getStateText()}
          </Text>
          {state !== 'idle' && state !== 'finished' && (
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>
              {t('train.roundOf', { current: currentRound, total: config.totalRounds })}
            </Text>
          )}
        </View>

        {/* Timer */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 260,
              height: 260,
              borderRadius: 130,
              borderWidth: 6,
              borderColor: getStateColor(),
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            }}
          >
            <Text
              style={{
                fontSize: 80,
                fontWeight: '200',
                fontFamily: 'monospace',
                color: getStateColor(),
                letterSpacing: 2,
              }}
            >
              {state === 'idle' ? formatTime(config.roundSeconds) : formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Settings */}
        {state === 'idle' && (
          <Card style={{ marginBottom: 24 }} variant="elevated">
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: colors.primary,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              {t('train.settings')}
            </Text>

            {[
              { label: t('train.roundTime'), key: 'roundSeconds' as const, delta: 15, display: formatTime(config.roundSeconds) },
              { label: t('train.restTime'), key: 'restSeconds' as const, delta: 15, display: formatTime(config.restSeconds) },
              { label: t('train.totalRounds'), key: 'totalRounds' as const, delta: 1, display: String(config.totalRounds) },
            ].map((item, idx) => (
              <View
                key={item.key}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  ...(idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}),
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                  {item.label}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => updateConfig(item.key, -item.delta)}
                    activeOpacity={0.6}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: colors.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>−</Text>
                  </TouchableOpacity>
                  <Text
                    style={{
                      marginHorizontal: 16,
                      fontSize: 17,
                      fontWeight: '700',
                      color: colors.text,
                      minWidth: 50,
                      textAlign: 'center',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {item.display}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateConfig(item.key, item.delta)}
                    activeOpacity={0.6}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primaryText }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Card>
        )}

        {/* Controls */}
        <View style={{ gap: 12, marginTop: state === 'idle' ? 0 : 'auto', paddingBottom: 16 }}>
          {state === 'idle' && (
            <Button title={t('train.startTraining')} onPress={handleStart} size="lg" fullWidth />
          )}

          {state === 'finished' && (
            <Button
              title={t('train.newTraining')}
              onPress={() => setState('idle')}
              variant="outline"
              size="lg"
              fullWidth
            />
          )}

          {(state === 'round' || state === 'rest' || state === 'paused') && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title={state === 'paused' ? t('train.resume') : t('train.pause')}
                  onPress={handlePauseResume}
                  variant="secondary"
                  size="lg"
                  style={{ backgroundColor: colors.warning }}
                  textStyle={{ color: isDark ? '#1a1a1a' : '#FFFFFF' }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={t('train.end')}
                  onPress={handleEnd}
                  variant="danger"
                  size="lg"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* End confirmation */}
      <ConfirmModal
        visible={showEndModal}
        onClose={() => setShowEndModal(false)}
        onConfirm={confirmEnd}
        title={t('train.endTraining')}
        message={t('train.endTrainingConfirm')}
        confirmText={t('train.confirm')}
        cancelText={t('train.cancel')}
        confirmVariant="danger"
      />

      {/* Training summary */}
      <ModalSheet
        visible={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        title={t('train.summaryTitle')}
      >
        {sessionSummary && (
          <View style={{ marginBottom: 16 }}>
            {[
              {
                label: t('train.startTime'),
                value: sessionSummary.startedAt.toLocaleTimeString(
                  i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US',
                  { hour: '2-digit', minute: '2-digit' },
                ),
              },
              {
                label: t('train.endTime'),
                value: sessionSummary.endedAt.toLocaleTimeString(
                  i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US',
                  { hour: '2-digit', minute: '2-digit' },
                ),
              },
              {
                label: t('train.roundSetting'),
                value: `${formatTime(sessionSummary.roundSeconds)} / ${formatTime(sessionSummary.restSeconds)}`,
              },
              {
                label: t('train.completedRounds'),
                value: `${sessionSummary.completedRounds} / ${sessionSummary.plannedRounds}`,
              },
              {
                label: t('train.totalDuration'),
                value: formatDuration(sessionSummary.totalSeconds),
              },
            ].map((row, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 10,
                  ...(idx > 0 ? { borderTopWidth: 1, borderTopColor: colors.border } : {}),
                }}
              >
                <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>
                  {row.label}
                </Text>
                <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700' }}>
                  {row.value}
                </Text>
              </View>
            ))}

            <View style={{ marginTop: 16 }}>
              <Input
                label={t('train.noteLabel')}
                value={note}
                onChangeText={setNote}
                placeholder={t('train.notePlaceholder')}
                placeholderTextColor={colors.textMuted}
                multiline={false}
                maxLength={100}
              />
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button title={t('train.discard')} onPress={cancelSave} variant="secondary" size="lg" fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t('train.save')} onPress={saveTrainingSession} size="lg" fullWidth />
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
