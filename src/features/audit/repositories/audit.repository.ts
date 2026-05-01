import { desc, eq } from 'drizzle-orm';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { auditLogs } from '@/lib/db/schema/tenant/audit_logs';

type DbInstance = NeonHttpDatabase<any>;

export type AuditEntryInput = {
  clerkUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  diff?: any;
};

export class AuditLogRepository {
  private db: DbInstance;
  private tenantId: string;

  constructor(db: DbInstance, tenantId: string) {
    this.db = db;
    this.tenantId = tenantId;
  }

  async getAll() {
    return this.db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, this.tenantId))
      .orderBy(desc(auditLogs.createdAt));
  }

  async create(data: AuditEntryInput) {
    const result = await this.db
      .insert(auditLogs)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return result[0];
  }
}
