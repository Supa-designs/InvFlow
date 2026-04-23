import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema/public/tenants";
import { eq } from "drizzle-orm";
import { SettingsForm } from "@/features/settings/components/settings-form";
import { isClerkOrgAdmin } from "@/lib/auth/clerk";
import { clerkClient } from "@clerk/nextjs/server";

export default async function SettingsPage() {
  const { orgId, orgRole } = await auth();
  if (!orgId) return <div>No organization context</div>;

  const isAdmin = isClerkOrgAdmin(orgRole);

  const tenantRes = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId));
  const tenant = tenantRes[0];
  const client = await clerkClient();
  const organization = await client.organizations.getOrganization({ organizationId: orgId });

  if (!tenant) return <div>Organización no encontrada.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración del Inventario</h1>
        <p className="text-muted-foreground">
          Ajusta las características, reglas de negocio y opciones globales de tu organización.
        </p>
      </div>

      {!isAdmin ? (
        <div className="p-4 border border-yellow-200 bg-yellow-50 text-yellow-800 rounded-md">
          Necesitas rol de administrador para modificar estas opciones.
        </div>
      ) : (
        <SettingsForm tenant={tenant} organizationName={organization.name} />
      )}
    </div>
  );
}
