import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { products } from '@/lib/db/schema/tenant/products';

type DbInstance = NeonHttpDatabase<any>;

export class ProductRepository {
  private db: DbInstance;
  private tenantId: string;

  constructor(db: DbInstance, tenantId: string) {
    this.db = db;
    this.tenantId = tenantId;
  }

  async getAll() {
    return this.db
      .select()
      .from(products)
      .where(and(eq(products.tenantId, this.tenantId), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt));
  }

  async getById(id: string) {
    const result = await this.db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.tenantId, this.tenantId), eq(products.isActive, true)));
    return result.length > 0 ? result[0] : null;
  }

  async getByBarcode(barcode: string) {
    const result = await this.db
      .select()
      .from(products)
      .where(and(eq(products.barcode, barcode), eq(products.tenantId, this.tenantId), eq(products.isActive, true)));
    return result.length > 0 ? result[0] : null;
  }

  async getBySKU(sku: string) {
    const result = await this.db
      .select()
      .from(products)
      .where(and(eq(products.sku, sku), eq(products.tenantId, this.tenantId), eq(products.isActive, true)));
    return result.length > 0 ? result[0] : null;
  }

  async search(query: string) {
    const like = `%${query}%`;
    return this.db
      .select()
      .from(products)
      .where(
        and(
          eq(products.tenantId, this.tenantId),
          eq(products.isActive, true),
          or(
            ilike(products.name, like),
            ilike(products.sku, like),
            ilike(products.barcode, like),
          ),
        ),
      )
      .orderBy(desc(products.createdAt));
  }

  async create(data: Omit<typeof products.$inferInsert, 'tenantId'>) {
    const result = await this.db
      .insert(products)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return result[0];
  }

  async update(id: string, data: Partial<typeof products.$inferInsert>) {
    const result = await this.db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, this.tenantId)))
      .returning();
    return result[0];
  }

  async delete(id: string) {
    // Soft delete preferido según esquema de inventario (campo isActive)
    const result = await this.db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, this.tenantId)))
      .returning();
    return result[0];
  }
}
