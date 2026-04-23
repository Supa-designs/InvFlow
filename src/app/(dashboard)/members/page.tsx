import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { isClerkOrgAdmin } from "@/lib/auth/clerk";
import { MembersPanel } from "@/features/members/components/members-panel";

export default async function MembersPage() {
  const { orgRole, orgId } = await auth();
  if (!orgId) return <div>No organization context</div>;

  const canManage = isClerkOrgAdmin(orgRole);
  const client = await clerkClient();
  const [memberships, invitations] = await Promise.all([
    client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    }),
    client.organizations.getOrganizationInvitationList({
      organizationId: orgId,
      limit: 100,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Equipo y Roles</h1>
        <p className="text-muted-foreground">
          Administra los miembros de tu organización, invita colaboradores y asigna permisos.
        </p>
      </div>
      <MembersPanel
        initialMembers={memberships.data.map((membership) => ({
          id: membership.id,
          userId: membership.publicUserData?.userId ?? "",
          identifier: membership.publicUserData?.identifier ?? "",
          firstName: membership.publicUserData?.firstName ?? "",
          lastName: membership.publicUserData?.lastName ?? "",
          imageUrl: membership.publicUserData?.imageUrl ?? "",
          role: membership.role,
          createdAt: membership.createdAt,
        }))}
        initialInvitations={invitations.data.map((invitation) => ({
          id: invitation.id,
          emailAddress: invitation.emailAddress,
          role: invitation.role,
          status: invitation.status ?? "pending",
          createdAt: invitation.createdAt,
        }))}
        canManage={canManage}
      />
    </div>
  );
}
