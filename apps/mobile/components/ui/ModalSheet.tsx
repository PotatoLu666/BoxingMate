import React from 'react';
import { View, Text, Modal, TouchableOpacity, type ViewStyle } from 'react-native';
import { useTheme } from './theme';

interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function ModalSheet({ visible, onClose, title, children, contentStyle }: ModalSheetProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            {
              backgroundColor: colors.bg,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              maxHeight: '85%',
            },
            contentStyle,
          ]}
        >
          {title && (
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                color: colors.text,
                textAlign: 'center',
                marginBottom: 20,
              }}
            >
              {title}
            </Text>
          )}
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText: string;
  cancelText: string;
  confirmVariant?: 'danger' | 'primary';
}

export function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = 'danger',
}: ConfirmModalProps) {
  const { colors } = useTheme();

  const confirmBg = confirmVariant === 'danger' ? colors.danger : colors.primary;

  return (
    <ModalSheet visible={visible} onClose={onClose}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '800',
          color: colors.text,
          textAlign: 'center',
          marginBottom: message ? 8 : 24,
        }}
      >
        {title}
      </Text>
      {message && (
        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          {message}
        </Text>
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>
            {cancelText}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onConfirm}
          activeOpacity={0.7}
          style={{
            flex: 1,
            backgroundColor: confirmBg,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
            {confirmText}
          </Text>
        </TouchableOpacity>
      </View>
    </ModalSheet>
  );
}
