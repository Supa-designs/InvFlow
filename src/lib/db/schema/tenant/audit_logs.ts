import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// INMUTABLE — nunca UPDATE ni DELETE sobre esta tabla
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  clerkUserId: varchar('clerk_user_id').notNull(),
  action: varchar('action').notNull(),
  entityType: varchar('entity_type').notNull(),
  entityId: varchar('entity_id'),
  diff: jsonb('diff'),
  createdAt: timestamp('created_at').defaultNow(),
});
