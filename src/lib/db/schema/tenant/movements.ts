import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const movements = pgTable('movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  productId: uuid('product_id'),
  type: varchar('type', { enum: ['in', 'out', 'adjustment'] }).notNull(),
  reason: varchar('reason', {
    enum: ['purchase', 'sale', 'return', 'loss', 'loan', 'adjustment'],
  }),
  quantity: integer('quantity').notNull(),
  quantityBefore: integer('quantity_before').notNull(),
  quantityAfter: integer('quantity_after').notNull(),
  notes: text('notes'),
  clerkUserId: varchar('clerk_user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
