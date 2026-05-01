import { auth } from '@clerk/nextjs/server';

export type Role = 'employee' | 'admin' | 'owner';

export function isClerkOrgAdmin(orgRole?: string | null) {
  return orgRole === 'org:admin';
}

export async function requireRole(minRole: Role) {
  const { orgRole } = await auth();

  if (!orgRole) {
    throw new Error('No organization context');
  }

  // orgRole generally comes as 'org:admin', 'org:member', etc. depending on custom roles setup in Clerk.
  // Assuming mapped to 'owner', 'admin', 'employee' or handling clerk raw strings.
  const roleValue = orgRole.replace('org:', '');

  const hierarchy: Record<string, number> = {
    member: 0,
    employee: 0,
    admin: 1,
    owner: 2,
  };

  const userRoleLevel = hierarchy[roleValue] ?? -1;
  const minRoleLevel = hierarchy[minRole] ?? -1;

  if (userRoleLevel < minRoleLevel) {
    throw new Error('Insufficient permissions');
  }
}
