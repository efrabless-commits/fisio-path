"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { buildEvaluationPdf, buildHomePlanPdf } from "@/lib/pdf/reports";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

type Range = "dia" | "semana" | "mes" | "todo";

function inRange(iso: string, range: Range) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const day = 86400000;
  if (range === "dia") return now - d <= day;
  if (range === "semana") return now - d <= 7 * day;
  if (range === "mes") return now - d <= 31 * day;
  return true;
}

export default function ReportsPage() {
  const { user, clinic } = useAuth();
  const [range, setRange] = useState<Range>("semana");
  const sessions = useLiveQuery(
    () => (user ? db.sessions.where("clinicId").equals(user.clinicId).reverse().sortBy("createdAt") : []),
    [user?.clinicId],
  );
  const patients = useLiveQuery(
    () => (user ? db.patients.where("clinicId").equals(user.clinicId).toArray() : []),
    [user?.clinicId],
  );
  const therapists = useLiveQuery(
    () => (user ? db.users.where("clinicId").equals(user.clinicId).toArray() : []),
    [user?.clinicId],
  );

  const visible = useMemo(() => {
    let list = sessions ?? [];
    if (user?.role !== "admin_corporativo") {
      list = list.filter((s) => s.therapistId === user?.id);
    }
    return list.filter((s) => inRange(s.createdAt, range));
  }, [sessions, range, user]);

  if (!user || !clinic) return null;

  async function exportPeriod() {
    if (!clinic) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Informe ${range} · ${clinic.name}`, 14, 18);
    doc.setFontSize(10);
    let y = 28;
    for (const s of visible) {
      const p = patients?.find((x) => x.id === s.patientId);
      const t = therapists?.find((x) => x.id === s.therapistId);
      const line = `${new Date(s.createdAt).toLocaleDateString("es")} · ${p?.fullName ?? "?"} · ${t?.name ?? "?"} · ${s.step}${s.redFlags.length ? " · ALERTA" : ""}`;
      const w = doc.splitTextToSize(line, 182);
      doc.text(w, 14, y);
      y += w.length * 6;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }
    doc.save(`informes-${range}.pdf`);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl">Informes</h1>
      <p className="text-sm text-muted-foreground">
        {user.role === "admin_corporativo"
          ? "Ve todas las evaluaciones del equipo."
          : "Sus evaluaciones. El administrador de la clínica ve las de todo el equipo."}
      </p>
      <div className="flex gap-1">
        {(["dia", "semana", "mes", "todo"] as const).map((r) => (
          <button
            key={r}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm ${range === r ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            onClick={() => setRange(r)}
          >
            {r === "dia" ? "Hoy" : r === "semana" ? "Semana" : r === "mes" ? "Mes" : "Todo"}
          </button>
        ))}
      </div>
      <Button variant="outline" className="h-11 w-full" onClick={() => void exportPeriod()}>
        Exportar listado del periodo
      </Button>
      {visible.length === 0 ? (
        <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
          No hay informes en este periodo.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((s) => {
            const p = patients?.find((x) => x.id === s.patientId);
            const t = therapists?.find((x) => x.id === s.therapistId);
            return (
              <li key={s.id} className="rounded-2xl border bg-card p-4">
                <Link href={`/app/sesion/${s.id}`} className="font-medium">
                  {p?.fullName ?? "Paciente"}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString("es")} · {t?.name} · {s.step}
                  {s.redFlags.length ? " · bandera roja" : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!p) return;
                      const therapist = t ?? user;
                      const doc = await buildEvaluationPdf(clinic, therapist, p, s);
                      doc.save(`evaluacion-${p.fullName.replace(/\s+/g, "_")}.pdf`);
                    }}
                  >
                    PDF evaluación
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!p) return;
                      const doc = await buildHomePlanPdf(clinic, p, s);
                      doc.save(`plan-casero-${p.fullName.replace(/\s+/g, "_")}.pdf`);
                      toast.success("Plan casero listo para entregar");
                    }}
                  >
                    Plan casero
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
