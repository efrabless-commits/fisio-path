"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/providers";
import { uid } from "@/lib/crypto";
import { saveAndSync } from "@/lib/sync";
import type { Patient } from "@/lib/types";

export default function NewPatientPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    const patient: Patient = {
      id: uid("pat"),
      clinicId: user.clinicId,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
      fullName: String(fd.get("fullName")).trim(),
      identification: String(fd.get("identification")).trim(),
      birthDate: String(fd.get("birthDate")),
      sex: String(fd.get("sex")) as Patient["sex"],
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      occupation: String(fd.get("occupation") || ""),
      laterality: (String(fd.get("laterality") || "diestra") as Patient["laterality"]),
      address: String(fd.get("address") || ""),
      emergencyContact: String(fd.get("emergencyContact") || ""),
      emergencyPhone: String(fd.get("emergencyPhone") || ""),
      antecedents: String(fd.get("antecedents") || ""),
      allergies: String(fd.get("allergies") || ""),
      medications: String(fd.get("medications") || ""),
      notes: String(fd.get("notes") || ""),
    };
    setBusy(true);
    try {
      await saveAndSync("patients", user.clinicId, patient);
      toast.success("Ficha creada");
      router.replace(`/app/pacientes/${patient.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-3xl">Nueva ficha</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field id="fullName" label="Nombre completo" required />
        <Field id="identification" label="Identificación / DNI" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="birthDate">Fecha de nacimiento</Label>
            <Input id="birthDate" name="birthDate" type="date" className="h-11" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sex">Sexo</Label>
            <select id="sex" name="sex" className="h-11 w-full rounded-lg border bg-transparent px-2.5" defaultValue="mujer">
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="otro">Otro</option>
              <option value="no_especifica">No especifica</option>
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="phone" label="Teléfono" />
          <Field id="email" label="Correo" type="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="occupation" label="Ocupación" />
          <div className="space-y-1.5">
            <Label htmlFor="laterality">Lateralidad</Label>
            <select id="laterality" name="laterality" className="h-11 w-full rounded-lg border bg-transparent px-2.5" defaultValue="diestra">
              <option value="diestra">Diestra</option>
              <option value="zurda">Zurda</option>
              <option value="ambidiestra">Ambidiestra</option>
            </select>
          </div>
        </div>
        <Field id="address" label="Dirección" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="emergencyContact" label="Contacto de emergencia" />
          <Field id="emergencyPhone" label="Teléfono de emergencia" />
        </div>
        <Area id="antecedents" label="Antecedentes" />
        <Area id="allergies" label="Alergias" />
        <Area id="medications" label="Medicamentos" />
        <Area id="notes" label="Notas" />
        <Button type="submit" className="h-12 w-full" disabled={busy}>
          Guardar ficha
        </Button>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  type = "text",
}: {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} required={required} className="h-11" />
    </div>
  );
}

function Area({ id, label }: { id: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={id} className="min-h-24" />
    </div>
  );
}
