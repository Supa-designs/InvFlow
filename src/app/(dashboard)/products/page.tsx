import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema/public/tenants";
import { products } from "@/lib/db/schema/tenant/products";
import { categories } from "@/lib/db/schema/tenant/categories";
import { ProductsTable } from "@/features/products/components/products-table";
import { resolveEffectiveBusinessType } from "@/lib/tenants/business-type";
import type { FeatureKey } from "@/hooks/useTenantFeatures";
import { getCachedJson, setCachedJson } from "@/features/products/services/products-cache.service";

const PAGE_SIZE = 20;

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toPage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { orgId } = await auth();
  if (!orgId) return <div>No organization context</div>;

  const params = await searchParams;
  const rawPage = toSingle(params.page);
  const rawQuery = toSingle(params.q)?.trim() ?? "";
  const page = toPage(rawPage);
  const offset = (page - 1) * PAGE_SIZE;

  const tenantRes = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId));
  const tenant = tenantRes[0];
  if (!tenant) return <div>Organización no registrada</div>;

  const features = tenant.featuresConfig as Partial<Record<FeatureKey, boolean>>;
  const isLibrary = resolveEffectiveBusinessType(tenant.businessType, features) === "library";

  const listCacheKey = `products:list:tenant:${tenant.id}:page:${page}:q:${rawQuery || "_"}`;
  const facetsCacheKey = `products:facets:tenant:${tenant.id}`;
  const categoriesCacheKey = `products:categories:tenant:${tenant.id}`;

  const whereCondition = and(
    eq(products.tenantId, tenant.id),
    eq(products.isActive, true),
    rawQuery
      ? or(
          ilike(products.name, `%${rawQuery}%`),
          ilike(products.sku, `%${rawQuery}%`),
          ilike(products.barcode, `%${rawQuery}%`),
        )
      : sql`true`,
  );

  const [cachedList, cachedCategories, cachedFacets] = await Promise.all([
    getCachedJson<{
      rows: Array<{
        id: string;
        name: string;
        sku: string | null;
        barcode: string | null;
        categoryId: string | null;
        stockQuantity: number | null;
        minStock: number | null;
        metadata: any;
      }>;
      totalRows: number;
      totalPages: number;
    }>(listCacheKey),
    getCachedJson<Array<{ id: string; name: string; color: string | null }>>(categoriesCacheKey),
    getCachedJson<Array<{ label: string; values: string[] }>>(facetsCacheKey),
  ]);

  let listData = cachedList;
  let allCategories = cachedCategories;
  let availableFacets = cachedFacets;

  if (!listData) {
    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
          barcode: products.barcode,
          categoryId: products.categoryId,
          stockQuantity: products.stockQuantity,
          minStock: products.minStock,
          metadata: products.metadata,
        })
        .from(products)
        .where(whereCondition)
        .orderBy(desc(products.createdAt))
        .limit(PAGE_SIZE)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(whereCondition),
    ]);

    const totalRows = countRows[0]?.count ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
    listData = { rows, totalRows, totalPages };
    await setCachedJson(tenant.id, listCacheKey, listData);
  }

  if (!allCategories) {
    allCategories = await db
      .select({ id: categories.id, name: categories.name, color: categories.color })
      .from(categories)
      .where(eq(categories.tenantId, tenant.id))
      .orderBy(desc(categories.createdAt));
    await setCachedJson(tenant.id, categoriesCacheKey, allCategories);
  }

  if (!availableFacets) {
    const facetRows = await db
      .select({ metadata: products.metadata })
      .from(products)
      .where(and(eq(products.tenantId, tenant.id), eq(products.isActive, true)));

    const map = new Map<string, Set<string>>();
    for (const row of facetRows) {
      const metadata = (row.metadata ?? {}) as Record<string, any>;
      const filters = (metadata.filters ?? metadata.facets ?? {}) as Record<string, string>;
      for (const [label, value] of Object.entries(filters)) {
        const normalized = String(value || "").trim();
        if (!normalized) continue;
        if (!map.has(label)) map.set(label, new Set());
        map.get(label)!.add(normalized);
      }
    }

    availableFacets = [...map.entries()]
      .map(([label, values]) => ({ label, values: [...values].sort((a, b) => a.localeCompare(b)) }))
      .sort((a, b) => a.label.localeCompare(b.label));
    await setCachedJson(tenant.id, facetsCacheKey, availableFacets);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLibrary ? "Catálogo de Títulos" : "Inventario de Productos"}
          </h1>
          <p className="text-muted-foreground">Gestiona tu inventario, visualiza el stock y los detalles.</p>
        </div>
      </div>

      <div className="py-4">
        <Suspense
          fallback={
            <div className="flex h-96 items-center justify-center rounded-lg border bg-white/50">Cargando datos...</div>
          }
        >
          <ProductsTable
            data={listData.rows as any}
            isLibrary={isLibrary}
            categories={allCategories}
            availableFacets={availableFacets}
            showCategories={!!features?.categories}
            showPricing={!!features?.pricing}
            showMinStock={!!features?.min_stock}
            page={page}
            totalPages={listData.totalPages}
            totalRows={listData.totalRows}
            pageSize={PAGE_SIZE}
          />
        </Suspense>
      </div>
    </div>
  );
}
