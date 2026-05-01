import { and, desc, eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { categories } from '@/lib/db/schema/tenant/categories';

type DbInstance = NeonHttpDatabase<any>;

export class CategoryRepository {
  private db: DbInstance;
  private tenantId: string;

  constructor(db: DbInstance, tenantId: string) {
    this.db = db;
    this.tenantId = tenantId;
  }

  async getAll() {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, this.tenantId))
      .orderBy(desc(categories.createdAt));
  }

  async create(data: Omit<typeof categories.$inferInsert, 'tenantId'>) {
    const result = await this.db
      .insert(categories)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return result[0];
  }

  async delete(id: string) {
    const result = await this.db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.tenantId, this.tenantId)))
      .returning();
    return result[0];
  }
}
