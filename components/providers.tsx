"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { currentClinic, currentUser, logout as doLogout } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { flushSyncQueue, pendingCount } from "@/lib/sync";
import type { AppUser, Clinic } from "@/lib/types";

type Ctx = {
  ready: boolean;
  user: AppUser | null;
  clinic: Clinic | null;
  online: boolean;
  pending: number;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [online, setOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [pending, setPending] = useState(0);

  const refresh = useCallback(async () => {
    await ensureSeeded();
    const u = await currentUser();
    setUser(u);
    const c = await currentClinic(u);
    setClinic(c);
    if (u) setPending(await pendingCount(u.clinicId));
  }, []);

  useEffect(() => {
    // Carga inicial desde IndexedDB y suscripción online/offline.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde Dexie
    refresh().finally(() => setReady(true));
    const on = () => {
      setOnline(true);
      void flushSyncQueue().then(() => refresh());
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const id = window.setInterval(() => {
      if (navigator.onLine) void flushSyncQueue().then(() => refresh());
    }, 20000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.clearInterval(id);
    };
  }, [refresh]);

  const logout = useCallback(async () => {
    await doLogout();
    setUser(null);
    setClinic(null);
  }, []);

  const value = useMemo(
    () => ({ ready, user, clinic, online, pending, refresh, logout }),
    [ready, user, clinic, online, pending, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}

export function useClinicPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Awaited<ReturnType<typeof db.patients.toArray>>>([]);
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setPatients(await db.patients.where("clinicId").equals(user.clinicId).toArray());
    };
    void load();
  }, [user]);
  return patients;
}
