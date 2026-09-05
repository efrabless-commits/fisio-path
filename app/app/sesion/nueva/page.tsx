"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useAuth } from "@/components/providers";
import { db } from "@/lib/db";
import { uid } from "@/lib/crypto";
import { saveAndSync } from "@/lib/sync";
import type { ClinicalSession } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function NewSessionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const patients = useLiveQuery(
    () => (user ? db.patients.where("clinicId").equals(user.clinicId).toArray() : []),
    [user?.clinicId],
  );
  const [patientId, setPatientId] = useState<string>("");
  const [setting, setSetting] = useState<ClinicalSession["setting"]>("consultorio");

  async function create() {
    if (!user || !patientId) return;
    const now = new Date().toISOString();
    const session: ClinicalSession = {
      id: uid("ses"),
      clinicId: user.clinicId,
      patientId,
      therapistId: user.id,
      createdAt: now,
      updatedAt: now,
      setting,
      step: "ficha",
      chiefComplaint: "",
      selectedTests: [],
      signsSymptoms: "",
      differential: [],
      discardedIds: [],
      selectedDiagnosisIds: [],
      findings: [],
      redFlags: [],
      referralGenerated: false,
      plan: null,
      objectives: [],
      homeExerciseIds: [],
    };
    await saveAndSync("sessions", user.clinicId, session);
    router.push(`/app/sesion/${session.id}`);
  }

  const list = (patients ?? []).sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl">Nueva sesión</h1>
      <p className="text-sm text-muted-foreground">
        Elige paciente y ámbito. En domicilio el modo offline cubre toda la evaluación.
      </p>
      {list.length === 0 ? (
        <p className="rounded-2xl border bg-card p-4 text-sm">
          No hay fichas.{" "}
          <Link className="text-primary underline" href="/app/pacientes/nuevo">
            Crear paciente
          </Link>
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setPatientId(p.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${
                  patientId === p.id ? "border-primary bg-secondary" : "bg-card"
                }`}
              >
                <p className="font-medium">{p.fullName}</p>
                <p className="text-sm text-muted-foreground">{p.identification}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-3 gap-2">
        {(["consultorio", "clinica", "domicilio"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            className={`h-11 rounded-xl border capitalize ${setting === opt ? "border-primary bg-secondary" : "bg-card"}`}
            onClick={() => setSetting(opt)}
          >
            {opt === "clinica" ? "Clínica" : opt}
          </button>
        ))}
      </div>
      <Button className="h-12 w-full" disabled={!patientId} onClick={() => void create()}>
        Empezar evaluación
      </Button>
    </div>
  );
}
