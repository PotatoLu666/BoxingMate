import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode, type ThemeMode } from '../../contexts/ThemeContext';
import { api } from '../../utils/api';
import { Button, Card, Input, ConfirmModal, useTheme, type ThemeColors } from '@/components/ui';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const GENDER_OPTIONS = ['male', 'female', 'other'] as const;
const GENDER_LABELS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' };
const FIGHT_STYLE_OPTIONS = ['boxing', 'muay_thai', 'mma', 'kickboxing', 'other'] as const;
const FIGHT_STYLE_LABELS: Record<string, string> = {
  boxing: 'Boxing',
  muay_thai: 'Muay Thai',
  mma: 'MMA',
  kickboxing: 'Kickboxing',
  other: 'Other',
};

function SectionLabel({ label, colors }: { label: string; colors: ThemeColors }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
      }}
    >
      {label}
    </Text>
  );
}

function PillSelector({
  options,
  value,
  onSelect,
  colors,
  labels,
}: {
  options: readonly string[];
  value: string | null;
  onSelect: (v: string) => void;
  colors: ThemeColors;
  labels?: Record<string, string>;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => {
        const isActive = value === option;
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.7}
            onPress={() => onSelect(option)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderRadius: 20,
              backgroundColor: isActive ? colors.primary : colors.surfaceAlt,
              borderWidth: isActive ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: isActive ? '#FFFFFF' : colors.textSecondary,
              }}
            >
              {labels?.[option] ?? option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { mode, setMode } = useThemeMode();
  const { user, logout, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [gym, setGym] = useState(user?.gym || '');
  const [height, setHeight] = useState(user?.height?.toString() || '');
  const [weight, setWeight] = useState(user?.weight?.toString() || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState<string | null>(user?.gender || null);
  const [fightStyle, setFightStyle] = useState<string | null>(user?.fightStyle || null);
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setNickname(user?.nickname || '');
    setBio(user?.bio || '');
    setCity(user?.city || '');
    setGym(user?.gym || '');
    setHeight(user?.height?.toString() || '');
    setWeight(user?.weight?.toString() || '');
    setAge(user?.age?.toString() || '');
    setGender(user?.gender || null);
    setFightStyle(user?.fightStyle || null);
    setAvatarUri(user?.avatarUrl || null);
  }, [user]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${asset.base64}`;
        setAvatarUri(dataUri);
      }
    }
  };

  const parseNum = (v: string): number | undefined => {
    const n = Number(v);
    return v.trim() && !isNaN(n) ? n : undefined;
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.updateProfile({
        name: name.trim() || undefined,
        nickname: nickname.trim() || undefined,
        avatarUrl: avatarUri || undefined,
        height: parseNum(height),
        weight: parseNum(weight),
        age: parseNum(age),
        gender: gender || undefined,
        fightStyle: fightStyle || undefined,
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        gym: gym.trim() || undefined,
      });
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

  const profileComplete = user?.profileComplete ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar section */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <TouchableOpacity activeOpacity={0.7} onPress={pickAvatar}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  marginBottom: 14,
                }}
              />
            ) : (
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
            )}
            <View
              style={{
                position: 'absolute',
                bottom: 12,
                right: -4,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: colors.bg,
              }}
            >
              <FontAwesome name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

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

          <Text style={{ fontSize: 15, color: colors.textSecondary }}>
            {user?.email}
          </Text>
        </View>

        {/* Profile completeness */}
        {profileComplete < 100 && (
          <Card variant="elevated" style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Complete your profile — {profileComplete}%
            </Text>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.surfaceAlt,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${profileComplete}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                }}
              />
            </View>
          </Card>
        )}

        {/* Personal Info */}
        <Card variant="elevated" style={{ marginBottom: 24 }}>
          <SectionLabel label="Personal Info" colors={colors} />

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
            style={{ fontSize: 16, color: colors.text, marginBottom: 20 }}
          >
            {user?.email}
          </Text>

          <Input
            label={t('profile.nameLabel')}
            value={name}
            onChangeText={setName}
            placeholder={t('profile.namePlaceholder')}
          />
          <Input
            label="Nickname"
            value={nickname}
            onChangeText={setNickname}
            placeholder="Your ring name"
          />
          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={3}
            style={{ minHeight: 72, textAlignVertical: 'top' }}
          />
          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="Where are you based?"
          />
          <Input
            label="Gym"
            value={gym}
            onChangeText={setGym}
            placeholder="Your training gym"
            containerStyle={{ marginBottom: 0 }}
          />
        </Card>

        {/* Physical Stats */}
        <Card variant="elevated" style={{ marginBottom: 24 }}>
          <SectionLabel label="Physical Stats" colors={colors} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Height (cm)"
                value={height}
                onChangeText={setHeight}
                placeholder="175"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                keyboardType="numeric"
              />
            </View>
          </View>

          <Input
            label="Age"
            value={age}
            onChangeText={setAge}
            placeholder="25"
            keyboardType="numeric"
            containerStyle={{ marginBottom: 0 }}
          />
        </Card>

        {/* Boxing Info */}
        <Card variant="elevated" style={{ marginBottom: 24 }}>
          <SectionLabel label="Boxing Info" colors={colors} />

          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Gender
          </Text>
          <PillSelector
            options={GENDER_OPTIONS}
            value={gender}
            onSelect={setGender}
            colors={colors}
            labels={GENDER_LABELS}
          />

          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            Fight Style
          </Text>
          <PillSelector
            options={FIGHT_STYLE_OPTIONS}
            value={fightStyle}
            onSelect={setFightStyle}
            colors={colors}
            labels={FIGHT_STYLE_LABELS}
          />
        </Card>

        {/* Save */}
        <Button
          title={saved ? t('profile.saved') : t('profile.saveButton')}
          onPress={handleSave}
          variant="primary"
          loading={saving}
          disabled={saving}
          fullWidth
        />

        {/* Theme switcher */}
        <Card variant="elevated" style={{ marginTop: 24, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 12,
            }}
          >
            {t('profile.theme')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((option) => {
              const isActive = mode === option;
              const icons: Record<ThemeMode, React.ComponentProps<typeof FontAwesome>['name']> = {
                system: 'mobile-phone',
                light: 'sun-o',
                dark: 'moon-o',
              };
              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.7}
                  onPress={() => setMode(option)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor: isActive ? colors.primary : colors.surfaceAlt,
                    borderWidth: isActive ? 0 : 1,
                    borderColor: colors.border,
                  }}
                >
                  <FontAwesome
                    name={icons[option]}
                    size={18}
                    color={isActive ? '#FFFFFF' : colors.textSecondary}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                    }}
                  >
                    {t(`profile.theme_${option}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Logout */}
        <Button
          title={t('profile.logout')}
          onPress={() => setShowLogoutModal(true)}
          variant="outline"
          fullWidth
          textStyle={{ color: colors.danger }}
          style={{ borderColor: colors.danger }}
        />
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
