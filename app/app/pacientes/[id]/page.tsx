"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/components/providers";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ageFromBirthDate } from "@/lib/engine/text";
import { uid } from "@/lib/crypto";
import { saveAndSync } from "@/lib/sync";
import { useRouter } from "next/navigation";
import type { ClinicalSession } from "@/lib/types";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const patient = useLiveQuery(() => db.patients.get(id), [id]);
  const sessions = useLiveQuery(
    () => db.sessions.where("patientId").equals(id).reverse().sortBy("createdAt"),
    [id],
  );
  const evolutions = useLiveQuery(
    () => db.evolutions.where("patientId").equals(id).sortBy("date"),
    [id],
  );

  if (!patient || (user && patient.clinicId !== user.clinicId)) {
    return <p className="text-muted-foreground">Cargando ficha…</p>;
  }

  const age = ageFromBirthDate(patient.birthDate);
  const pains = evolutions ?? [];

  async function startSession() {
    if (!user || !patient) return;
    const now = new Date().toISOString();
    const session: ClinicalSession = {
      id: uid("ses"),
      clinicId: user.clinicId,
      patientId: patient.id,
      therapistId: user.id,
      createdAt: now,
      updatedAt: now,
      setting: "consultorio",
      step: "evaluacion",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">{patient.fullName}</h1>
        <p className="text-muted-foreground">
          {patient.identification}
          {age != null ? ` · ${age} años` : ""} · {patient.occupation || "sin ocupación"}
        </p>
      </div>
      <Button className="h-12 w-full sm:w-auto" onClick={() => void startSession()}>
        Nueva evaluación
      </Button>

      <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-2">
        <Item label="Teléfono" value={patient.phone} />
        <Item label="Lateralidad" value={patient.laterality} />
        <Item label="Alergias" value={patient.allergies} />
        <Item label="Medicamentos" value={patient.medications} />
        <div className="sm:col-span-2">
          <Item label="Antecedentes" value={patient.antecedents} />
        </div>
      </section>

      <section>
        <h2 className="font-heading text-xl">Evolución</h2>
        {pains.length < 2 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Hace falta más de una visita con dolor, rango o fuerza para comparar.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-2xl border bg-card p-4">
            <svg viewBox={`0 0 ${Math.max(320, pains.length * 80)} 120`} className="h-28 w-full">
              {pains.map((e, i) => {
                const x = 30 + i * (280 / Math.max(pains.length - 1, 1));
                const y = 100 - e.painVas * 8;
                const next = pains[i + 1];
                return (
                  <g key={e.id}>
                    {next && (
                      <line
                        x1={x}
                        y1={y}
                        x2={30 + (i + 1) * (280 / Math.max(pains.length - 1, 1))}
                        y2={100 - next.painVas * 8}
                        stroke="#0d5c56"
                        strokeWidth="3"
                      />
                    )}
                    <circle cx={x} cy={y} r="5" fill="#0d5c56" />
                    <text x={x} y={y - 10} fontSize="10" textAnchor="middle" fill="#1d3d3a">
                      {e.painVas}
                    </text>
                  </g>
                );
              })}
            </svg>
            <p className="text-xs text-muted-foreground">Dolor EVA entre visitas</p>
            <ul className="mt-3 space-y-1 text-sm">
              {pains.map((e) => (
                <li key={e.id}>
                  {new Date(e.date).toLocaleDateString("es")} · EVA {e.painVas}
                  {e.rom[0] ? ` · ${e.rom[0].joint} ${e.rom[0].movement} ${e.rom[0].degrees}°` : ""}
                  {e.strength[0] ? ` · ${e.strength[0].muscle} ${e.strength[0].daniels}/5` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-heading text-xl">Sesiones</h2>
        <ul className="mt-2 space-y-2">
          {(sessions ?? []).map((s) => (
            <li key={s.id}>
              <Link href={`/app/sesion/${s.id}`} className="block rounded-xl border bg-card px-4 py-3">
                <p className="font-medium">{new Date(s.createdAt).toLocaleString("es")}</p>
                <p className="text-sm text-muted-foreground">
                  {s.chiefComplaint || "Sin motivo"} · {s.step}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value || "—"}</p>
    </div>
  );
}
