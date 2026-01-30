import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, SafeAreaView, View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { SessionStorage } from '../../utils/storage';
import { TrainingSession, SessionSummary } from '../../types/session';

type TimerState = 'idle' | 'round' | 'rest' | 'paused' | 'finished';

interface TimerConfig {
  roundSeconds: number;
  restSeconds: number;
  totalRounds: number;
}

export default function TrainScreen() {
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
      case 'idle': return 'Ready to Train';
      case 'round': return 'Round';
      case 'rest': return 'Rest';
      case 'paused': return 'Paused';
      case 'finished': return 'Training Complete!';
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
      default: return '#34495e';
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
    <SafeAreaView style={styles.container}>
      {/* 状态显示 */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getStateColor() }]}>
          {getStateText()}
        </Text>
        {state !== 'idle' && state !== 'finished' && (
          <Text style={styles.roundText}>
            Round {currentRound} / {config.totalRounds}
          </Text>
        )}
      </View>

      {/* 计时器显示 */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: getStateColor() }]}>
          {state === 'idle' ? formatTime(config.roundSeconds) : formatTime(timeLeft)}
        </Text>
      </View>

      {/* 设置区域 */}
      {state === 'idle' && (
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsTitle}>Settings</Text>
          
          {/* Round Time */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Round Time</Text>
            <View style={styles.settingControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => updateConfig('roundSeconds', -15)}
              >
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.settingValue}>{formatTime(config.roundSeconds)}</Text>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => updateConfig('roundSeconds', 15)}
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rest Time */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Rest Time</Text>
            <View style={styles.settingControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => updateConfig('restSeconds', -15)}
              >
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.settingValue}>{formatTime(config.restSeconds)}</Text>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => updateConfig('restSeconds', 15)}
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Rounds */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Total Rounds</Text>
            <View style={styles.settingControls}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => updateConfig('totalRounds', -1)}
              >
                <Text style={styles.controlButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.settingValue}>{config.totalRounds}</Text>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => updateConfig('totalRounds', 1)}
              >
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        {state === 'idle' && (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start Training</Text>
          </TouchableOpacity>
        )}
        
        {state === 'finished' && (
          <TouchableOpacity style={styles.resetButton} onPress={() => setState('idle')}>
            <Text style={styles.resetButtonText}>New Training</Text>
          </TouchableOpacity>
        )}

        {(state === 'round' || state === 'rest' || state === 'paused') && (
          <View style={styles.activeControls}>
            <TouchableOpacity style={styles.pauseButton} onPress={handlePauseResume}>
              <Text style={styles.pauseButtonText}>
                {state === 'paused' ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.endButton} onPress={handleEnd}>
              <Text style={styles.endButtonText}>End</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 结束确认模态框 */}
      <Modal
        visible={showEndModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>结束训练</Text>
            <Text style={styles.modalText}>确定要结束当前训练吗？</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setShowEndModal(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={confirmEnd}
              >
                <Text style={styles.modalConfirmText}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 训练总结模态框 */}
      <Modal
        visible={showSummaryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <View style={styles.summaryModalOverlay}>
          <View style={styles.summaryModalContent}>
            <Text style={styles.summaryModalTitle}>训练完成！</Text>
            
            {sessionSummary && (
              <View style={styles.summaryDetails}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>开始时间:</Text>
                  <Text style={styles.summaryValue}>
                    {sessionSummary.startedAt.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>结束时间:</Text>
                  <Text style={styles.summaryValue}>
                    {sessionSummary.endedAt.toLocaleTimeString('zh-CN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>回合设置:</Text>
                  <Text style={styles.summaryValue}>
                    {formatTime(sessionSummary.roundSeconds)} / {formatTime(sessionSummary.restSeconds)}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>完成回合:</Text>
                  <Text style={styles.summaryValue}>
                    {sessionSummary.completedRounds} / {sessionSummary.plannedRounds}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>总时长:</Text>
                  <Text style={styles.summaryValue}>
                    {formatDuration(sessionSummary.totalSeconds)}
                  </Text>
                </View>
                
                <View style={styles.noteContainer}>
                  <Text style={styles.noteLabel}>备注 (可选):</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={note}
                    onChangeText={setNote}
                    placeholder="记录今天的训练感受..."
                    multiline={false}
                    maxLength={100}
                  />
                </View>
              </View>
            )}
            
            <View style={styles.summaryModalButtons}>
              <TouchableOpacity 
                style={styles.summaryModalCancelButton} 
                onPress={cancelSave}
              >
                <Text style={styles.summaryModalCancelText}>不保存</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.summaryModalSaveButton} 
                onPress={saveTrainingSession}
              >
                <Text style={styles.summaryModalSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
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
    padding: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  roundText: {
    fontSize: 18,
    color: '#666',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  settingsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingValue: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 20,
  },
  pauseButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  pauseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  endButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    minWidth: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 25,
    textAlign: 'center',
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalCancelButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  summaryModalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
  },
  summaryModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2ecc71',
  },
  summaryDetails: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: 15,
  },
  noteLabel: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  summaryModalButtons: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 20,
  },
  summaryModalCancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryModalCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryModalSaveButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  summaryModalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
