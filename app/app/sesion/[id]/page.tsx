"use client";

import { useParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useAuth } from "@/components/providers";
import { SessionWizard } from "@/components/session/wizard";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const { user, clinic } = useAuth();
  const session = useLiveQuery(() => db.sessions.get(id), [id]);
  const patient = useLiveQuery(
    () => (session ? db.patients.get(session.patientId) : undefined),
    [session?.patientId],
  );

  if (!user || !clinic) return null;
  if (!session || session.clinicId !== user.clinicId) {
    return <p className="text-muted-foreground">Cargando sesión…</p>;
  }
  if (!patient) return <p className="text-muted-foreground">Cargando ficha…</p>;

  return (
    <SessionWizard
      key={session.id}
      session={session}
      patient={patient}
      user={user}
      clinic={clinic}
    />
  );
}
