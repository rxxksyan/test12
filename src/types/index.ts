export interface User {
  id: string;
  nickname: string;
  email: string;
  role?: 'user' | 'admin' | 'owner';
  phone?: string;
  createdAt?: string;
}

export interface AuthResponse {
  message?: string;
  user: User;
}
