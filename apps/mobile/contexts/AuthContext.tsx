import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: string | null;
  fightStyle: string | null;
  bio: string | null;
  city: string | null;
  gym: string | null;
  profileComplete: number; // percentage 0-100
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
      await api.logout();
    }
  }, []);

  // Check auth state on mount
  useEffect(() => {
    (async () => {
      const tokens = await api.getTokens();
      if (tokens?.accessToken) {
        await refreshProfile();
      }
      setIsLoading(false);
    })();
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    await refreshProfile();
  };

  const register = async (email: string, password: string, name?: string) => {
    await api.register(email, password, name);
  };

  const verifyEmail = async (email: string, code: string) => {
    await api.verifyEmail(email, code);
  };

  const resendCode = async (email: string) => {
    await api.resendCode(email);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyEmail,
        resendCode,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
