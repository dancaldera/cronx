// Common types used across schemas
export type TimestampFields = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key';

export type ExecutionStatus = 'success' | 'failure' | 'timeout';

export type ThemePreference = 'light' | 'dark' | 'system';

export type TimeFormat = '12h' | '24h';