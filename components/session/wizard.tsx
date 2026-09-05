"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { citationList, formatCitation } from "@/lib/knowledge/citations";
import { TEST_BY_ID, TESTS } from "@/lib/knowledge/tests";
import { EXERCISE_BY_ID } from "@/lib/knowledge/exercises";
import { runDifferential } from "@/lib/engine/differential";
import { prioritizeTests, testsForDiagnosis } from "@/lib/engine/tests";
import { detectRedFlags } from "@/lib/engine/red-flags";
import { draftTreatment, suggestedObjectives } from "@/lib/engine/treatment";
import { saveAndSync } from "@/lib/sync";
import { uid } from "@/lib/crypto";
import {
  buildEvaluationPdf,
  buildHomePlanPdf,
  buildReferralPdf,
} from "@/lib/pdf/reports";
import type {
  AppUser,
  Clinic,
  ClinicalFinding,
  ClinicalSession,
  EvolutionRecord,
  FunctionalObjective,
  Patient,
  SessionStep,
} from "@/lib/types";
import { ageFromBirthDate } from "@/lib/engine/text";

const STEPS: { id: SessionStep; label: string }[] = [
  { id: "ficha", label: "Ficha" },
  { id: "evaluacion", label: "Tests" },
  { id: "sintomas", label: "Síntomas" },
  { id: "diferencial", label: "Diferencial" },
  { id: "pruebas", label: "Pruebas" },
  { id: "alerta", label: "Alertas" },
  { id: "plan", label: "Plan" },
  { id: "objetivos", label: "Objetivos" },
  { id: "informe", label: "Informe" },
];

function Scale({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value?: number;
  onChange: (n: number) => void;
}) {
  const nums = [];
  for (let n = min; n <= max; n += 1) nums.push(n);
  return (
    <div className="flex flex-wrap gap-1.5">
      {nums.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`size-10 rounded-xl border text-sm font-medium ${
            value === n ? "bg-primary text-primary-foreground" : "bg-card"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function SessionWizard({
  session,
  patient,
  user,
  clinic,
}: {
  session: ClinicalSession;
  patient: Patient;
  user: AppUser;
  clinic: Clinic;
}) {
  const router = useRouter();
  const [s, setS] = useState(session);
  const [ownObjective, setOwnObjective] = useState("");
  const [pubmed, setPubmed] = useState<
    Record<string, { title: string; url: string; authors: string }[]>
  >({});
  const [evo, setEvo] = useState({
    painVas: 0,
    joint: "Lumbar",
    movement: "Flexión",
    degrees: 0,
    muscle: "Cuádriceps",
    daniels: 5,
    notes: "",
  });

  async function persist(next: ClinicalSession) {
    const row = { ...next, updatedAt: new Date().toISOString() };
    setS(row);
    await saveAndSync("sessions", user.clinicId, row);
  }

  function go(step: SessionStep) {
    void persist({ ...s, step });
  }

  const ranked = useMemo(
    () =>
      prioritizeTests(
        patient,
        `${s.chiefComplaint} ${s.signsSymptoms}`,
        s.selectedDiagnosisIds,
      ),
    [patient, s.chiefComplaint, s.signsSymptoms, s.selectedDiagnosisIds],
  );

  const age = ageFromBirthDate(patient.birthDate);
  const stepIndex = STEPS.findIndex((x) => x.id === s.step);

  return (
    <div className="space-y-5 pb-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {patient.fullName}
          {age != null ? ` · ${age} años` : ""} ·{" "}
          {s.setting === "domicilio" ? "A domicilio" : s.setting === "clinica" ? "Clínica" : "Consultorio"}
        </p>
        <h1 className="font-heading text-3xl">Evaluación</h1>
      </div>
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((st, i) => (
          <button
            key={st.id}
            type="button"
            onClick={() => go(st.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs ${
              st.id === s.step
                ? "bg-primary text-primary-foreground"
                : i < stepIndex
                  ? "bg-secondary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}. {st.label}
          </button>
        ))}
      </div>

      {s.step === "ficha" && (
        <section className="space-y-4">
          <div className="rounded-2xl border bg-card p-4 text-sm">
            <p><span className="text-muted-foreground">Identificación:</span> {patient.identification}</p>
            <p><span className="text-muted-foreground">Alergias:</span> {patient.allergies || "—"}</p>
            <p><span className="text-muted-foreground">Medicación:</span> {patient.medications || "—"}</p>
            <p><span className="text-muted-foreground">Antecedentes:</span> {patient.antecedents || "—"}</p>
          </div>
          <label className="block text-sm font-medium">Ámbito de la sesión</label>
          <div className="grid grid-cols-3 gap-2">
            {(["consultorio", "clinica", "domicilio"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`h-11 rounded-xl border capitalize ${s.setting === opt ? "border-primary bg-secondary" : "bg-card"}`}
                onClick={() => void persist({ ...s, setting: opt })}
              >
                {opt === "clinica" ? "Clínica" : opt}
              </button>
            ))}
          </div>
          <label className="block text-sm font-medium">Motivo de consulta</label>
          <Textarea
            className="min-h-28"
            value={s.chiefComplaint}
            onChange={(e) => setS({ ...s, chiefComplaint: e.target.value })}
            placeholder="Dolor lumbar de 3 semanas, irradiado a la pierna izquierda…"
          />
          <Button
            className="h-12 w-full"
            onClick={() => {
              void persist({ ...s, chiefComplaint: s.chiefComplaint, step: "evaluacion" });
            }}
          >
            Continuar a tests
          </Button>
        </section>
      )}

      {s.step === "evaluacion" && (
        <TestsStep
          ranked={ranked}
          selected={s.selectedTests}
          onToggle={(testId) => {
            const exists = s.selectedTests.find((t) => t.testId === testId);
            const selectedTests = exists
              ? s.selectedTests.map((t) =>
                  t.testId === testId ? { ...t, applied: !t.applied } : t,
                )
              : [...s.selectedTests, { testId, applied: true }];
            setS({ ...s, selectedTests });
          }}
          onNext={() => go("sintomas")}
        />
      )}

      {s.step === "sintomas" && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escriba signos y síntomas en texto libre. La app los cruza con la base
            de conocimiento (guías NICE, JOSPT, OARSI, revisiones PubMed).
          </p>
          <Textarea
            className="min-h-40"
            value={s.signsSymptoms}
            onChange={(e) => setS({ ...s, signsSymptoms: e.target.value })}
            placeholder="Dolor lumbar irradiado a pierna izquierda hasta el pie, hormigueo en dorso, empeora al sentarse y al toser. Lasègue positivo…"
          />
          <Button
            className="h-12 w-full"
            onClick={() => {
              const differential = runDifferential(
                s.signsSymptoms,
                patient,
                s.chiefComplaint,
              );
              if (differential.length === 0) {
                toast.message("No hubo coincidencias claras. Añada más detalle clínico.");
              }
              void persist({ ...s, differential, step: "diferencial" });
            }}
          >
            Calcular diferencial
          </Button>
        </section>
      )}

      {s.step === "diferencial" && (
        <DifferentialStep
          session={s}
          pubmed={pubmed}
          onSearch={async (diagnosisId, name) => {
            try {
              const res = await fetch(`/api/pubmed?q=${encodeURIComponent(name)}`);
              const data = await res.json();
              setPubmed((p) => ({ ...p, [diagnosisId]: data.results ?? [] }));
            } catch {
              toast.error("PubMed no está disponible (es un complemento opcional).");
            }
          }}
          onToggleDiscard={(id) => {
            const discardedIds = s.discardedIds.includes(id)
              ? s.discardedIds.filter((x) => x !== id)
              : [...s.discardedIds, id];
            setS({ ...s, discardedIds });
          }}
          onToggleSelect={(id) => {
            const selectedDiagnosisIds = s.selectedDiagnosisIds.includes(id)
              ? s.selectedDiagnosisIds.filter((x) => x !== id)
              : [...s.selectedDiagnosisIds, id].slice(0, 2);
            setS({ ...s, selectedDiagnosisIds });
          }}
          onPickPrimary={(id) => {
            void persist({
              ...s,
              primaryDiagnosisId: id,
              selectedDiagnosisIds: s.selectedDiagnosisIds.includes(id)
                ? s.selectedDiagnosisIds
                : [...s.selectedDiagnosisIds, id].slice(0, 2),
              step: "pruebas",
            });
          }}
        />
      )}

      {s.step === "pruebas" && (
        <FindingsStep
          session={s}
          onChange={(findings) => setS({ ...s, findings })}
          onNext={() => {
            const redFlags = detectRedFlags(
              `${s.signsSymptoms}\n${s.chiefComplaint}`,
              s.findings,
              s.primaryDiagnosisId,
            );
            void persist({
              ...s,
              redFlags,
              step: redFlags.length ? "alerta" : "plan",
              plan: s.plan ?? (s.primaryDiagnosisId ? draftTreatment(s.primaryDiagnosisId) : null),
            });
          }}
        />
      )}

      {s.step === "alerta" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
            <h2 className="font-heading text-2xl text-destructive">Banderas rojas</h2>
            <p className="mt-1 text-sm">
              Hay signos o síntomas fuera del patrón esperado. Genere la hoja de
              derivación antes de un plan de fisioterapia.
            </p>
          </div>
          {s.redFlags.map((f) => (
            <div key={f.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">{f.severity}</Badge>
                <p className="font-medium">{f.title}</p>
              </div>
              <p className="mt-2 text-sm">{f.reason}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {f.action} · {f.specialty}
              </p>
            </div>
          ))}
          <Button
            className="h-12 w-full"
            onClick={async () => {
              const doc = await buildReferralPdf(clinic, user, patient, s, s.redFlags);
              doc.save(`derivacion-${patient.fullName.replace(/\s+/g, "_")}.pdf`);
              toast.success("PDF de derivación descargado");
              await persist({ ...s, referralGenerated: true });
            }}
          >
            Descargar PDF de derivación
          </Button>
          <Button variant="outline" className="h-12 w-full" onClick={() => go("informe")}>
            Cerrar aquí (sin plan de tratamiento)
          </Button>
          <Button variant="ghost" className="h-11 w-full" onClick={() => go("plan")}>
            Continuar al plan bajo responsabilidad clínica
          </Button>
        </section>
      )}

      {s.step === "plan" && !s.plan && (
        <p className="rounded-2xl border bg-card p-4 text-sm">
          No hay un borrador de plan (suele ocurrir en diagnósticos de urgencia).
          Vuelva al diferencial o genere la derivación.
        </p>
      )}

      {s.step === "plan" && s.plan && (
        <PlanStep
          session={s}
          onChange={(plan) => setS({ ...s, plan })}
          onAccept={() => {
            const accepted = {
              ...s.plan!,
              accepted: true,
              acceptedAt: new Date().toISOString(),
            };
            const homeExerciseIds = accepted.exercises
              .filter((e) => e.selected)
              .map((e) => e.exerciseId);
            const objectives: FunctionalObjective[] = suggestedObjectives(
              s.primaryDiagnosisId ?? "",
            ).map((text) => ({
              id: uid("obj"),
              text,
              source: "sugerido" as const,
              selected: true,
            }));
            void persist({
              ...s,
              plan: accepted,
              homeExerciseIds,
              objectives,
              step: "objetivos",
            });
            toast.success("Plan aceptado. Se asoció la biblioteca de ejercicios.");
          }}
        />
      )}

      {s.step === "objetivos" && (
        <section className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Objetivos sugeridos según el diagnóstico. Añada los que el paciente
            formule con sus palabras.
          </p>
          <ul className="space-y-2">
            {s.objectives.map((o) => (
              <li key={o.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
                <Checkbox
                  checked={o.selected}
                  onCheckedChange={(v) =>
                    setS({
                      ...s,
                      objectives: s.objectives.map((x) =>
                        x.id === o.id ? { ...x, selected: Boolean(v) } : x,
                      ),
                    })
                  }
                />
                <div>
                  <p>{o.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.source === "paciente" ? "Del paciente" : "Sugerido"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <Input
              className="h-11"
              placeholder="Objetivo propio del paciente"
              value={ownObjective}
              onChange={(e) => setOwnObjective(e.target.value)}
            />
            <Button
              className="h-11"
              type="button"
              onClick={() => {
                if (!ownObjective.trim()) return;
                setS({
                  ...s,
                  objectives: [
                    ...s.objectives,
                    {
                      id: uid("obj"),
                      text: ownObjective.trim(),
                      source: "paciente",
                      selected: true,
                    },
                  ],
                });
                setOwnObjective("");
              }}
            >
              Añadir
            </Button>
          </div>
          <Button className="h-12 w-full" onClick={() => void persist({ ...s, step: "informe" })}>
            Ir al informe
          </Button>
        </section>
      )}

      {(s.step === "informe" || s.step === "cerrada") && (
        <section className="space-y-4">
          <h2 className="font-heading text-2xl">Informe y evolución</h2>
          <div className="rounded-2xl border bg-card p-4 space-y-3">
            <p className="text-sm font-medium">Registrar esta visita</p>
            <p className="text-xs text-muted-foreground">Dolor EVA 0–10</p>
            <Scale min={0} max={10} value={evo.painVas} onChange={(n) => setEvo({ ...evo, painVas: n })} />
            <div className="grid grid-cols-2 gap-2">
              <Input className="h-11" value={evo.joint} onChange={(e) => setEvo({ ...evo, joint: e.target.value })} />
              <Input className="h-11" value={evo.movement} onChange={(e) => setEvo({ ...evo, movement: e.target.value })} />
              <Input
                className="h-11"
                type="number"
                value={evo.degrees}
                onChange={(e) => setEvo({ ...evo, degrees: Number(e.target.value) })}
                placeholder="Grados"
              />
              <Input className="h-11" value={evo.muscle} onChange={(e) => setEvo({ ...evo, muscle: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">Fuerza Daniels 0–5</p>
            <Scale min={0} max={5} value={evo.daniels} onChange={(n) => setEvo({ ...evo, daniels: n })} />
            <Textarea
              value={evo.notes}
              onChange={(e) => setEvo({ ...evo, notes: e.target.value })}
              placeholder="Notas de la visita"
            />
            <Button
              variant="outline"
              className="h-11 w-full"
              onClick={async () => {
                const rec: EvolutionRecord = {
                  id: uid("evo"),
                  clinicId: user.clinicId,
                  patientId: patient.id,
                  sessionId: s.id,
                  therapistId: user.id,
                  date: new Date().toISOString(),
                  painVas: evo.painVas,
                  rom: [{ joint: evo.joint, movement: evo.movement, degrees: evo.degrees }],
                  strength: [{ muscle: evo.muscle, daniels: evo.daniels }],
                  notes: evo.notes,
                };
                await saveAndSync("evolutions", user.clinicId, rec);
                toast.success("Evolución guardada. Compárela en la ficha del paciente.");
              }}
            >
              Guardar evolución
            </Button>
          </div>
          <Button
            className="h-12 w-full"
            onClick={async () => {
              const doc = await buildEvaluationPdf(clinic, user, patient, s);
              doc.save(`evaluacion-${patient.fullName.replace(/\s+/g, "_")}.pdf`);
            }}
          >
            Descargar informe de evaluación
          </Button>
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={async () => {
              const doc = await buildHomePlanPdf(clinic, patient, s);
              doc.save(`plan-casero-${patient.fullName.replace(/\s+/g, "_")}.pdf`);
            }}
          >
            Plan casero (PDF)
          </Button>
          <Button
            variant="secondary"
            className="h-12 w-full"
            onClick={async () => {
              await persist({ ...s, step: "cerrada" });
              toast.success("Sesión cerrada");
              router.push(`/app/pacientes/${patient.id}`);
            }}
          >
            Cerrar sesión
          </Button>
        </section>
      )}
    </div>
  );
}

function TestsStep({
  ranked,
  selected,
  onToggle,
  onNext,
}: {
  ranked: ReturnType<typeof prioritizeTests>;
  selected: ClinicalSession["selectedTests"];
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  const [cat, setCat] = useState<"todos" | "neurologico" | "musculoesqueletico" | "adulto_mayor">(
    "todos",
  );
  const list = ranked.filter((t) => cat === "todos" || t.category === cat);
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Catálogo completo. Arriba aparecen los tests que más encajan con la edad y
        el relato. Marque los que va a aplicar.
      </p>
      <div className="flex gap-1 overflow-x-auto">
        {(
          [
            ["todos", "Todos"],
            ["neurologico", "Neurológicos"],
            ["musculoesqueletico", "Musculoesqueléticos"],
            ["adulto_mayor", "Adulto mayor"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${cat === id ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setCat(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {list.map((t) => {
          const on = selected.find((x) => x.testId === t.id)?.applied;
          return (
            <li key={t.id} className="rounded-2xl border bg-card p-3">
              <label className="flex items-start gap-3">
                <Checkbox checked={Boolean(on)} onCheckedChange={() => onToggle(t.id)} />
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  {t.reasons[0] && (
                    <p className="mt-1 text-xs text-primary">{t.reasons[0]}</p>
                  )}
                </div>
              </label>
            </li>
          );
        })}
      </ul>
      <Button className="h-12 w-full" onClick={onNext}>
        Continuar
      </Button>
    </section>
  );
}

function DifferentialStep({
  session,
  pubmed,
  onSearch,
  onToggleDiscard,
  onToggleSelect,
  onPickPrimary,
}: {
  session: ClinicalSession;
  pubmed: Record<string, { title: string; url: string; authors: string }[]>;
  onSearch: (id: string, name: string) => void;
  onToggleDiscard: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onPickPrimary: (id: string) => void;
}) {
  const visible = session.differential.filter((d) => !session.discardedIds.includes(d.diagnosisId));
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tres a cinco hipótesis ordenadas por probabilidad. Revise signos para
        confirmar o descartar. Cuando queden una o dos, elija la más probable.
      </p>
      {visible.length === 0 && (
        <p className="rounded-2xl border bg-card p-4 text-sm">
          Sin hipótesis. Vuelva a síntomas y añada más detalle.
        </p>
      )}
      {visible.map((d) => {
        const selected = session.selectedDiagnosisIds.includes(d.diagnosisId);
        const cites = citationList(d.citations);
        return (
          <article key={d.diagnosisId} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-xl">{d.name}</p>
                <p className="text-sm text-primary">{d.probability} % de probabilidad relativa</p>
              </div>
              {selected && <Badge>Seleccionada</Badge>}
            </div>
            {d.matched.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Coincidencias: {d.matched.slice(0, 6).join(", ")}
              </p>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-primary">Para confirmar</p>
                <ul className="mt-1 list-disc pl-4 text-sm">
                  {d.rulingIn.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Para descartar</p>
                <ul className="mt-1 list-disc pl-4 text-sm">
                  {d.rulingOut.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              {cites.map((c) => (
                <p key={c.id}>
                  <a className="underline" href={c.url} target="_blank" rel="noreferrer">
                    {formatCitation(c)}
                  </a>
                </p>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant={selected ? "secondary" : "outline"} onClick={() => onToggleSelect(d.diagnosisId)}>
                {selected ? "Quitar de la terna corta" : "Dejar en 1–2"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onToggleDiscard(d.diagnosisId)}>
                Descartar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onSearch(d.diagnosisId, d.name)}>
                PubMed (complemento)
              </Button>
              <Button size="sm" onClick={() => onPickPrimary(d.diagnosisId)}>
                Es el más probable
              </Button>
            </div>
            {pubmed[d.diagnosisId]?.length ? (
              <ul className="mt-3 space-y-1 text-xs">
                {pubmed[d.diagnosisId].map((p) => (
                  <li key={p.url}>
                    <a className="underline" href={p.url} target="_blank" rel="noreferrer">
                      {p.title} — {p.authors}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function FindingsStep({
  session,
  onChange,
  onNext,
}: {
  session: ClinicalSession;
  onChange: (f: ClinicalFinding[]) => void;
  onNext: () => void;
}) {
  const tests = useMemo(() => {
    const fromDx = session.primaryDiagnosisId
      ? testsForDiagnosis(session.primaryDiagnosisId)
      : [];
    const fromSel = session.selectedTests
      .filter((t) => t.applied)
      .map((t) => TEST_BY_ID[t.testId])
      .filter(Boolean);
    const map = new Map(fromDx.map((t) => [t.id, t]));
    for (const t of fromSel) map.set(t.id, t);
    if (!map.has("vas")) {
      const vas = TESTS.find((t) => t.id === "vas");
      if (vas) map.set("vas", vas);
    }
    return [...map.values()];
  }, [session.primaryDiagnosisId, session.selectedTests]);

  function patch(testId: string, partial: Partial<ClinicalFinding>) {
    const prev = session.findings.find((f) => f.testId === testId);
    const test = TEST_BY_ID[testId];
    const next: ClinicalFinding = {
      testId,
      applied: true,
      resultType: test?.resultType ?? "texto",
      ...prev,
      ...partial,
    };
    const findings = session.findings.some((f) => f.testId === testId)
      ? session.findings.map((f) => (f.testId === testId ? next : f))
      : [...session.findings, next];
    onChange(findings);
  }

  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pruebas específicas del diagnóstico elegido. Escalas: reflejos 0–4,
        Daniels 0–5, dolor 0–10.
      </p>
      {tests.map((t) => {
        const f = session.findings.find((x) => x.testId === t.id);
        return (
          <div key={t.id} className="rounded-2xl border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.howTo}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(f?.applied)}
                  onCheckedChange={(v) => patch(t.id, { applied: Boolean(v) })}
                />
                Aplicada
              </label>
            </div>
            {t.resultType === "positivo_negativo" && (
              <div className="flex gap-2">
                <Button
                  variant={f?.positive === true ? "default" : "outline"}
                  onClick={() => patch(t.id, { applied: true, positive: true })}
                >
                  Positivo
                </Button>
                <Button
                  variant={f?.positive === false ? "default" : "outline"}
                  onClick={() => patch(t.id, { applied: true, positive: false })}
                >
                  Negativo
                </Button>
              </div>
            )}
            {(t.resultType === "reflejo" ||
              t.resultType === "daniels" ||
              t.resultType === "vas" ||
              t.resultType === "escala" ||
              t.resultType === "rom" ||
              t.resultType === "tiempo") && (
              <div>
                <p className="mb-2 text-xs text-muted-foreground">
                  {t.scaleLabel ?? t.shortName} ({t.scaleMin ?? 0}–{t.scaleMax ?? 10})
                </p>
                {t.resultType !== "rom" && t.resultType !== "tiempo" && (t.scaleMax ?? 10) <= 10 ? (
                  <Scale
                    min={t.scaleMin ?? 0}
                    max={t.scaleMax ?? 10}
                    value={f?.value}
                    onChange={(n) => patch(t.id, { applied: true, value: n })}
                  />
                ) : (
                  <Input
                    className="h-11 max-w-40"
                    type="number"
                    value={f?.value ?? ""}
                    onChange={(e) =>
                      patch(t.id, { applied: true, value: Number(e.target.value) })
                    }
                  />
                )}
              </div>
            )}
            <Textarea
              placeholder="Notas (lado, matices, hallazgo atípico…)"
              value={f?.notes ?? ""}
              onChange={(e) => patch(t.id, { notes: e.target.value, applied: true })}
            />
          </div>
        );
      })}
      <Button className="h-12 w-full" onClick={onNext}>
        Comprobar banderas rojas
      </Button>
    </section>
  );
}

function PlanStep({
  session,
  onChange,
  onAccept,
}: {
  session: ClinicalSession;
  onChange: (p: NonNullable<ClinicalSession["plan"]>) => void;
  onAccept: () => void;
}) {
  const plan = session.plan!;
  return (
    <section className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Borrador generado a partir del diagnóstico y de las guías citadas. Ajuste
        lo que necesite y acepte para vincular la biblioteca de ejercicios.
      </p>
      <label className="text-sm">Sesiones sugeridas</label>
      <Input
        className="h-11"
        type="number"
        value={plan.sessionsSuggested}
        onChange={(e) => onChange({ ...plan, sessionsSuggested: Number(e.target.value) })}
      />
      <label className="text-sm">Frecuencia</label>
      <Input className="h-11" value={plan.frequency} onChange={(e) => onChange({ ...plan, frequency: e.target.value })} />
      <label className="text-sm">Duración (min)</label>
      <Input
        className="h-11"
        type="number"
        value={plan.durationMin}
        onChange={(e) => onChange({ ...plan, durationMin: Number(e.target.value) })}
      />
      <label className="text-sm">Agentes físicos (uno por línea)</label>
      <Textarea
        value={plan.agents.join("\n")}
        onChange={(e) => onChange({ ...plan, agents: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })}
      />
      <label className="text-sm">Educación</label>
      <Textarea value={plan.education} onChange={(e) => onChange({ ...plan, education: e.target.value })} />
      <label className="text-sm">Precauciones</label>
      <Textarea value={plan.precautions} onChange={(e) => onChange({ ...plan, precautions: e.target.value })} />
      <h3 className="font-heading text-lg">Ejercicios de la biblioteca</h3>
      <ul className="space-y-2">
        {plan.exercises.map((ex) => {
          const cat = EXERCISE_BY_ID[ex.exerciseId];
          return (
            <li key={ex.exerciseId} className="flex gap-3 rounded-2xl border bg-card p-3">
              {cat?.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.image} alt="" className="h-16 w-24 rounded-lg object-cover" />
              )}
              <div className="flex-1">
                <label className="flex items-center gap-2 font-medium">
                  <Checkbox
                    checked={ex.selected}
                    onCheckedChange={(v) =>
                      onChange({
                        ...plan,
                        exercises: plan.exercises.map((x) =>
                          x.exerciseId === ex.exerciseId ? { ...x, selected: Boolean(v) } : x,
                        ),
                      })
                    }
                  />
                  {cat?.name ?? ex.exerciseId}
                </label>
                <p className="text-sm text-muted-foreground">{cat?.howTo}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <Button className="h-12 w-full" onClick={onAccept} disabled={plan.sessionsSuggested === 0}>
        Aceptar plan
      </Button>
    </section>
  );
}
