import { DIAGNOSES, type Diagnosis } from "../knowledge/diagnoses";
import type { DifferentialOption, Patient } from "../types";
import { ageFromBirthDate, includesNormalized } from "./text";

function scoreDiagnosis(diagnosis: Diagnosis, text: string, age: number | null) {
  let score = 0;
  const matched: string[] = [];

  for (const kw of diagnosis.keywords) {
    if (includesNormalized(text, kw)) {
      score += 2;
      matched.push(kw);
    }
  }
  for (const s of diagnosis.signs) {
    if (includesNormalized(text, s.text)) {
      score += s.weight;
      matched.push(s.text);
    }
  }
  for (const s of diagnosis.symptoms) {
    if (includesNormalized(text, s.text)) {
      score += s.weight;
      matched.push(s.text);
    }
  }

  if (age != null) {
    if (diagnosis.ageHint === "mayor" && age >= 65) score += 2;
    if (diagnosis.ageHint === "adulto" && age >= 18 && age < 65) score += 1;
    if (diagnosis.ageHint === "mayor" && age < 45) score -= 1;
  }

  const unique = [...new Set(matched)];
  return { score, matched: unique };
}

function toProbabilities(rows: { id: string; score: number }[]) {
  const max = Math.max(...rows.map((r) => r.score), 1);
  const shifted = rows.map((r) => Math.exp((r.score / max) * 3));
  const sum = shifted.reduce((a, b) => a + b, 0);
  return rows.map((r, i) => ({
    ...r,
    probability: Math.round((shifted[i] / sum) * 100),
  }));
}

export function runDifferential(
  signsSymptoms: string,
  patient?: Pick<Patient, "birthDate" | "antecedents" | "allergies" | "medications"> | null,
  extraContext = "",
): DifferentialOption[] {
  const blob = [
    signsSymptoms,
    extraContext,
    patient?.antecedents ?? "",
    patient?.medications ?? "",
  ].join("\n");

  const age = patient ? ageFromBirthDate(patient.birthDate) : null;

  const scored = DIAGNOSES.map((d) => {
    const { score, matched } = scoreDiagnosis(d, blob, age);
    return { diagnosis: d, score, matched };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  if (top.length === 0) return [];

  const probs = toProbabilities(top.map((t) => ({ id: t.diagnosis.id, score: t.score })));

  return top.map((t, i) => ({
    diagnosisId: t.diagnosis.id,
    name: t.diagnosis.name,
    probability: probs[i].probability,
    score: t.score,
    matched: t.matched,
    rulingIn: t.diagnosis.rulingIn,
    rulingOut: t.diagnosis.rulingOut,
    citations: t.diagnosis.citationIds,
  }));
}
