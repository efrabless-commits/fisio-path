"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers";
import { db } from "@/lib/db";
import { addTherapist } from "@/lib/auth";
import { planById } from "@/lib/plans";
import { saveAndSync } from "@/lib/sync";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function TeamPage() {
  const { user, clinic, refresh } = useAuth();
  const members = useLiveQuery(
    () => (user ? db.users.where("clinicId").equals(user.clinicId).toArray() : []),
    [user?.clinicId],
  );

  if (!user || !clinic) return null;
  if (user.role !== "admin_corporativo") {
    return (
      <p className="rounded-2xl border bg-card p-4">
        Solo el administrador corporativo gestiona el equipo y ve todos los informes.
      </p>
    );
  }

  const plan = planById(clinic.planId);
  const count = members?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Equipo</h1>
        <p className="text-sm text-muted-foreground">
          Plan {plan.name}: {count} de {plan.seats} asientos. Los datos de {clinic.name} no se
          mezclan con otras clínicas.
        </p>
      </div>
      <ul className="space-y-2">
        {(members ?? []).map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-muted-foreground">
                {m.email} · {m.specialty || "sin especialidad"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={m.role === "admin_corporativo" ? "default" : "secondary"}>
                {m.role === "admin_corporativo" ? "Admin" : "Fisio"}
              </Badge>
              {m.id !== user.id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    await saveAndSync("users", clinic.id, { ...m, active: !m.active });
                    await refresh();
                  }}
                >
                  {m.active ? "Desactivar" : "Activar"}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <AddForm
        disabled={count >= plan.seats}
        onAdd={async (data) => {
          await addTherapist({ clinicId: clinic.id, ...data });
          toast.success("Fisioterapeuta añadido");
          await refresh();
        }}
      />
    </div>
  );
}

function AddForm({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (d: { name: string; email: string; password: string; specialty?: string }) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  if (disabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Ha alcanzado el cupo del plan. Pase a un plan de más asientos para ampliar el equipo.
      </p>
    );
  }
  return (
    <form
      className="space-y-3 rounded-2xl border bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await onAdd({
            name: String(fd.get("name")),
            email: String(fd.get("email")),
            password: String(fd.get("password")),
            specialty: String(fd.get("specialty") || ""),
          });
          e.currentTarget.reset();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo añadir");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="font-medium">Añadir fisioterapeuta</p>
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" className="h-11" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" className="h-11" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña inicial</Label>
        <Input id="password" name="password" className="h-11" required minLength={6} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="specialty">Especialidad</Label>
        <Input id="specialty" name="specialty" className="h-11" />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={busy}>
        Añadir al equipo
      </Button>
    </form>
  );
}
