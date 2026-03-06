#!/usr/bin/env python3
"""Restyle the Train screen with themed UI components."""

import os

filepath = r'Q:\Repos\private\BoxingMate\apps\mobile\app\(tabs)\index.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix imports
content = content.replace(
    "import { StyleSheet, SafeAreaView, View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';",
    "import { SafeAreaView, View, Text, TouchableOpacity } from 'react-native';\nimport { Button, Card, Input, ModalSheet, ConfirmModal, useTheme } from '@/components/ui';"
)

# 2. Add useTheme
content = content.replace(
    "  const { t, i18n } = useTranslation();\n  const [state, setState] = useState<TimerState>('idle');",
    "  const { t, i18n } = useTranslation();\n  const { colors, isDark } = useTheme();\n  const [state, setState] = useState<TimerState>('idle');"
)

# 3. Replace from 'return (' to end of file
return_marker = '  return (\n'
idx = content.index(return_marker)

new_tail = """  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Status */}
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '800',
            color: getStateColor(),
            textTransform: 'uppercase',
            letterSpacing: 4,
          }}>
            {getStateText()}
          </Text>
          {state !== 'idle' && state !== 'finished' && (
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 6 }}>
              {t('train.roundOf', { current: currentRound, total: config.totalRounds })}
            </Text>
          )}
        </View>

        {/* Timer Display */}
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: state === 'idle' ? 32 : 48 }}>
          <View style={{
            width: 260,
            height: 260,
            borderRadius: 130,
            borderWidth: 5,
            borderColor: getStateColor(),
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
          }}>
            <Text style={{
              fontSize: 80,
              fontWeight: '200',
              color: getStateColor(),
              fontFamily: 'monospace',
              fontVariant: ['tabular-nums'],
            }}>
              {state === 'idle' ? formatTime(config.roundSeconds) : formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Settings */}
        {state === 'idle' && (
          <Card variant="elevated" style={{ marginBottom: 24, padding: 20 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '800',
              color: colors.textMuted,
              textAlign: 'center',
              marginBottom: 20,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}>
              {t('train.settings')}
            </Text>

            {/* Round Time */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textSecondary }}>{t('train.roundTime')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => updateConfig('roundSeconds', -15)}
                >
                  <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: 'bold' }}>{String.fromCharCode(8722)}</Text>
                </TouchableOpacity>
                <Text style={{ marginHorizontal: 14, fontSize: 18, fontWeight: '700', color: colors.text, minWidth: 60, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                  {formatTime(config.roundSeconds)}
                </Text>
                <TouchableOpacity
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => updateConfig('roundSeconds', 15)}
                >
                  <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rest Time */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textSecondary }}>{t('train.restTime')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => updateConfig('restSeconds', -15)}
                >
                  <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: 'bold' }}>{String.fromCharCode(8722)}</Text>
                </TouchableOpacity>
                <Text style={{ marginHorizontal: 14, fontSize: 18, fontWeight: '700', color: colors.text, minWidth: 60, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                  {formatTime(config.restSeconds)}
                </Text>
                <TouchableOpacity
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => updateConfig('restSeconds', 15)}
                >
                  <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Rounds */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textSecondary }}>{t('train.totalRounds')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => updateConfig('totalRounds', -1)}
                >
                  <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: 'bold' }}>{String.fromCharCode(8722)}</Text>
                </TouchableOpacity>
                <Text style={{ marginHorizontal: 14, fontSize: 18, fontWeight: '700', color: colors.text, minWidth: 60, textAlign: 'center' }}>
                  {config.totalRounds}
                </Text>
                <TouchableOpacity
                  style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => updateConfig('totalRounds', 1)}
                >
                  <Text style={{ color: colors.primaryText, fontSize: 20, fontWeight: 'bold' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}

        {/* Spacer to push controls to bottom when active */}
        {state !== 'idle' && <View style={{ flex: 1 }} />}

        {/* Controls */}
        <View style={{ paddingBottom: 24 }}>
          {state === 'idle' && (
            <Button title={t('train.startTraining')} onPress={handleStart} variant="primary" size="lg" fullWidth />
          )}

          {state === 'finished' && (
            <Button title={t('train.newTraining')} onPress={() => setState('idle')} variant="secondary" size="lg" fullWidth />
          )}

          {(state === 'round' || state === 'rest' || state === 'paused') && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title={state === 'paused' ? t('train.resume') : t('train.pause')}
                  onPress={handlePauseResume}
                  variant="secondary"
                  size="lg"
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button title={t('train.end')} onPress={handleEnd} variant="danger" size="lg" fullWidth />
              </View>
            </View>
          )}
        </View>
      </View>

      {/* End Confirmation */}
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

      {/* Training Summary */}
      <ModalSheet
        visible={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        title={t('train.summaryTitle')}
      >
        {sessionSummary && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('train.startTime')}</Text>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                {sessionSummary.startedAt.toLocaleTimeString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('train.endTime')}</Text>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                {sessionSummary.endedAt.toLocaleTimeString(i18n.language === 'zh-CN' ? 'zh-CN' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('train.roundSetting')}</Text>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                {formatTime(sessionSummary.roundSeconds)} / {formatTime(sessionSummary.restSeconds)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('train.completedRounds')}</Text>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                {sessionSummary.completedRounds} / {sessionSummary.plannedRounds}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, marginBottom: 16 }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, fontWeight: '500' }}>{t('train.totalDuration')}</Text>
              <Text style={{ fontSize: 15, color: colors.text, fontWeight: '600' }}>
                {formatDuration(sessionSummary.totalSeconds)}
              </Text>
            </View>

            <Input
              label={t('train.noteLabel')}
              value={note}
              onChangeText={setNote}
              placeholder={t('train.notePlaceholder')}
              multiline={false}
              maxLength={100}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <View style={{ flex: 1 }}>
            <Button title={t('train.discard')} onPress={cancelSave} variant="outline" size="lg" fullWidth />
          </View>
          <View style={{ flex: 1 }}>
            <Button title={t('train.save')} onPress={saveTrainingSession} variant="primary" size="lg" fullWidth />
          </View>
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
"""

content = content[:idx] + new_tail

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Done! File rewritten successfully.')
# Count lines
lines = content.count('\n') + 1
print(f'New file: {lines} lines, {len(content)} chars')
