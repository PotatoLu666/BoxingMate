import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { TrainingSession } from '../types/session';

const SESSIONS_KEY = 'training_sessions';

export const SessionStorage = {
  // 生成UUID
  generateId: (): string => {
    return Crypto.randomUUID();
  },

  // 保存session
  saveSession: async (session: TrainingSession): Promise<void> => {
    try {
      const existingSessions = await SessionStorage.getSessions();
      const updatedSessions = [session, ...existingSessions];
      
      // 只保留最近100条记录
      const sessionsToSave = updatedSessions.slice(0, 100);
      
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessionsToSave));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  // 获取所有sessions
  getSessions: async (): Promise<TrainingSession[]> => {
    try {
      const sessionsJson = await AsyncStorage.getItem(SESSIONS_KEY);
      if (!sessionsJson) return [];
      
      const sessions = JSON.parse(sessionsJson);
      
      // 转换日期字符串为Date对象
      return sessions.map((session: any) => ({
        ...session,
        startedAt: new Date(session.startedAt),
        endedAt: new Date(session.endedAt),
      }));
    } catch (error) {
      console.error('Failed to load sessions:', error);
      return [];
    }
  },

  // 获取最近N条records
  getRecentSessions: async (limit: number = 20): Promise<TrainingSession[]> => {
    const allSessions = await SessionStorage.getSessions();
    return allSessions.slice(0, limit);
  },

  // 根据ID获取session
  getSessionById: async (id: string): Promise<TrainingSession | null> => {
    const sessions = await SessionStorage.getSessions();
    return sessions.find(session => session.id === id) || null;
  },

  // 清除所有sessions（用于测试）
  clearAllSessions: async (): Promise<void> => {
    await AsyncStorage.removeItem(SESSIONS_KEY);
  }
};