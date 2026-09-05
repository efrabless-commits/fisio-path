import { DIAGNOSIS_BY_ID } from "../knowledge/diagnoses";
import { EXERCISE_BY_ID } from "../knowledge/exercises";
import type { TreatmentPlan } from "../types";

export function draftTreatment(diagnosisId: string): TreatmentPlan {
  const d = DIAGNOSIS_BY_ID[diagnosisId];
  if (!d) {
    return {
      sessionsSuggested: 8,
      frequency: "2 sesiones por semana",
      durationMin: 45,
      agents: ["Educación", "Ejercicio terapéutico"],
      exercises: [],
      education: "Ajustar según reevaluación clínica.",
      precautions: "Vigilar banderas rojas en cada visita.",
      notes: "",
      accepted: false,
    };
  }

  return {
    sessionsSuggested: d.treatment.sessions,
    frequency: d.treatment.frequency,
    durationMin: d.treatment.durationMin,
    agents: [...d.treatment.agents],
    exercises: d.treatment.exerciseIds
      .filter((id) => EXERCISE_BY_ID[id])
      .map((id) => ({
        exerciseId: id,
        sets: 3,
        reps: "8–12",
        selected: true,
      })),
    education: d.treatment.education,
    precautions: d.treatment.precautions,
    notes: "",
    accepted: false,
  };
}

export function suggestedObjectives(diagnosisId: string) {
  return DIAGNOSIS_BY_ID[diagnosisId]?.objectives ?? [
    "Reducir el dolor en las actividades cotidianas",
    "Recuperar independencia funcional",
  ];
}
