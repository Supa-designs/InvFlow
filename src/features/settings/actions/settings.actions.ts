"use server";

import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { actionClient } from "@/lib/safe-action";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema/public/tenants";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isClerkOrgAdmin } from "@/lib/auth/clerk";

const updateTenantSettingsSchema = z.object({
  organizationName: z.string().min(2).max(255).optional(),
  businessType: z.enum(["library", "hardware_store", "warehouse", "generic"]).optional(),
  featuresConfig: z.record(z.string(), z.boolean()).optional(),
});

export const updateTenantSettingsAction = actionClient
  .schema(updateTenantSettingsSchema)
  .action(async ({ parsedInput: { organizationName, businessType, featuresConfig } }) => {
    const { orgId, orgRole } = await auth();
    if (!orgId) throw new Error("Unauthorized");
    
    if (!isClerkOrgAdmin(orgRole)) {
      throw new Error("No tienes permisos suficientes para modificar la configuración (se requiere rol de admin).");
    }
    
    const existingTenantRes = await db.select().from(tenants).where(eq(tenants.clerkOrganizationId, orgId));
    const tenant = existingTenantRes[0];

    if (!tenant) throw new Error("Tenant no encontrado");

    const updateData: any = {};
    if (organizationName?.trim()) {
      const client = await clerkClient();
      await client.organizations.updateOrganization(orgId, {
        name: organizationName.trim(),
      });
      updateData.name = organizationName.trim();
    }
    if (businessType) {
      updateData.businessType = businessType;
    }
    if (featuresConfig) {
      updateData.featuresConfig = {
        ...(tenant.featuresConfig as any),
        ...featuresConfig,
      };
    }

    const updated =
      Object.keys(updateData).length > 0
        ? await db
            .update(tenants)
            .set(updateData)
            .where(eq(tenants.clerkOrganizationId, orgId))
            .returning()
        : [tenant];

    revalidatePath("/", "layout");
    
    return updated[0];
  });
