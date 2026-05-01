import { AuditLogRepository, AuditEntryInput } from '../repositories/audit.repository';
import { NeonHttpDatabase } from 'drizzle-orm/neon-http';

// Helper de diff básico
function computeDiff(before: any, after: any) {
  if (!before) return { after };
  if (!after) return { before };

  const diff: any = { before: {}, after: {} };
  
  // Extraemos claves combinadas
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  keys.forEach((k) => {
    if (before[k] !== after[k]) {
      diff.before[k] = before[k];
      diff.after[k] = after[k];
    }
  });

  return diff;
}

type CreateAuditParams = Omit<AuditEntryInput, 'diff'> & {
  db: NeonHttpDatabase<any>;
  tenantId: string;
  before?: any;
  after?: any;
};

export async function createAuditEntry({
  db,
  tenantId,
  clerkUserId,
  action,
  entityType,
  entityId,
  before,
  after,
}: CreateAuditParams) {
  const diff = computeDiff(before, after);
  const repo = new AuditLogRepository(db, tenantId);

  return repo.create({
    clerkUserId,
    action,
    entityType,
    entityId,
    diff,
  });
}
