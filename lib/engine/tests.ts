import { TESTS, type CatalogTest } from "../knowledge/tests";
import { DIAGNOSIS_BY_ID } from "../knowledge/diagnoses";
import type { Patient } from "../types";
import { ageFromBirthDate, includesNormalized, REGION_HINTS } from "./text";

export type RankedTest = CatalogTest & { priority: number; reasons: string[] };

export function inferRegions(text: string) {
  const regions: string[] = [];
  for (const [region, hints] of Object.entries(REGION_HINTS)) {
    if (hints.some((h) => includesNormalized(text, h))) regions.push(region);
  }
  return regions;
}

export function prioritizeTests(
  patient: Pick<Patient, "birthDate" | "antecedents"> | null,
  complaint: string,
  diagnosisIds: string[] = [],
): RankedTest[] {
  const age = patient ? ageFromBirthDate(patient.birthDate) : null;
  const blob = `${complaint} ${patient?.antecedents ?? ""}`;
  const regions = inferRegions(blob);
  const suggested = new Set(
    diagnosisIds.flatMap((id) => DIAGNOSIS_BY_ID[id]?.suggestedTests ?? []),
  );

  return TESTS.map((test) => {
    let priority = 10;
    const reasons: string[] = [];

    if (test.id === "vas") {
      priority += 20;
      reasons.push("Dolor en toda evaluación");
    }

    if (age != null && age >= 65 && test.category === "adulto_mayor") {
      priority += 18;
      reasons.push("Priorizado por edad (≥65 años)");
    }

    if (age != null && age < 65 && test.category === "adulto_mayor") {
      priority -= 8;
    }

    const regionHit = test.regions.some(
      (r) => r === "global" || regions.includes(r),
    );
    if (regionHit && test.regions[0] !== "global") {
      priority += 12;
      reasons.push("Coincide con la región del motivo de consulta");
    }

    if (test.indications.some((ind) => includesNormalized(blob, ind))) {
      priority += 10;
      reasons.push("Indicación acorde al relato");
    }

    if (suggested.has(test.id)) {
      priority += 22;
      reasons.push("Recomendado para el diagnóstico seleccionado");
    }

    return { ...test, priority, reasons };
  }).sort((a, b) => b.priority - a.priority);
}

export function testsForDiagnosis(diagnosisId: string) {
  const d = DIAGNOSIS_BY_ID[diagnosisId];
  if (!d) return [];
  return d.suggestedTests
    .map((id) => TESTS.find((t) => t.id === id))
    .filter(Boolean) as CatalogTest[];
}
