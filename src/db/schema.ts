import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const repositories = sqliteTable('repositories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  owner: text('owner').notNull(),
  repo: text('repo').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const issues = sqliteTable('issues', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  repositoryId: integer('repository_id').references(() => repositories.id).notNull(),
  issueNumber: integer('issue_number').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  state: text('state').notNull(),
  labels: text('labels'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  analyzedAt: integer('analyzed_at', { mode: 'timestamp' }),
  
  // Analysis results
  fixabilityScore: real('fixability_score'),
  fixabilityLevel: text('fixability_level'), // 'High' | 'Medium' | 'Low' | 'Very Low'
  appliedRules: text('applied_rules'), // JSON string
  recommendation: text('recommendation'),
  contextData: text('context_data'), // JSON string with related files, code refs, comments count
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').unique().notNull(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;