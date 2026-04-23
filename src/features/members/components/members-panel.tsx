"use client";

import { useMemo, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import {
  inviteMemberAction,
  revokeInvitationAction,
} from "@/features/members/actions/members.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { toast } from "sonner";

type Member = {
  id: string;
  userId: string;
  identifier: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
  role: string;
  createdAt: number;
};

type Invitation = {
  id: string;
  emailAddress: string;
  role: string;
  status: string;
  createdAt: number;
};

const ROLE_LABELS: Record<"org:admin" | "org:member", string> = {
  "org:admin": "Administrador",
  "org:member": "Miembro",
};

export function MembersPanel({
  initialMembers,
  initialInvitations,
  canManage,
}: {
  initialMembers: Member[];
  initialInvitations: Invitation[];
  canManage: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"org:admin" | "org:member">("org:member");
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null);

  const pendingInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.status === "pending"),
    [invitations],
  );

  const inviteMember = useAction(inviteMemberAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setInvitations((current) => [data, ...current]);
      setEmail("");
      setRole("org:member");
      toast.success("Invitación enviada");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "No se pudo enviar la invitación");
    },
  });

  const revokeInvitation = useAction(revokeInvitationAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setInvitations((current) =>
        current.map((invitation) =>
          invitation.id === data.id ? { ...invitation, status: data.status } : invitation,
        ),
      );
      setRevokeTarget(null);
      toast.success("Invitación revocada");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "No se pudo revocar la invitación");
    },
  });

  return (
    <div className="space-y-6">
      {canManage && (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Invitar colaboradores</h2>
            <p className="text-sm text-muted-foreground">
              Clerk enviará un correo con el enlace de invitación.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
            <div className="space-y-2">
              <Label htmlFor="member-email">Correo electrónico</Label>
              <Input
                id="member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(value) => setRole(value as typeof role)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{ROLE_LABELS[role]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org:member">Miembro</SelectItem>
                  <SelectItem value="org:admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={() => inviteMember.execute({ email, role })}
                disabled={!email || inviteMember.status === "executing"}
              >
                {inviteMember.status === "executing" ? "Enviando..." : "Invitar"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Miembros</h2>
            <p className="text-sm text-muted-foreground">Equipo activo de la organización.</p>
          </div>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {[member.firstName, member.lastName].filter(Boolean).join(" ") || member.identifier}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{member.identifier}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {member.role === "org:admin" ? "Administrador" : "Miembro"}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Invitaciones pendientes</h2>
            <p className="text-sm text-muted-foreground">Solicitudes enviadas por correo.</p>
          </div>
          <div className="space-y-3">
            {pendingInvitations.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                No hay invitaciones pendientes.
              </div>
            ) : (
              pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{invitation.emailAddress}</p>
                    <p className="text-sm text-muted-foreground">
                      {invitation.role === "org:admin" ? "Administrador" : "Miembro"}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      variant="outline"
                      onClick={() => setRevokeTarget(invitation)}
                    >
                      Revocar
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revocar invitación"
        description={`Se invalidará la invitación enviada a ${revokeTarget?.emailAddress ?? ""}.`}
        confirmLabel={revokeInvitation.status === "executing" ? "Revocando..." : "Revocar"}
        onConfirm={() => {
          if (!revokeTarget) return;
          revokeInvitation.execute({ invitationId: revokeTarget.id });
        }}
        destructive
      />
    </div>
  );
}
