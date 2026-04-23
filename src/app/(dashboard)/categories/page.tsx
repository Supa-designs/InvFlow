import { Suspense } from "react";
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema/public/tenants';
import { categories } from '@/lib/db/schema/tenant/categories';
import { and, desc, eq } from 'drizzle-orm';
import { CategoriesTable } from "@/features/categories/components/categories-table";

export default async function CategoriesPage() {
  const { orgId } = await auth();
  if (!orgId) return <div>No organization context</div>;

  const tenantRes = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId));
  const tenant = tenantRes[0];
  if (!tenant) return <div>Organización no registrada</div>;

  const features = tenant.featuresConfig as any;
  if (!features?.categories) {
    return (
      <div className="flex h-96 items-center justify-center flex-col gap-4 text-center">
        <h2 className="text-xl font-bold">Módulo desactivado</h2>
        <p className="text-muted-foreground">Las categorías no están habilitadas para esta organización.</p>
      </div>
    );
  }

  // Fetch categories
  const allCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.tenantId, tenant.id))
    .orderBy(desc(categories.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
          <p className="text-muted-foreground">
            Clasifica y organiza tus productos en el inventario.
          </p>
        </div>
      </div>

      <div className="py-4">
        <Suspense fallback={<div className="h-96 flex items-center justify-center border rounded-lg bg-white/50">Cargando categorías...</div>}>
          <CategoriesTable data={allCategories} />
        </Suspense>
      </div>
    </div>
  );
}
