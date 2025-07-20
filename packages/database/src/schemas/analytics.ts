import { pgTable, uuid, date, integer, real, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { users } from './users';

export const dashboardAnalytics = pgTable('dashboard_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  totalExecutions: integer('total_executions').notNull().default(0),
  successfulExecutions: integer('successful_executions').notNull().default(0),
  failedExecutions: integer('failed_executions').notNull().default(0),
  averageResponseTime: real('average_response_time').notNull().default(0), // in milliseconds
  totalCronJobs: integer('total_cron_jobs').notNull().default(0),
  activeCronJobs: integer('active_cron_jobs').notNull().default(0),
  mostActiveHour: integer('most_active_hour'), // 0-23
  successRate: real('success_rate').notNull().default(0), // percentage 0-100
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const dashboardAnalyticsRelations = relations(dashboardAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [dashboardAnalytics.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertDashboardAnalyticsSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalExecutions: z.number().int().min(0).default(0),
  successfulExecutions: z.number().int().min(0).default(0),
  failedExecutions: z.number().int().min(0).default(0),
  averageResponseTime: z.number().min(0).default(0),
  totalCronJobs: z.number().int().min(0).default(0),
  activeCronJobs: z.number().int().min(0).default(0),
  mostActiveHour: z.number().int().min(0).max(23).optional(),
  successRate: z.number().min(0).max(100).default(0),
});

export const selectDashboardAnalyticsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  date: z.string(),
  totalExecutions: z.number(),
  successfulExecutions: z.number(),
  failedExecutions: z.number(),
  averageResponseTime: z.number(),
  totalCronJobs: z.number(),
  activeCronJobs: z.number(),
  mostActiveHour: z.number().nullable(),
  successRate: z.number(),
  createdAt: z.date(),
});

// TypeScript types
export type DashboardAnalytics = typeof dashboardAnalytics.$inferSelect;
export type NewDashboardAnalytics = typeof dashboardAnalytics.$inferInsert;