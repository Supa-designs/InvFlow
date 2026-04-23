import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema/public/tenants";
import { auditLogs } from "@/lib/db/schema/tenant/audit_logs";
import { eq, desc } from "drizzle-orm";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground">Historial de acciones relevantes del inventario.</p>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Aún no hay eventos auditados.
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.entityType}
                    {item.entityId ? ` · ${item.entityId}` : ""}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.createdAt?.toLocaleString?.() ?? ""}
                </span>
              </div>
              {item.diff ? (
                <pre className="mt-3 overflow-x-auto rounded-xl bg-muted p-3 text-xs">
                  {JSON.stringify(item.diff, null, 2)}
                </pre>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
