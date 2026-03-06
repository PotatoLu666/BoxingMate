import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Button, useTheme } from '@/components/ui';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyEmail, resendCode, login } = useAuth();
  const { colors } = useTheme();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      await verifyEmail(email, code);
      router.replace('/(auth)/login');
    } catch (err) {
      if (err instanceof Error) {
        setError(t('auth.verifyError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    try {
      await resendCode(email);
      setCooldown(60);
    } catch {
      // silently fail
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', padding: 24 }}
      >
        <Text style={{ fontSize: 36, fontWeight: '900', textAlign: 'center', color: colors.text, marginBottom: 8 }}>
          🥊
        </Text>
        <Text style={{ fontSize: 32, fontWeight: '900', textAlign: 'center', color: colors.text, marginBottom: 8, letterSpacing: 1 }}>
          {t('auth.verifyTitle')}
        </Text>
        <View style={{ width: 40, height: 4, backgroundColor: colors.primary, borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
        <Text style={{ fontSize: 15, textAlign: 'center', color: colors.textSecondary, marginBottom: 32, lineHeight: 22 }}>
          {t('auth.verifySubtitle', { email })}
        </Text>

        {error ? (
          <Text style={{ color: colors.danger, textAlign: 'center', marginBottom: 16, fontSize: 14, fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <TextInput
            style={{
              backgroundColor: colors.inputBg,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 12,
              padding: 18,
              fontSize: 28,
              letterSpacing: 12,
              fontWeight: '900',
              color: colors.text,
              textAlign: 'center',
              fontVariant: ['tabular-nums'],
            }}
            placeholder={t('auth.codePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />
        </View>

        <Button
          title={t('auth.verifyButton')}
          onPress={handleVerify}
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading || code.length !== 6}
        />

        <View style={{ marginTop: 20 }}>
          <Button
            title={cooldown > 0 ? t('auth.resendIn', { seconds: cooldown }) : t('auth.resendCode')}
            onPress={handleResend}
            variant="ghost"
            size="md"
            disabled={cooldown > 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
