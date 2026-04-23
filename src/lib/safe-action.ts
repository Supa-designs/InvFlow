import { createSafeActionClient } from 'next-safe-action';
import { auth } from '@clerk/nextjs/server';

/**
 * Cliente de next-safe-action que inyecta automáticamente el ID del tenant/organización.
 */
export const actionClient = createSafeActionClient().use(async ({ next }) => {
  const { orgId, userId } = await auth();

  if (!userId) {
    throw new Error('Not authenticated');
  }
  
  // Si la app está en modo multitenant real, requerimos 'orgId'.
  if (!orgId) {
    throw new Error('No organization context. User must select an organization.');
  }

  return next({ ctx: { userId, orgId } });
});
