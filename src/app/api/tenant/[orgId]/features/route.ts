import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema/public/tenants';
import { eq } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ orgId: string }> }) {
  const { orgId: paramOrgId } = await context.params;
  try {
    const { userId, orgId } = await auth();

    if (!userId || orgId !== paramOrgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantResult = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, paramOrgId));

    if (tenantResult.length === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const tenant = tenantResult[0];

    return NextResponse.json(
      {
        featuresConfig: tenant.featuresConfig,
        businessType: tenant.businessType,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed fetching tenant features' }, { status: 500 });
  }
}
