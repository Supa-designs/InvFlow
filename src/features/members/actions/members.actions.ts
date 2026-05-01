"use server";

import { z } from "zod";
import { clerkClient } from "@clerk/nextjs/server";
import { actionClient } from "@/lib/safe-action";
import { requireTenantContext } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { createAuditEntry } from "@/features/audit/services/audit.service";

const inviteMemberSchema = z.object({
  email: z.email("Correo inválido"),
  role: z.enum(["org:admin", "org:member"]),
});

const revokeInvitationSchema = z.object({
  invitationId: z.string().min(1),
});

export const listMembersAction = actionClient.action(async () => {
  const { orgId } = await requireTenantContext();
  const client = await clerkClient();
  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
    limit: 100,
  });

  return memberships.data.map((membership) => ({
    id: membership.id,
    userId: membership.publicUserData?.userId ?? "",
    identifier: membership.publicUserData?.identifier ?? "",
    firstName: membership.publicUserData?.firstName ?? "",
    lastName: membership.publicUserData?.lastName ?? "",
    imageUrl: membership.publicUserData?.imageUrl ?? "",
    role: membership.role,
    createdAt: membership.createdAt,
  }));
});

export const listPendingInvitationsAction = actionClient.action(async () => {
  const { orgId } = await requireTenantContext();
  const client = await clerkClient();
  const invitations = await client.organizations.getOrganizationInvitationList({
    organizationId: orgId,
    limit: 100,
  });

  return invitations.data.map((invitation) => ({
    id: invitation.id,
    emailAddress: invitation.emailAddress,
    role: invitation.role,
    status: invitation.status,
    createdAt: invitation.createdAt,
  }));
});

export const inviteMemberAction = actionClient
  .schema(inviteMemberSchema)
  .action(async ({ parsedInput }) => {
    const { orgId, userId, tenantId } = await requireTenantContext();
    const client = await clerkClient();

    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: orgId,
      inviterUserId: userId,
      emailAddress: parsedInput.email,
      role: parsedInput.role,
      redirectUrl: "/members",
    });

    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: "member.invited",
      entityType: "member_invitation",
      entityId: invitation.id,
      after: {
        emailAddress: invitation.emailAddress,
        role: invitation.role,
        status: invitation.status,
      },
    });

    return {
      id: invitation.id,
      emailAddress: invitation.emailAddress,
      role: invitation.role,
      status: invitation.status ?? 'pending',
      createdAt: invitation.createdAt,
    };
  });

export const revokeInvitationAction = actionClient
  .schema(revokeInvitationSchema)
  .action(async ({ parsedInput }) => {
    const { orgId, userId, tenantId } = await requireTenantContext();
    const client = await clerkClient();

    const invitation = await client.organizations.revokeOrganizationInvitation({
      organizationId: orgId,
      invitationId: parsedInput.invitationId,
      requestingUserId: userId,
    });

    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: "member.invitation_revoked",
      entityType: "member_invitation",
      entityId: invitation.id,
      after: {
        emailAddress: invitation.emailAddress,
        role: invitation.role,
        status: invitation.status,
      },
    });

    return {
      id: invitation.id,
      status: invitation.status ?? 'revoked',
    };
  });
