import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { products } from '@/lib/db/schema/tenant/products';
import { auditLogs } from '@/lib/db/schema/tenant/audit_logs';
import { movements } from '@/lib/db/schema/tenant/movements';
import { and, desc, eq, gte } from 'drizzle-orm';

export class DashboardService {
  constructor(
    private db: NeonHttpDatabase<any>,
    private tenantId: string,
  ) {}

  async getDashboardMetrics(thirtyDaysAgo: Date) {
    // These queries are parallelized for performance
    const [allProducts, recentAudit, recentMovements] = await Promise.all([
      this.db
        .select()
        .from(products)
        .where(and(eq(products.isActive, true), eq(products.tenantId, this.tenantId))),
      this.db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, this.tenantId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(10),
      this.db
        .select()
        .from(movements)
        .where(and(eq(movements.tenantId, this.tenantId), gte(movements.createdAt, thirtyDaysAgo)))
    ]);

    return {
      allProducts,
      recentAudit,
      recentMovements
    };
  }
}
