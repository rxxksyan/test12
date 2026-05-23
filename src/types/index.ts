export interface User {
  id: string;
  nickname: string;
  email: string;
  phone?: string;
  role?: 'user' | 'admin' | 'owner';
  createdAt?: string;
}

export interface AuthResponse {
  message?: string;
  user: User;
}
