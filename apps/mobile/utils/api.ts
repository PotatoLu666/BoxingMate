import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your actual API URL
const API_BASE = 'http://10.12.0.202:3000';

const TOKENS_KEY = 'auth_tokens';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

async function getTokens(): Promise<Tokens | null> {
  const raw = await AsyncStorage.getItem(TOKENS_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function saveTokens(tokens: Tokens): Promise<void> {
  await AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(TOKENS_KEY);
}

async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const tokens = await getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (tokens?.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // If 401, try refresh
  if (res.status === 401 && tokens?.refreshToken) {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (refreshRes.ok) {
      const newTokens: Tokens = await refreshRes.json();
      await saveTokens(newTokens);
      headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } else {
      await clearTokens();
    }
  }

  return res;
}

export const api = {
  getTokens,
  saveTokens,
  clearTokens,

  async register(email: string, password: string, name?: string) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed');
    }
    return res.json();
  },

  async verifyEmail(email: string, code: string) {
    const res = await fetch(`${API_BASE}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Verification failed');
    }
    return res.json();
  },

  async resendCode(email: string) {
    const res = await fetch(`${API_BASE}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Resend failed');
    }
    return res.json();
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }
    const tokens: Tokens = await res.json();
    await saveTokens(tokens);
    return tokens;
  },

  async getProfile() {
    const res = await fetchWithAuth('/profile');
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(data: {
    name?: string | null;
    nickname?: string | null;
    avatarUrl?: string | null;
    height?: number | null;
    weight?: number | null;
    age?: number | null;
    gender?: string | null;
    fightStyle?: string | null;
    bio?: string | null;
    city?: string | null;
    gym?: string | null;
  }) {
    const res = await fetchWithAuth('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async logout() {
    await clearTokens();
  },

  // --- Training Sessions ---

  async createSession(data: {
    date: string;
    type: string;
    duration: number;
    rounds?: number | null;
    roundDuration?: number | null;
    restDuration?: number | null;
    intensity?: string | null;
    notes?: string | null;
  }) {
    const res = await fetchWithAuth('/training', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create session');
    return res.json();
  },

  async getSessions(take = 20, skip = 0) {
    const res = await fetchWithAuth(`/training?take=${take}&skip=${skip}`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json() as Promise<{ items: any[]; total: number }>;
  },

  async deleteSession(id: string) {
    const res = await fetchWithAuth(`/training/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete session');
    return res.json();
  },

  async getWeeklyStats() {
    const res = await fetchWithAuth('/training/stats/weekly');
    if (!res.ok) throw new Error('Failed to fetch weekly stats');
    return res.json() as Promise<{
      sessionsCount: number;
      totalDuration: number;
      avgIntensity: string | null;
      dates: string[];
    }>;
  },

  // --- Daily Check-in ---

  async checkIn(data: {
    weight?: number | null;
    mood?: string | null;
    energy?: string | null;
  }) {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const res = await fetchWithAuth('/checkin', {
      method: 'POST',
      body: JSON.stringify({ ...data, date: localDate }),
    });
    if (!res.ok) throw new Error('Failed to check in');
    return res.json();
  },

  async getTodayCheckIn() {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const res = await fetchWithAuth(`/checkin/today?date=${localDate}`);
    if (!res.ok) throw new Error('Failed to fetch today check-in');
    return res.json();
  },

  async getTrends(span: string = 'week', metric: string = 'sessions') {
    const res = await fetchWithAuth(`/training/stats/trends?span=${span}&metric=${metric}`);
    if (!res.ok) throw new Error('Failed to fetch trends');
    return res.json() as Promise<{ labels: string[]; data: number[]; metric: string; span: string }>;
  },

  async getCheckInHistory(take = 30, skip = 0) {
    const res = await fetchWithAuth(`/checkin?take=${take}&skip=${skip}`);
    if (!res.ok) throw new Error('Failed to fetch check-in history');
    return res.json() as Promise<{ items: any[]; total: number }>;
  },
};
