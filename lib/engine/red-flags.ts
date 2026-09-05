import { RED_FLAG_RULES } from "../knowledge/red-flags";
import { DIAGNOSIS_BY_ID } from "../knowledge/diagnoses";
import { TEST_BY_ID } from "../knowledge/tests";
import type { ClinicalFinding, RedFlagHit } from "../types";
import { includesNormalized, normalize } from "./text";

const OUTLIER_URGENT_IDS = new Set([
  "cauda_equina",
  "tvp",
  "guillain_barre",
  "mielopatia_cervical",
]);

export function detectRedFlags(
  text: string,
  findings: ClinicalFinding[],
  primaryDiagnosisId?: string,
): RedFlagHit[] {
  const blob = [
    text,
    ...findings.map((f) => {
      const test = TEST_BY_ID[f.testId];
      const bits = [test?.name ?? f.testId];
      if (f.positive) bits.push("positivo");
      if (f.notes) bits.push(f.notes);
      if (f.value != null) bits.push(String(f.value));
      return bits.join(" ");
    }),
  ].join("\n");

  const hits: RedFlagHit[] = [];

  for (const rule of RED_FLAG_RULES) {
    const matched = rule.keywords.filter((k) => includesNormalized(blob, k));
    if (matched.length === 0) continue;
    hits.push({
      id: rule.id,
      title: rule.title,
      severity: rule.severity,
      reason: `Hallazgos fuera de un patrón benigno: ${matched.slice(0, 4).join(", ")}.`,
      action: rule.action,
      specialty: rule.specialty,
    });
  }

  const findingNotes = findings
    .filter((f) => f.applied && (f.positive || (f.notes && f.notes.length > 4)))
    .map((f) => `${TEST_BY_ID[f.testId]?.name ?? ""} ${f.notes ?? ""}`)
    .join(" ");

  if (primaryDiagnosisId && findingNotes) {
    const diagnosis = DIAGNOSIS_BY_ID[primaryDiagnosisId];
    if (diagnosis) {
      const pattern = diagnosis.expectedPattern.map(normalize).join(" ");
      for (const other of Object.values(DIAGNOSIS_BY_ID)) {
        if (other.id === primaryDiagnosisId) continue;
        if (!OUTLIER_URGENT_IDS.has(other.id)) continue;
        const urgentHits = other.keywords.filter((k) =>
          includesNormalized(`${text} ${findingNotes}`, k),
        );
        if (urgentHits.length >= 1 && !urgentHits.every((k) => pattern.includes(normalize(k)))) {
          if (!hits.some((h) => h.id === `outlier_${other.id}`)) {
            hits.push({
              id: `outlier_${other.id}`,
              title: `Hallazgo fuera del patrón de ${diagnosis.name}`,
              severity: "urgente",
              reason: `El relato o las pruebas sugieren ${other.name} (${urgentHits.join(", ")}), que no forma parte del patrón esperado.`,
              action: other.treatment.precautions || "Derivar al médico correspondiente antes de continuar el plan de fisioterapia.",
              specialty: "Médico de referencia",
            });
          }
        }
      }
    }
  }

  const ottawa = findings.find((f) => f.testId === "ottawa_tobillo" && f.applied && f.positive);
  if (ottawa && !hits.some((h) => h.id === "fractura")) {
    hits.push({
      id: "ottawa",
      title: "Reglas de Ottawa positivas",
      severity: "urgente",
      reason: "Hay criterio de imagen para descartar fractura de tobillo o mediopié.",
      action: "Derivar a radiografía antes de cargar o continuar el tratamiento de esguince.",
      specialty: "Traumatología / urgencias",
    });
  }

  const thompson = findings.find((f) => f.testId === "thompson" && f.applied && f.positive);
  if (thompson) {
    hits.push({
      id: "aquiles_rotura",
      title: "Thompson positivo (rotura de Aquiles)",
      severity: "urgente",
      reason: "La ausencia de flexión plantar al comprimir gemelos sugiere rotura del tendón de Aquiles.",
      action: "Inmovilizar en equino y derivar a traumatología de forma urgente.",
      specialty: "Traumatología",
    });
  }

  const babinski = findings.find((f) => f.testId === "babinski" && f.applied && f.positive);
  if (babinski && !hits.some((h) => h.id === "mielopatia")) {
    hits.push({
      id: "babinski_finding",
      title: "Babinski positivo",
      severity: "pronto",
      reason: "Signo de vía piramidal. No encaja en un patrón musculoesquelético benigno.",
      action: "Derivar a neurología. Evitar manipulación cervical.",
      specialty: "Neurología",
    });
  }

  const seen = new Set<string>();
  return hits.filter((h) => {
    if (seen.has(h.title)) return false;
    seen.add(h.title);
    return true;
  });
}
