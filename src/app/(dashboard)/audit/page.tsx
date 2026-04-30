import { clerkClient, auth } from "@clerk/nextjs/server";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema/public/tenants";
import { categories } from "@/lib/db/schema/tenant/categories";
import { auditLogs } from "@/lib/db/schema/tenant/audit_logs";
import { products } from "@/lib/db/schema/tenant/products";

function formatAction(action: string) {
  const dictionary: Record<string, string> = {
    "product.created": "creó el producto",
    "product.updated": "actualizó el producto",
    "product.deleted": "eliminó el producto",
    "category.created": "creó la categoría",
    "category.deleted": "eliminó la categoría",
    "member.invited": "invitó a",
    "member.invitation_revoked": "revocó la invitación de",
    "import.completed": "completó la importación de",
    "import.appended": "agregó nuevos registros en",
  };

  return dictionary[action] || action.replaceAll(".", " ");
}

function getEntityLabel(item: (typeof auditLogs.$inferSelect)) {
  const diff = (item.diff ?? {}) as Record<string, any>;
  const after = (diff.after ?? {}) as Record<string, any>;
  const before = (diff.before ?? {}) as Record<string, any>;
  return (
    after.name ||
    before.name ||
    after.title ||
    before.title ||
    diff.name ||
    diff.title ||
    after.productName ||
    before.productName ||
    after.categoryName ||
    before.categoryName ||
    after.organizationName ||
    before.organizationName ||
    after.emailAddress ||
    before.emailAddress ||
    after.barcode ||
    before.barcode ||
    after.sku ||
    before.sku ||
    item.entityType
  );
}

function formatEntity(
  item: (typeof auditLogs.$inferSelect),
  entityLookup: Map<string, string>,
) {
  const entity = getEntityLabel(item);
  if (item.entityType === "import") {
    const diff = (item.diff ?? {}) as Record<string, any>;
    const after = (diff.after ?? {}) as Record<string, any>;
    const imported = typeof after.imported === "number" ? after.imported : null;
    return imported != null ? `${imported} títulos` : "datos";
  }

  const resolved = item.entityId ? entityLookup.get(`${item.entityType}:${item.entityId}`) : null;
  if (resolved) {
    return `"${resolved}"`;
  }

  if (entity && entity !== item.entityType && entity.toLowerCase() !== item.entityType.toLowerCase()) {
    return `"${entity}"`;
  }

  return `"${entity}"`;
}

export default async function AuditPage() {
  const { orgId } = await auth();
  if (!orgId) return <div>No organization context</div>;

  const [tenant] = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId));
  if (!tenant) return <div>Organización no registrada</div>;

  const items = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.tenantId, tenant.id))
    .orderBy(desc(auditLogs.createdAt));

  const productIds = [...new Set(items.filter((item) => item.entityType === "product" && item.entityId).map((item) => item.entityId as string))];
  const categoryIds = [...new Set(items.filter((item) => item.entityType === "category" && item.entityId).map((item) => item.entityId as string))];

  const [productRows, categoryRows] = await Promise.all([
    productIds.length
      ? db.select({ id: products.id, name: products.name }).from(products).where(inArray(products.id, productIds))
      : Promise.resolve([]),
    categoryIds.length
      ? db.select({ id: categories.id, name: categories.name }).from(categories).where(inArray(categories.id, categoryIds))
      : Promise.resolve([]),
  ]);

  const entityLookup = new Map<string, string>([
    ...productRows.map((row): [string, string] => [`product:${row.id}`, row.name]),
    ...categoryRows.map((row): [string, string] => [`category:${row.id}`, row.name]),
  ]);

  const userIds = [...new Set(items.map((item) => item.clerkUserId).filter(Boolean))];
  const client = await clerkClient();
  const users = userIds.length
    ? await client.users.getUserList({ userId: userIds })
    : [];
  const usersData = Array.isArray(users) ? users : users.data;

  const userMap = new Map(
    usersData.map((user) => [
      user.id,
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.primaryEmailAddress?.emailAddress ||
        user.id,
    ]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground">Historial legible de acciones relevantes del inventario.</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Aún no hay eventos auditados.
          </div>
        ) : (
          items.map((item) => {
            const user = userMap.get(item.clerkUserId) || item.clerkUserId || "Sistema";
            const entity = formatEntity(item, entityLookup);
            const createdAt = item.createdAt ?? new Date();
            return (
              <article key={item.id} className="rounded-2xl border bg-card p-4">
                <p className="text-sm leading-7">
                  <strong>{user}</strong> {formatAction(item.action)} <strong>{entity}</strong> — hace{" "}
                  {formatDistanceToNow(createdAt, { addSuffix: false, locale: es })}{" "}
                  <span className="text-muted-foreground">
                    {format(createdAt, "HH:mm:ss", { locale: es })}
                  </span>
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
