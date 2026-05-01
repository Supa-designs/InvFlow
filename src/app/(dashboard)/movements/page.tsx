import { Suspense } from "react";
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema/public/tenants';
import { movements } from '@/lib/db/schema/tenant/movements';
import { products } from '@/lib/db/schema/tenant/products';
import { and, desc, eq } from 'drizzle-orm';
import { MovementsTable } from "@/features/movements/components/movements-table";

export default async function MovementsPage() {
  const { orgId } = await auth();
  if (!orgId) return <div>No organization context</div>;

  const tenantRes = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId));
  const tenant = tenantRes[0];
  if (!tenant) return <div>Organización no registrada</div>;

  // Fetch movements and join products for product name
  const allMovements = await db
    .select({
      id: movements.id,
      productId: movements.productId,
      type: movements.type,
      reason: movements.reason,
      quantity: movements.quantity,
      quantityBefore: movements.quantityBefore,
      quantityAfter: movements.quantityAfter,
      notes: movements.notes,
      clerkUserId: movements.clerkUserId,
      createdAt: movements.createdAt,
      productName: products.name,
    })
    .from(movements)
    .leftJoin(products, and(eq(movements.productId, products.id), eq(products.tenantId, tenant.id)))
    .where(eq(movements.tenantId, tenant.id))
    .orderBy(desc(movements.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial de Movimientos</h1>
          <p className="text-muted-foreground">
            Consulta los registros de entradas, salidas y ajustes de inventario.
          </p>
        </div>
      </div>

      <div className="py-4">
        <Suspense fallback={<div className="h-96 flex items-center justify-center border rounded-lg bg-white/50">Cargando movimientos...</div>}>
          <MovementsTable data={allMovements} />
        </Suspense>
      </div>
    </div>
  );
}
