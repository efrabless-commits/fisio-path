"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/auth";
import { DEMO_ACCOUNTS, ensureSeeded } from "@/lib/seed";
import { useAuth } from "@/components/providers";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState("demo123");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await ensureSeeded();
      await login(email, password);
      await refresh();
      router.replace("/app");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo entrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <Link href="/" className="font-heading text-2xl text-primary">
        FisioConsulta
      </Link>
      <h1 className="font-heading mt-6 text-3xl">Entrar al consultorio</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Las cuentas viven en este dispositivo y se sincronizan cuando hay red. Use
        una demo o la cuenta que creó en el registro.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            className="h-11"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </Button>
      </form>
      <div className="mt-8 space-y-2">
        <p className="text-sm font-medium">Cuentas de demostración</p>
        {DEMO_ACCOUNTS.map((a) => (
          <button
            key={a.email}
            type="button"
            className="w-full rounded-xl border bg-card px-3 py-3 text-left text-sm"
            onClick={() => {
              setEmail(a.email);
              setPassword(a.password);
            }}
          >
            <span className="font-medium">{a.label}</span>
            <span className="mt-0.5 block text-muted-foreground">
              {a.email} · {a.password} · {a.plan}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-6 text-sm">
        ¿Sin cuenta?{" "}
        <Link className="text-primary underline" href="/registro">
          Crear clínica
        </Link>
      </p>
    </div>
  );
}
