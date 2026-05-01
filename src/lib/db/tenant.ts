import { and, eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema/public/tenants';

export async function getTenantByOrgId(orgId: string) {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.clerkOrganizationId, orgId))
    .limit(1);

  return tenant ?? null;
}

export async function requireTenantContext() {
  const { orgId, userId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new Error('No organization context');
  }

  const tenant = await getTenantByOrgId(orgId);

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  return {
    userId,
    orgId,
    orgRole: orgRole ?? 'org:member',
    tenant,
    tenantId: tenant.id,
  };
}

export function scopeByTenant<TColumn>(tenantColumn: TColumn, tenantId: string) {
  return eq(tenantColumn as never, tenantId as never);
}
