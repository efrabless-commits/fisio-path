export type PlanId =
  | "individual"
  | "corporativo_5"
  | "corporativo_10"
  | "corporativo_20"
  | "corporativo_30";

export type UserRole = "fisioterapeuta" | "admin_corporativo";

export type TestCategory = "neurologico" | "musculoesqueletico" | "adulto_mayor";

export type ResultType =
  | "positivo_negativo"
  | "reflejo"
  | "daniels"
  | "vas"
  | "rom"
  | "escala"
  | "tiempo"
  | "texto";

export type Region =
  | "cervical"
  | "dorsal"
  | "lumbar"
  | "hombro"
  | "codo"
  | "muneca"
  | "mano"
  | "cadera"
  | "rodilla"
  | "tobillo"
  | "pie"
  | "miembro_superior"
  | "miembro_inferior"
  | "equilibrio"
  | "global";

export type SessionStep =
  | "ficha"
  | "evaluacion"
  | "sintomas"
  | "diferencial"
  | "pruebas"
  | "alerta"
  | "plan"
  | "objetivos"
  | "informe"
  | "cerrada";

export type CitationType = "guia" | "revision" | "ensayo" | "consenso" | "pubmed";

export type Clinic = {
  id: string;
  name: string;
  planId: PlanId;
  createdAt: string;
  address?: string;
  phone?: string;
};

export type AppUser = {
  id: string;
  clinicId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  specialty?: string;
  createdAt: string;
};

export type Patient = {
  id: string;
  clinicId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  identification: string;
  birthDate: string;
  sex: "mujer" | "hombre" | "otro" | "no_especifica";
  phone?: string;
  email?: string;
  occupation?: string;
  laterality?: "diestra" | "zurda" | "ambidiestra";
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  antecedents: string;
  allergies: string;
  medications: string;
  notes?: string;
};

export type SelectedTest = {
  testId: string;
  applied: boolean;
  notes?: string;
};

export type ClinicalFinding = {
  testId: string;
  applied: boolean;
  resultType: ResultType;
  positive?: boolean;
  value?: number;
  side?: "izquierdo" | "derecho" | "bilateral" | "no_aplica";
  notes?: string;
};

export type DifferentialOption = {
  diagnosisId: string;
  name: string;
  probability: number;
  score: number;
  matched: string[];
  rulingIn: string[];
  rulingOut: string[];
  citations: string[];
};

export type RedFlagHit = {
  id: string;
  title: string;
  severity: "urgente" | "pronto";
  reason: string;
  action: string;
  specialty: string;
};

export type TreatmentExercise = {
  exerciseId: string;
  sets?: number;
  reps?: string;
  selected: boolean;
};

export type TreatmentPlan = {
  sessionsSuggested: number;
  frequency: string;
  durationMin: number;
  agents: string[];
  exercises: TreatmentExercise[];
  education: string;
  precautions: string;
  notes: string;
  accepted: boolean;
  acceptedAt?: string;
};

export type FunctionalObjective = {
  id: string;
  text: string;
  source: "sugerido" | "paciente";
  selected: boolean;
};

export type EvolutionRecord = {
  id: string;
  clinicId: string;
  patientId: string;
  sessionId: string;
  therapistId: string;
  date: string;
  painVas: number;
  rom: { joint: string; movement: string; degrees: number }[];
  strength: { muscle: string; daniels: number; side?: string }[];
  notes?: string;
};

export type ClinicalSession = {
  id: string;
  clinicId: string;
  patientId: string;
  therapistId: string;
  createdAt: string;
  updatedAt: string;
  setting: "consultorio" | "clinica" | "domicilio";
  step: SessionStep;
  chiefComplaint: string;
  selectedTests: SelectedTest[];
  signsSymptoms: string;
  differential: DifferentialOption[];
  discardedIds: string[];
  selectedDiagnosisIds: string[];
  primaryDiagnosisId?: string;
  findings: ClinicalFinding[];
  redFlags: RedFlagHit[];
  referralGenerated: boolean;
  plan: TreatmentPlan | null;
  objectives: FunctionalObjective[];
  homeExerciseIds: string[];
};

export type LibraryExercise = {
  id: string;
  clinicId: string;
  catalogId?: string;
  name: string;
  description: string;
  region: Region;
  imageUrl?: string;
  videoUrl?: string;
  localImage?: string;
  uploadedBy?: string;
  createdAt: string;
};

export type SyncOp = {
  id: string;
  clinicId: string;
  createdAt: string;
  table: string;
  action: "upsert" | "delete";
  payload: unknown;
  synced: boolean;
  lastError?: string;
};
