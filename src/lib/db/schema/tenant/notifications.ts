import { jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  clerkUserId: varchar('clerk_user_id').notNull(),
  type: varchar('type', {
    enum: ['low_stock', 'invitation_received', 'invitation_accepted', 'system'],
  }).notNull(),
  title: varchar('title').notNull(),
  body: text('body'),
  payload: jsonb('payload'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});
