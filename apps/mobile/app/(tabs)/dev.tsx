import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { View, Text, Button } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function DevScreen() {
  const { t } = useTranslation();
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const pingAPI = async () => {
    setLoading(true);
    setResult(t('dev.loading'));
    
    try {
      // 替换为你的实际 IP 地址
      const response = await fetch('http://192.168.1.100:3000/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      if (error instanceof Error) {
        setResult(t('dev.error', { message: error.message }));
      } else {
        setResult(t('dev.unknownError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('dev.title')}</Text>
        
        <View style={styles.section}>
          <Button
            title={loading ? t('dev.loading') : t('dev.pingApi')}
            onPress={pingAPI}
            disabled={loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t('dev.apiResponse')}</Text>
          <View style={styles.resultContainer}>
            <Text style={styles.result}>{result || t('dev.placeholder')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.note}>
            {t('dev.ipNote')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
  },
  result: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
  },
  note: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});