import { AuthResponse, User } from '../types/index.js';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data as T;
}

export const api = {
  register: (nickname: string, email: string, password: string, phone?: string): Promise<AuthResponse> =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nickname, email, password, phone }),
    }),

  login: (email: string, password: string): Promise<AuthResponse> =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: (): Promise<AuthResponse> => request('/auth/me'),

  logout: (): Promise<{ message: string }> => 
    request('/auth/logout', { method: 'POST' }),

  changePassword: (oldPassword: string, newPassword: string): Promise<{ message: string }> =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),
};