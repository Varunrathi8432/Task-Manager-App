export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultView: 'list' | 'kanban' | 'calendar';
  notificationsEnabled: boolean;
  defaultPriority: 'low' | 'medium' | 'high';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
}
