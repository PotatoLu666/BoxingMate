import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { View, Text, Button } from 'react-native';

export default function DevScreen() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const pingAPI = async () => {
    setLoading(true);
    setResult('请求中...');
    
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
        setResult(`错误: ${error.message}`);
      } else {
        setResult('未知错误');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>开发工具</Text>
        
        <View style={styles.section}>
          <Button
            title={loading ? '请求中...' : 'Ping API'}
            onPress={pingAPI}
            disabled={loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>API 响应:</Text>
          <View style={styles.resultContainer}>
            <Text style={styles.result}>{result || '点击上面按钮发送请求'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.note}>
            注意: 请修改代码中的 IP 地址为你的实际 PC IP 地址 (当前设置为 192.168.1.100)
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