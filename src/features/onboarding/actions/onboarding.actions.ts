'use server';

import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema/public/tenants';
import { auth } from '@clerk/nextjs/server';
import { BusinessType, FeatureKey } from '@/hooks/useTenantFeatures';
import { revalidatePath } from 'next/cache';

export async function createTenantOnboarding(data: {
  businessType: BusinessType;
  featuresConfig: Record<FeatureKey, boolean>;
  name: string;
}) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      throw new Error('Unauthorized');
    }

    // Insert or update (if somehow it exists but wasn't found)
    const [newTenant] = await db
      .insert(tenants)
      .values({
        clerkOrganizationId: orgId,
        name: data.name,
        businessType: data.businessType,
        featuresConfig: data.featuresConfig,
      })
      .onConflictDoUpdate({
        target: tenants.clerkOrganizationId,
        set: {
          name: data.name,
          businessType: data.businessType,
          featuresConfig: data.featuresConfig,
        },
      })
      .returning();

    revalidatePath('/', 'layout');
    
    return { success: true, tenant: newTenant };
  } catch (error) {
    console.error('Onboarding Error:', error);
    return { success: false, error: 'Ocurrió un error al guardar la configuración.' };
  }
}
