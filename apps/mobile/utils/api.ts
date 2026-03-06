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

  async updateProfile(data: { name?: string }) {
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
};
