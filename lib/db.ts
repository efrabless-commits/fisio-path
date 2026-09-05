import Dexie, { type EntityTable } from "dexie";
import type {
  AppUser,
  Clinic,
  ClinicalSession,
  EvolutionRecord,
  LibraryExercise,
  Patient,
  SyncOp,
} from "./types";

export type SessionAuth = {
  id: "current";
  userId: string;
  clinicId: string;
};

class FisioDB extends Dexie {
  clinics!: EntityTable<Clinic, "id">;
  users!: EntityTable<AppUser, "id">;
  patients!: EntityTable<Patient, "id">;
  sessions!: EntityTable<ClinicalSession, "id">;
  evolutions!: EntityTable<EvolutionRecord, "id">;
  exercises!: EntityTable<LibraryExercise, "id">;
  syncQueue!: EntityTable<SyncOp, "id">;
  auth!: EntityTable<SessionAuth, "id">;

  constructor() {
    super("fisio_consultorio");
    this.version(1).stores({
      clinics: "id, planId",
      users: "id, clinicId, email, role",
      patients: "id, clinicId, createdBy, fullName, identification",
      sessions: "id, clinicId, patientId, therapistId, createdAt, step",
      evolutions: "id, clinicId, patientId, sessionId, date",
      exercises: "id, clinicId, catalogId, name",
      syncQueue: "id, clinicId, synced, createdAt",
      auth: "id",
    });
  }
}

export const db = new FisioDB();

export async function enqueue(clinicId: string, table: string, action: SyncOp["action"], payload: unknown) {
  await db.syncQueue.add({
    id: `sync_${crypto.randomUUID()}`,
    clinicId,
    createdAt: new Date().toISOString(),
    table,
    action,
    payload,
    synced: false,
  });
}
