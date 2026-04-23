import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  clerkOrganizationId: varchar('clerk_organization_id').notNull().unique(),
  businessType: varchar('business_type', {
    enum: ['library', 'hardware_store', 'warehouse', 'generic'],
  })
    .notNull()
    .default('generic'),
  featuresConfig: jsonb('features_config')
    .notNull()
    .default({
      isbn_lookup: false,
      serial_tracking: false,
      loan_mode: false,
      unit_of_measure: false,
      categories: false,
      movements: false,
      pricing: false,
      min_stock: false,
    }),
  plan: varchar('plan', {
    enum: ['starter', 'pro', 'enterprise'],
  }).default('starter'),
  polarCustomerId: varchar('polar_customer_id'),
  createdAt: timestamp('created_at').defaultNow(),
});
