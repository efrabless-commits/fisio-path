import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { citationList, formatCitation } from "../knowledge/citations";
import { DIAGNOSIS_BY_ID } from "../knowledge/diagnoses";
import { EXERCISE_BY_ID } from "../knowledge/exercises";
import { TEST_BY_ID } from "../knowledge/tests";
import type {
  AppUser,
  Clinic,
  ClinicalSession,
  Patient,
  RedFlagHit,
} from "../types";

async function loadFont(doc: jsPDF) {
  const [regular, bold] = await Promise.all([
    fetch("/fonts/NotoSans-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch("/fonts/NotoSans-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  const toB64 = (buf: ArrayBuffer) => {
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };
  doc.addFileToVFS("NotoSans-Regular.ttf", toB64(regular));
  doc.addFileToVFS("NotoSans-Bold.ttf", toB64(bold));
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");
  doc.setFont("NotoSans", "normal");
}

function header(doc: jsPDF, clinic: Clinic, title: string) {
  doc.setFillColor(13, 92, 86);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(16);
  doc.text("FisioConsulta", 14, 12);
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(10);
  doc.text(clinic.name, 14, 19);
  doc.setFont("NotoSans", "bold");
  doc.setFontSize(12);
  doc.text(title, 14, 25);
  doc.setTextColor(30, 30, 30);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(
      "Documento de apoyo clínico. No sustituye el juicio profesional ni una valoración médica.",
      14,
      287,
    );
    doc.text(`${i} / ${pages}`, 190, 287);
  }
}

export async function buildEvaluationPdf(
  clinic: Clinic,
  therapist: AppUser,
  patient: Patient,
  session: ClinicalSession,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await loadFont(doc);
  header(doc, clinic, "Informe de evaluación fisioterapéutica");

  doc.setFont("NotoSans", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("Paciente", 14, 38);
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(10);
  const lines = [
    `Nombre: ${patient.fullName}    Identificación: ${patient.identification}`,
    `Nacimiento: ${patient.birthDate}    Sexo: ${patient.sex}`,
    `Antecedentes: ${patient.antecedents || "—"}`,
    `Alergias: ${patient.allergies || "—"}    Medicación: ${patient.medications || "—"}`,
    `Fisioterapeuta: ${therapist.name}    Fecha: ${new Date(session.createdAt).toLocaleString("es")}`,
    `Ámbito: ${session.setting}    Motivo: ${session.chiefComplaint || "—"}`,
  ];
  let y = 44;
  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, 182);
    doc.text(wrapped, 14, y);
    y += wrapped.length * 5;
  }

  y += 4;
  doc.setFont("NotoSans", "bold");
  doc.text("Signos y síntomas", 14, y);
  y += 6;
  doc.setFont("NotoSans", "normal");
  const ss = doc.splitTextToSize(session.signsSymptoms || "—", 182);
  doc.text(ss, 14, y);
  y += ss.length * 5 + 4;

  if (session.differential.length) {
    autoTable(doc, {
      startY: y,
      head: [["Diagnóstico diferencial", "Prob.", "Para confirmar", "Para descartar"]],
      body: session.differential.map((d) => [
        d.name,
        `${d.probability} %`,
        d.rulingIn.slice(0, 2).join("; "),
        d.rulingOut.slice(0, 2).join("; "),
      ]),
      styles: { font: "NotoSans", fontSize: 8 },
      headStyles: { fillColor: [13, 92, 86] },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  const dx = session.primaryDiagnosisId
    ? DIAGNOSIS_BY_ID[session.primaryDiagnosisId]
    : undefined;
  doc.setFont("NotoSans", "bold");
  doc.text(`Diagnóstico más probable: ${dx?.name ?? "—"}`, 14, y);
  y += 8;

  if (dx) {
    doc.setFont("NotoSans", "normal");
    doc.setFontSize(8);
    const cites = citationList(dx.citationIds).map(formatCitation);
    const ct = doc.splitTextToSize(`Referencias: ${cites.join(" | ")}`, 182);
    doc.text(ct, 14, y);
    y += ct.length * 4 + 4;
  }

  if (session.findings.filter((f) => f.applied).length) {
    autoTable(doc, {
      startY: y,
      head: [["Prueba", "Resultado", "Notas"]],
      body: session.findings
        .filter((f) => f.applied)
        .map((f) => {
          const t = TEST_BY_ID[f.testId];
          let res = "Aplicada";
          if (f.positive === true) res = "Positivo";
          if (f.positive === false) res = "Negativo";
          if (f.value != null) res = String(f.value);
          return [t?.name ?? f.testId, res, f.notes ?? ""];
        }),
      styles: { font: "NotoSans", fontSize: 8 },
      headStyles: { fillColor: [13, 92, 86] },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (session.redFlags.length) {
    doc.setFont("NotoSans", "bold");
    doc.setTextColor(160, 20, 20);
    doc.text("Banderas rojas", 14, y);
    doc.setTextColor(20, 20, 20);
    y += 6;
    doc.setFont("NotoSans", "normal");
    for (const rf of session.redFlags) {
      const t = doc.splitTextToSize(`• ${rf.title}: ${rf.reason} → ${rf.action}`, 182);
      doc.text(t, 14, y);
      y += t.length * 5;
    }
  }

  if (session.plan?.accepted) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("NotoSans", "bold");
    doc.text("Plan de tratamiento aceptado", 14, y);
    y += 6;
    doc.setFont("NotoSans", "normal");
    const planLines = [
      `Sesiones: ${session.plan.sessionsSuggested}    Frecuencia: ${session.plan.frequency}    Duración: ${session.plan.durationMin} min`,
      `Agentes físicos: ${session.plan.agents.join(", ") || "—"}`,
      `Educación: ${session.plan.education}`,
      `Precauciones: ${session.plan.precautions}`,
    ];
    for (const line of planLines) {
      const w = doc.splitTextToSize(line, 182);
      doc.text(w, 14, y);
      y += w.length * 5;
    }
  }

  if (session.objectives.filter((o) => o.selected).length) {
    y += 2;
    doc.setFont("NotoSans", "bold");
    doc.text("Objetivos funcionales", 14, y);
    y += 6;
    doc.setFont("NotoSans", "normal");
    for (const o of session.objectives.filter((o) => o.selected)) {
      doc.text(`• ${o.text}`, 14, y);
      y += 5;
    }
  }

  footer(doc);
  return doc;
}

export async function buildReferralPdf(
  clinic: Clinic,
  therapist: AppUser,
  patient: Patient,
  session: ClinicalSession,
  flags: RedFlagHit[],
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await loadFont(doc);
  header(doc, clinic, "Hoja de derivación médica");
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(11);
  const dest = flags[0]?.specialty ?? "Médico de referencia";
  const body = [
    `A la atención de: ${dest}`,
    "",
    `Por medio de la presente, ${therapist.name}, fisioterapeuta de ${clinic.name}, deriva al paciente ${patient.fullName} (identificación ${patient.identification}) por la aparición de signos de alarma durante la evaluación fisioterapéutica.`,
    "",
    `Motivo de consulta: ${session.chiefComplaint || "—"}`,
    `Relato: ${session.signsSymptoms || "—"}`,
    "",
    "Banderas rojas identificadas:",
    ...flags.map((f) => `• ${f.title} (${f.severity}). ${f.reason} Acción: ${f.action}`),
    "",
    `Antecedentes: ${patient.antecedents}`,
    `Alergias: ${patient.allergies}`,
    `Medicación: ${patient.medications}`,
    "",
    "Se solicita valoración médica y las pruebas que considere oportunas. Quedo a disposición para coordinar el seguimiento.",
    "",
    `${clinic.name}    ${new Date().toLocaleDateString("es")}`,
    therapist.name,
  ];
  let y = 40;
  for (const line of body) {
    const w = doc.splitTextToSize(line, 182);
    doc.text(w, 14, y);
    y += w.length * 6;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }
  footer(doc);
  return doc;
}

export async function buildHomePlanPdf(
  clinic: Clinic,
  patient: Patient,
  session: ClinicalSession,
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await loadFont(doc);
  header(doc, clinic, "Plan de ejercicios para casa");
  doc.setFont("NotoSans", "normal");
  doc.setFontSize(11);
  doc.text(`${patient.fullName}    ${new Date().toLocaleDateString("es")}`, 14, 38);
  const ids = session.homeExerciseIds.length
    ? session.homeExerciseIds
    : session.plan?.exercises.filter((e) => e.selected).map((e) => e.exerciseId) ?? [];
  const rows = ids.map((id) => {
    const ex = EXERCISE_BY_ID[id];
    const planned = session.plan?.exercises.find((e) => e.exerciseId === id);
    return [
      ex?.name ?? id,
      planned ? `${planned.sets ?? 3} × ${planned.reps ?? "8–12"}` : "3 × 8–12",
      ex?.howTo ?? "",
    ];
  });
  autoTable(doc, {
    startY: 44,
    head: [["Ejercicio", "Dosis", "Cómo hacerlo"]],
    body: rows.length ? rows : [["—", "—", "No hay ejercicios seleccionados"]],
    styles: { font: "NotoSans", fontSize: 9 },
    headStyles: { fillColor: [13, 92, 86] },
    columnStyles: { 2: { cellWidth: 110 } },
  });
  footer(doc);
  return doc;
}
