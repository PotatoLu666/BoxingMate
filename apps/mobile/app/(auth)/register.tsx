import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, useTheme } from '@/components/ui';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, name.trim() || undefined);
      router.push({ pathname: '/(auth)/verify-email', params: { email: email.trim().toLowerCase() } });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message.includes('network') ? t('auth.networkError') : t('auth.registerError'));
      }
    } finally {
      setLoading(false);
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
        <Text style={{ fontSize: 32, fontWeight: '900', textAlign: 'center', color: colors.text, marginBottom: 6, letterSpacing: 1 }}>
          {t('auth.register')}
        </Text>
        <View style={{ width: 40, height: 4, backgroundColor: colors.primary, borderRadius: 2, alignSelf: 'center', marginBottom: 32 }} />

        {error ? (
          <Text style={{ color: colors.danger, textAlign: 'center', marginBottom: 16, fontSize: 14, fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}

        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 24 }}>
          <Input
            label={t('auth.namePlaceholder')}
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
          />
          <Input
            label={t('auth.emailPlaceholder')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label={t('auth.passwordPlaceholder')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            containerStyle={{ marginBottom: 0 }}
          />
        </View>

        <Button
          title={t('auth.registerButton')}
          onPress={handleRegister}
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading || !email || password.length < 6}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 15 }}>{t('auth.hasAccount')} </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
