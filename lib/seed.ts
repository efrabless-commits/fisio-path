"use client";

import { hashPassword, uid } from "./crypto";
import { db } from "./db";
import { EXERCISES } from "./knowledge/exercises";
import type {
  AppUser,
  Clinic,
  ClinicalSession,
  EvolutionRecord,
  LibraryExercise,
  Patient,
} from "./types";

const SEED_FLAG = "fisio.seed.v1";

export async function ensureSeeded() {
  if (typeof window === "undefined") return;
  const existing = await db.users.count();
  if (existing > 0) {
    localStorage.setItem(SEED_FLAG, "1");
    return;
  }
  if (localStorage.getItem(SEED_FLAG) === "1" && existing > 0) return;

  const passwordHash = await hashPassword("demo123");
  const now = new Date().toISOString();

  const individualClinic: Clinic = {
    id: "clinic_individual",
    name: "Consulta Ana Ruiz",
    planId: "individual",
    createdAt: now,
    address: "Calle del Olivo 12, consultorio 3",
    phone: "+34 600 111 222",
  };

  const corpClinic: Clinic = {
    id: "clinic_norte",
    name: "Clínica Fisio Norte",
    planId: "corporativo_10",
    createdAt: now,
    address: "Avenida de la Salud 45",
    phone: "+34 600 333 444",
  };

  const ana: AppUser = {
    id: "user_ana",
    clinicId: individualClinic.id,
    name: "Ana Ruiz",
    email: "ana@consulta.fisio",
    passwordHash,
    role: "fisioterapeuta",
    active: true,
    specialty: "Musculoesquelética",
    createdAt: now,
  };

  const lucia: AppUser = {
    id: "user_lucia",
    clinicId: corpClinic.id,
    name: "Lucía Herrera",
    email: "lucia@fisionorte.fisio",
    passwordHash,
    role: "admin_corporativo",
    active: true,
    specialty: "Dirección clínica",
    createdAt: now,
  };

  const carlos: AppUser = {
    id: "user_carlos",
    clinicId: corpClinic.id,
    name: "Carlos Mendoza",
    email: "carlos@fisionorte.fisio",
    passwordHash,
    role: "fisioterapeuta",
    active: true,
    specialty: "Neurológica y adulto mayor",
    createdAt: now,
  };

  const marta: AppUser = {
    id: "user_marta",
    clinicId: corpClinic.id,
    name: "Marta Soler",
    email: "marta@fisionorte.fisio",
    passwordHash,
    role: "fisioterapeuta",
    active: true,
    specialty: "Deportiva",
    createdAt: now,
  };

  const patients: Patient[] = [
    {
      id: "pat_elena",
      clinicId: individualClinic.id,
      createdBy: ana.id,
      createdAt: now,
      updatedAt: now,
      fullName: "Elena Navarro",
      identification: "45221890A",
      birthDate: "1983-04-12",
      sex: "mujer",
      phone: "600111001",
      occupation: "Diseñadora",
      laterality: "diestra",
      antecedents: "Lumbalgias de repetición. Sin cirugía.",
      allergies: "Ninguna conocida",
      medications: "Ibuprofeno a demanda",
    },
    {
      id: "pat_jorge",
      clinicId: individualClinic.id,
      createdBy: ana.id,
      createdAt: now,
      updatedAt: now,
      fullName: "Jorge Palacios",
      identification: "20877654B",
      birthDate: "1971-09-02",
      sex: "hombre",
      phone: "600111002",
      occupation: "Electricista",
      laterality: "diestra",
      antecedents: "Diabetes tipo 2. Hombro derecho doloroso de 4 meses.",
      allergies: "Penicilina",
      medications: "Metformina 850 mg",
    },
    {
      id: "pat_rosa",
      clinicId: corpClinic.id,
      createdBy: carlos.id,
      createdAt: now,
      updatedAt: now,
      fullName: "Rosa Delgado",
      identification: "11223344C",
      birthDate: "1948-01-20",
      sex: "mujer",
      phone: "600333001",
      occupation: "Jubilada",
      laterality: "diestra",
      antecedents: "Gonartrosis. Dos caídas en el último año. Hipertensión.",
      allergies: "AINE (gastritis)",
      medications: "Enalapril, paracetamol",
      emergencyContact: "Hija — Pilar Delgado",
      emergencyPhone: "600333099",
    },
    {
      id: "pat_ivan",
      clinicId: corpClinic.id,
      createdBy: marta.id,
      createdAt: now,
      updatedAt: now,
      fullName: "Iván Ortega",
      identification: "99887766D",
      birthDate: "1996-07-15",
      sex: "hombre",
      occupation: "Jugador amateur de fútbol",
      laterality: "diestra",
      antecedents: "Esguince de tobillo derecho hace 10 días. Ottawa negativa en urgencias.",
      allergies: "Ninguna",
      medications: "Ninguno",
    },
  ];

  const exercises: LibraryExercise[] = EXERCISES.map((e) => ({
    id: `lib_${e.id}`,
    clinicId: individualClinic.id,
    catalogId: e.id,
    name: e.name,
    description: e.description,
    region: e.region,
    imageUrl: e.image,
    createdAt: now,
  })).concat(
    EXERCISES.map((e) => ({
      id: `libn_${e.id}`,
      clinicId: corpClinic.id,
      catalogId: e.id,
      name: e.name,
      description: e.description,
      region: e.region,
      imageUrl: e.image,
      createdAt: now,
    })),
  );

  const past: ClinicalSession = {
    id: "ses_elena_prev",
    clinicId: individualClinic.id,
    patientId: "pat_elena",
    therapistId: ana.id,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    setting: "consultorio",
    step: "cerrada",
    chiefComplaint: "Dolor lumbar irradiado a pierna izquierda",
    selectedTests: [{ testId: "lasegue", applied: true }],
    signsSymptoms:
      "Dolor lumbar irradiado a pierna izquierda hasta el pie, hormigueo en dorso del pie, empeora al sentarse y al toser.",
    differential: [],
    discardedIds: [],
    selectedDiagnosisIds: ["radiculopatia_lumbosacra"],
    primaryDiagnosisId: "radiculopatia_lumbosacra",
    findings: [],
    redFlags: [],
    referralGenerated: false,
    plan: {
      sessionsSuggested: 10,
      frequency: "2 a 3 sesiones por semana",
      durationMin: 50,
      agents: ["Educación", "Ejercicio dirigido"],
      exercises: [{ exerciseId: "puente", selected: true, sets: 3, reps: "10" }],
      education: "",
      precautions: "",
      notes: "",
      accepted: true,
      acceptedAt: now,
    },
    objectives: [
      { id: "obj1", text: "Caminar 20 minutos sin claudicación radicular", source: "sugerido", selected: true },
    ],
    homeExerciseIds: ["puente", "bird_dog"],
  };

  const evo1: EvolutionRecord = {
    id: uid("evo"),
    clinicId: individualClinic.id,
    patientId: "pat_elena",
    sessionId: past.id,
    therapistId: ana.id,
    date: past.createdAt,
    painVas: 7,
    rom: [{ joint: "Lumbar", movement: "Flexión", degrees: 40 }],
    strength: [{ muscle: "Tibial anterior izq.", daniels: 4, side: "izquierdo" }],
    notes: "Primera visita. Lasègue positivo.",
  };

  const evo2: EvolutionRecord = {
    id: uid("evo"),
    clinicId: individualClinic.id,
    patientId: "pat_elena",
    sessionId: past.id,
    therapistId: ana.id,
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    painVas: 4,
    rom: [{ joint: "Lumbar", movement: "Flexión", degrees: 55 }],
    strength: [{ muscle: "Tibial anterior izq.", daniels: 4, side: "izquierdo" }],
    notes: "Mejoría del dolor irradiado.",
  };

  await db.transaction(
    "rw",
    [db.clinics, db.users, db.patients, db.exercises, db.sessions, db.evolutions],
    async () => {
      await db.clinics.bulkPut([individualClinic, corpClinic]);
      await db.users.bulkPut([ana, lucia, carlos, marta]);
      await db.patients.bulkPut(patients);
      await db.exercises.bulkPut(exercises);
      await db.sessions.put(past);
      await db.evolutions.bulkPut([evo1, evo2]);
    },
  );

  localStorage.setItem(SEED_FLAG, "1");
}

export const DEMO_ACCOUNTS = [
  {
    label: "Individual — Ana Ruiz",
    email: "ana@consulta.fisio",
    password: "demo123",
    plan: "Individual",
  },
  {
    label: "Admin corporativo — Lucía Herrera",
    email: "lucia@fisionorte.fisio",
    password: "demo123",
    plan: "Equipo 10",
  },
  {
    label: "Fisioterapeuta — Carlos Mendoza",
    email: "carlos@fisionorte.fisio",
    password: "demo123",
    plan: "Equipo 10",
  },
];
