import { and, desc, eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { movements } from '@/lib/db/schema/tenant/movements';

type DbInstance = NeonHttpDatabase<any>;

export class MovementRepository {
  private db: DbInstance;
  private tenantId: string;

  constructor(db: DbInstance, tenantId: string) {
    this.db = db;
    this.tenantId = tenantId;
  }

  async getAll(limit: number = 50) {
    return this.db
      .select()
      .from(movements)
      .where(eq(movements.tenantId, this.tenantId))
      .orderBy(desc(movements.createdAt))
      .limit(limit);
  }

  async getRecentByProduct(productId: string, limit: number = 10) {
    return this.db
      .select()
      .from(movements)
      .where(and(eq(movements.productId, productId), eq(movements.tenantId, this.tenantId)))
      .orderBy(desc(movements.createdAt))
      .limit(limit);
  }

  async create(data: Omit<typeof movements.$inferInsert, 'tenantId'>) {
    const result = await this.db
      .insert(movements)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return result[0];
  }
}
