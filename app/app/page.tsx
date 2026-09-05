"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { ClipboardList, UserRound, AlertTriangle } from "lucide-react";
import { useAuth } from "@/components/providers";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { planById } from "@/lib/plans";

export default function DashboardPage() {
  const { user, clinic } = useAuth();
  const patients = useLiveQuery(
    () => (user ? db.patients.where("clinicId").equals(user.clinicId).toArray() : []),
    [user?.clinicId],
  );
  const sessions = useLiveQuery(
    () => (user ? db.sessions.where("clinicId").equals(user.clinicId).reverse().sortBy("createdAt") : []),
    [user?.clinicId],
  );

  if (!user || !clinic) return null;
  const plan = planById(clinic.planId);
  const open = (sessions ?? []).filter((s) => s.step !== "cerrada").slice(0, 4);
  const flags = (sessions ?? []).filter((s) => s.redFlags.length > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {user.role === "admin_corporativo" ? "Dirección de clínica" : "Consultorio"}
        </p>
        <h1 className="font-heading text-3xl">Hola, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-muted-foreground">
          {clinic.name} · plan {plan.name} · {plan.seats === 1 ? "un evaluador" : `hasta ${plan.seats} fisioterapeutas`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Pacientes" value={String(patients?.length ?? 0)} />
        <Stat label="Sesiones" value={String(sessions?.length ?? 0)} />
        <Stat label="Abiertas" value={String(open.length)} />
        <Stat label="Con alerta" value={String(flags)} warn={flags > 0} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="h-12 flex-1" render={<Link href="/app/sesion/nueva" />}>
          <ClipboardList />
          Nueva sesión
        </Button>
        <Button variant="outline" className="h-12 flex-1" render={<Link href="/app/pacientes/nuevo" />}>
          <UserRound />
          Alta de paciente
        </Button>
      </div>

      <section>
        <h2 className="font-heading text-xl">Sesiones abiertas</h2>
        {open.length === 0 ? (
          <p className="mt-2 rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
            No hay evaluaciones a medias. Empiece una sesión cuando el paciente esté en camilla o en domicilio.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {open.map((s) => {
              const p = patients?.find((x) => x.id === s.patientId);
              return (
                <li key={s.id}>
                  <Link
                    href={`/app/sesion/${s.id}`}
                    className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{p?.fullName ?? "Paciente"}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.chiefComplaint || "Sin motivo anotado"} · paso {s.step}
                      </p>
                    </div>
                    {s.redFlags.length > 0 && (
                      <AlertTriangle className="size-5 text-destructive" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-heading text-3xl ${warn ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
