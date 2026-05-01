import { Suspense } from "react";
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema/public/tenants';
import { products } from '@/lib/db/schema/tenant/products';
import { categories } from '@/lib/db/schema/tenant/categories';
import { and, desc, eq } from 'drizzle-orm';
import { ProductsTable } from "@/features/products/components/products-table";
import { resolveEffectiveBusinessType } from "@/lib/tenants/business-type";
import type { FeatureKey } from "@/hooks/useTenantFeatures";

export default async function ProductsPage() {
  const { orgId } = await auth();
  if (!orgId) return <div>No organization context</div>;

  const tenantRes = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId));
  const tenant = tenantRes[0];
  if (!tenant) return <div>Organización no registrada</div>;

  const features = tenant.featuresConfig as Partial<Record<FeatureKey, boolean>>;
  const isLibrary = resolveEffectiveBusinessType(tenant.businessType, features) === 'library';

  // Fetch all active products for the client side table
  const [allProducts, allCategories] = await Promise.all([
    db
      .select()
      .from(products)
      .where(and(eq(products.tenantId, tenant.id), eq(products.isActive, true)))
      .orderBy(desc(products.createdAt)),
    db
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(eq(categories.tenantId, tenant.id))
      .orderBy(desc(categories.createdAt)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isLibrary ? "Catálogo de Títulos" : "Inventario de Productos"}
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu inventario, visualiza el stock y los detalles.
          </p>
        </div>
      </div>

      <div className="py-4">
        <Suspense fallback={<div className="h-96 flex items-center justify-center border rounded-lg bg-white/50">Cargando datos...</div>}>
          <ProductsTable
            data={allProducts}
            isLibrary={isLibrary}
            categories={allCategories}
            showCategories={!!features?.categories}
            showPricing={!!features?.pricing}
            showMinStock={!!features?.min_stock}
          />
        </Suspense>
      </div>
    </div>
  );
}
