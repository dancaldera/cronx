import { pgTable, uuid, varchar, text, boolean, integer, json, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { users } from './users';

export const httpTemplates = pgTable('http_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  method: varchar('method', { length: 10 }).notNull().default('GET'),
  url: text('url').notNull(),
  headers: json('headers').$type<Record<string, string>>().default({}),
  body: text('body'),
  authType: varchar('auth_type', { length: 20 }).notNull().default('none'),
  authConfig: json('auth_config').$type<Record<string, any>>(),
  timeoutSeconds: integer('timeout_seconds').notNull().default(30),
  followRedirects: boolean('follow_redirects').notNull().default(true),
  validateSsl: boolean('validate_ssl').notNull().default(true),
  expectedStatusCodes: json('expected_status_codes').$type<number[]>().default([200]),
  responseValidation: json('response_validation').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

// Relations
export const httpTemplatesRelations = relations(httpTemplates, ({ one, many }) => ({
  user: one(users, {
    fields: [httpTemplates.userId],
    references: [users.id],
  }),
  // cronJobs: many(cronJobs), // Defined in cron-jobs.ts
}));

// Note: cronJobs relation will be defined in cron-jobs.ts to avoid circular imports

// Zod schemas for validation
export const insertHttpTemplateSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  url: z.string().url(),
  headers: z.record(z.string()).default({}),
  body: z.string().optional(),
  authType: z.enum(['none', 'bearer', 'basic', 'api_key']).default('none'),
  authConfig: z.record(z.any()).optional(),
  timeoutSeconds: z.number().int().min(1).max(300).default(30),
  followRedirects: z.boolean().default(true),
  validateSsl: z.boolean().default(true),
  expectedStatusCodes: z.array(z.number()).default([200]),
  responseValidation: z.record(z.any()).optional(),
});

export const selectHttpTemplateSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  method: z.string(),
  url: z.string(),
  headers: z.record(z.string()),
  body: z.string().nullable(),
  authType: z.string(),
  authConfig: z.record(z.any()).nullable(),
  timeoutSeconds: z.number(),
  followRedirects: z.boolean(),
  validateSsl: z.boolean(),
  expectedStatusCodes: z.array(z.number()),
  responseValidation: z.record(z.any()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const updateHttpTemplateSchema = insertHttpTemplateSchema.omit({
  userId: true,
}).partial();

// TypeScript types
export type HttpTemplate = typeof httpTemplates.$inferSelect;
export type NewHttpTemplate = typeof httpTemplates.$inferInsert;
export type UpdateHttpTemplate = z.infer<typeof updateHttpTemplateSchema>;