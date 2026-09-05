"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ageFromBirthDate } from "@/lib/engine/text";

export default function PatientsPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const patients = useLiveQuery(
    () => (user ? db.patients.where("clinicId").equals(user.clinicId).toArray() : []),
    [user?.clinicId],
  );
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (patients ?? [])
      .filter(
        (p) =>
          !t ||
          p.fullName.toLowerCase().includes(t) ||
          p.identification.toLowerCase().includes(t),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
  }, [patients, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Fichas de esta clínica, aisladas del resto.</p>
        </div>
        <Button className="h-11" render={<Link href="/app/pacientes/nuevo" />}>
          Alta
        </Button>
      </div>
      <Input
        className="h-11"
        placeholder="Buscar por nombre o identificación"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          {q ? "Ninguna ficha coincide." : "Aún no hay pacientes. Cree la primera ficha para empezar una evaluación."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => {
            const age = ageFromBirthDate(p.birthDate);
            return (
              <li key={p.id}>
                <Link
                  href={`/app/pacientes/${p.id}`}
                  className="block rounded-2xl border bg-card px-4 py-3"
                >
                  <p className="font-medium">{p.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.identification}
                    {age != null ? ` · ${age} años` : ""} · {p.occupation || "sin ocupación"}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
