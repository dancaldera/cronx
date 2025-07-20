import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  themePreference: varchar('theme_preference', { length: 20 }).notNull().default('system'),
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  dateFormat: varchar('date_format', { length: 50 }).notNull().default('MM/dd/yyyy'),
  timeFormat: varchar('time_format', { length: 10 }).notNull().default('12h'),
  language: varchar('language', { length: 10 }).notNull().default('en'),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  pushNotifications: boolean('push_notifications').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(false),
  lastActive: timestamp('last_active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Zod schemas for validation
export const insertUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(100),
  passwordHash: z.string().min(1),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().optional(),
  themePreference: z.enum(['light', 'dark', 'system']).default('system'),
  timezone: z.string().default('UTC'),
  dateFormat: z.string().default('MM/dd/yyyy'),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
  language: z.string().default('en'),
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
});

export const updateUserSchema = insertUserSchema.partial().omit({
  passwordHash: true,
});

export const publicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  themePreference: z.enum(['light', 'dark', 'system']),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.enum(['12h', '24h']),
  language: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  lastActive: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type PublicUser = z.infer<typeof publicUserSchema>;