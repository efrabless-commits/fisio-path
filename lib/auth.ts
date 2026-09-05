"use client";

import { hashPassword, uid } from "./crypto";
import { db } from "./db";
import { planById } from "./plans";
import { saveAndSync } from "./sync";
import type { AppUser, Clinic, PlanId, UserRole } from "./types";

const AUTH_KEY = "fisio.user";

export function readStoredUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEY);
}

export async function currentUser(): Promise<AppUser | null> {
  const id = readStoredUserId();
  if (!id) return null;
  return (await db.users.get(id)) ?? null;
}

export async function currentClinic(user?: AppUser | null) {
  const u = user ?? (await currentUser());
  if (!u) return null;
  return (await db.clinics.get(u.clinicId)) ?? null;
}

export async function login(email: string, password: string) {
  const hash = await hashPassword(password);
  const user = await db.users.where("email").equals(email.trim().toLowerCase()).first();
  if (!user || user.passwordHash !== hash) {
    throw new Error("Correo o contraseña incorrectos");
  }
  if (!user.active) throw new Error("Esta cuenta está desactivada");
  localStorage.setItem(AUTH_KEY, user.id);
  await db.auth.put({ id: "current", userId: user.id, clinicId: user.clinicId });
  return user;
}

export async function logout() {
  localStorage.removeItem(AUTH_KEY);
  await db.auth.delete("current");
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  clinicName: string;
  planId: PlanId;
  role?: UserRole;
}) {
  const email = input.email.trim().toLowerCase();
  const exists = await db.users.where("email").equals(email).first();
  if (exists) throw new Error("Ya existe una cuenta con ese correo");

  const passwordHash = await hashPassword(input.password);
  const clinicId = uid("clinic");
  const userId = uid("user");
  const now = new Date().toISOString();
  const plan = planById(input.planId);

  const clinic: Clinic = {
    id: clinicId,
    name: input.clinicName.trim(),
    planId: input.planId,
    createdAt: now,
  };

  const role: UserRole =
    input.role ?? (plan.id === "individual" ? "fisioterapeuta" : "admin_corporativo");

  const user: AppUser = {
    id: userId,
    clinicId,
    name: input.name.trim(),
    email,
    passwordHash,
    role,
    active: true,
    createdAt: now,
  };

  await saveAndSync("clinics", clinicId, clinic);
  await saveAndSync("users", clinicId, user);
  localStorage.setItem(AUTH_KEY, user.id);
  await db.auth.put({ id: "current", userId, clinicId });
  return { user, clinic };
}

export async function addTherapist(input: {
  clinicId: string;
  name: string;
  email: string;
  password: string;
  specialty?: string;
}) {
  const clinic = await db.clinics.get(input.clinicId);
  if (!clinic) throw new Error("Clínica no encontrada");
  const plan = planById(clinic.planId);
  const current = await db.users.where("clinicId").equals(input.clinicId).count();
  if (current >= plan.seats) {
    throw new Error(
      `El plan ${plan.name} admite ${plan.seats} fisioterapeutas. Amplíe el plan para añadir más.`,
    );
  }
  const email = input.email.trim().toLowerCase();
  if (await db.users.where("email").equals(email).first()) {
    throw new Error("Ese correo ya está registrado");
  }
  const user: AppUser = {
    id: uid("user"),
    clinicId: input.clinicId,
    name: input.name.trim(),
    email,
    passwordHash: await hashPassword(input.password),
    role: "fisioterapeuta",
    active: true,
    specialty: input.specialty,
    createdAt: new Date().toISOString(),
  };
  await saveAndSync("users", input.clinicId, user);
  return user;
}

export function canSeeClinicReports(user: AppUser) {
  return user.role === "admin_corporativo";
}
