// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  themePreference: 'light' | 'dark' | 'system';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  isActive: boolean;
  isVerified: boolean;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  themePreference?: 'light' | 'dark' | 'system';
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  language?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}