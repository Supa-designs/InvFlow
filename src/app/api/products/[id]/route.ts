import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema/public/tenants";
import { products } from "@/lib/db/schema/tenant/products";
import { getCachedJson, setCachedJson } from "@/features/products/services/products-cache.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  const { orgId } = await auth();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const tenantRows = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId)).limit(1);
  const tenant = tenantRows[0];
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const cacheKey = `products:detail:tenant:${tenant.id}:id:${id}`;
  const cached = await getCachedJson<{ product: any }>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenant.id), eq(products.isActive, true)))
    .limit(1);
  const product = rows[0];
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payload = { product };
  await setCachedJson(tenant.id, cacheKey, payload);
  return NextResponse.json(payload);
}

