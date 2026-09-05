"use client";

import { db, enqueue } from "./db";
import { getSupabase } from "./supabase";

export async function flushSyncQueue() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { flushed: 0, error: "offline" as const };

  const pending = (await db.syncQueue.toArray()).filter((o) => !o.synced);

  const supabase = getSupabase();
  let flushed = 0;

  for (const op of pending) {
    try {
      if (supabase) {
        if (op.action === "delete") {
          const payload = op.payload as { id: string };
          await supabase.from(op.table).delete().eq("id", payload.id);
        } else {
          await supabase.from(op.table).upsert(op.payload as never);
        }
      } else {
        await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(op),
        });
      }
      await db.syncQueue.update(op.id, { synced: true, lastError: undefined });
      flushed += 1;
    } catch (err) {
      await db.syncQueue.update(op.id, {
        lastError: err instanceof Error ? err.message : "Error de sincronización",
      });
    }
  }

  return { flushed, error: null };
}

export async function saveAndSync<T extends { id: string }>(
  table: "clinics" | "users" | "patients" | "sessions" | "evolutions" | "exercises",
  clinicId: string,
  row: T,
) {
  // Dexie table names match
  switch (table) {
    case "clinics":
      await db.clinics.put(row as never);
      break;
    case "users":
      await db.users.put(row as never);
      break;
    case "patients":
      await db.patients.put(row as never);
      break;
    case "sessions":
      await db.sessions.put(row as never);
      break;
    case "evolutions":
      await db.evolutions.put(row as never);
      break;
    case "exercises":
      await db.exercises.put(row as never);
      break;
  }
  await enqueue(clinicId, table, "upsert", row);
  void flushSyncQueue();
}

export async function pendingCount(clinicId: string) {
  const all = await db.syncQueue.where("clinicId").equals(clinicId).toArray();
  return all.filter((o) => !o.synced).length;
}
