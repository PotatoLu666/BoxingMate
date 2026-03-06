import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { Button, Card, Input, ConfirmModal, useTheme } from '@/components/ui';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, logout, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.updateProfile({ name: name.trim() || undefined });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const initials = (
    (user?.name?.[0]) || (user?.email?.[0]) || '?'
  ).toUpperCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with avatar */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Text style={{ fontSize: 36, fontWeight: '700', color: '#fff' }}>
              {initials}
            </Text>
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.text,
              marginBottom: 4,
            }}
          >
            {t('profile.title')}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
            }}
          >
            {user?.email}
          </Text>
        </View>

        {/* Profile info card */}
        <Card variant="elevated" style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 4,
            }}
          >
            {t('profile.emailLabel')}
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: colors.text,
              marginBottom: 20,
            }}
          >
            {user?.email}
          </Text>

          <Input
            label={t('profile.nameLabel')}
            value={name}
            onChangeText={setName}
            placeholder={t('profile.namePlaceholder')}
            placeholderTextColor={colors.textMuted}
          />
        </Card>

        {/* Actions */}
        <Button
          title={saved ? t('profile.saved') : t('profile.saveButton')}
          onPress={handleSave}
          variant="primary"
          loading={saving}
          disabled={saving}
          fullWidth
        />

        <View style={{ marginTop: 16 }}>
          <Button
            title={t('profile.logout')}
            onPress={() => setShowLogoutModal(true)}
            variant="outline"
            fullWidth
            textStyle={{ color: colors.danger }}
            style={{ borderColor: colors.danger }}
          />
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        title={t('profile.logoutConfirm')}
        confirmText={t('profile.confirm')}
        cancelText={t('profile.cancel')}
        confirmVariant="danger"
      />
    </SafeAreaView>
  );
}
