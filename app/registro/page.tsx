"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAccount } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/types";
import { useAuth } from "@/components/providers";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();
  const initial = (params.get("plan") as PlanId) || "individual";
  const [planId, setPlanId] = useState<PlanId>(
    PLANS.some((p) => p.id === initial) ? initial : "individual",
  );
  const [busy, setBusy] = useState(false);
  const plan = useMemo(() => PLANS.find((p) => p.id === planId)!, [planId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await ensureSeeded();
      await registerAccount({
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        password: String(fd.get("password")),
        clinicName: String(fd.get("clinic")),
        planId,
      });
      await refresh();
      toast.success("Clínica creada. Bienvenida al consultorio.");
      router.replace("/app");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
      <Link href="/" className="font-heading text-2xl text-primary">
        FisioConsulta
      </Link>
      <h1 className="font-heading mt-6 text-3xl">Crear su espacio clínico</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        El plan se guarda en la clínica. En esta versión no hay cobro real: elija
        el que corresponda a su equipo.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlanId(p.id)}
            className={`rounded-xl border px-3 py-2 text-left text-sm ${
              planId === p.id ? "border-primary bg-secondary" : "bg-card"
            }`}
          >
            <span className="block font-medium">{p.name}</span>
            <span className="text-muted-foreground">{p.monthlyUsd} USD</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{plan.blurb}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Su nombre</Label>
          <Input id="name" name="name" className="h-11" required placeholder="Ana Ruiz" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clinic">Nombre de la consulta o clínica</Label>
          <Input id="clinic" name="clinic" className="h-11" required placeholder="Consulta Ana Ruiz" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" name="email" type="email" className="h-11" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" name="password" type="password" className="h-11" required minLength={6} />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy ? "Creando…" : "Crear cuenta"}
        </Button>
      </form>
      <p className="mt-6 text-sm">
        ¿Ya tiene cuenta?{" "}
        <Link className="text-primary underline" href="/entrar">
          Entrar
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
