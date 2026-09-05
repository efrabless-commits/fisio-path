"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, FileText, LogOut, Smartphone, Users } from "lucide-react";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { planById } from "@/lib/plans";
import { supabaseConfigured } from "@/lib/supabase";

export default function MorePage() {
  const { user, clinic, logout, online, pending } = useAuth();
  const router = useRouter();
  if (!user || !clinic) return null;
  const plan = planById(clinic.planId);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl">Más</h1>
      <div className="rounded-2xl border bg-card p-4">
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-2 text-sm">
          {clinic.name} · {plan.name} ·{" "}
          {user.role === "admin_corporativo" ? "administrador corporativo" : "fisioterapeuta"}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {online ? "En línea" : "Sin conexión"}
          {pending ? ` · ${pending} cambios por sincronizar` : " · sincronizado"}
          {supabaseConfigured() ? " · Supabase activo" : " · almacenamiento local (puede conectar Supabase)"}
        </p>
      </div>
      <div className="grid gap-2">
        <Link className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3" href="/app/biblioteca">
          <BookOpen className="size-5 text-primary" />
          Biblioteca de ejercicios
        </Link>
        <Link className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3" href="/app/informes">
          <FileText className="size-5 text-primary" />
          Informes y planes caseros
        </Link>
        {user.role === "admin_corporativo" && (
          <Link className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3" href="/app/equipo">
            <Users className="size-5 text-primary" />
            Equipo y asientos del plan
          </Link>
        )}
        <div className="flex items-start gap-3 rounded-2xl border bg-card px-4 py-3 text-sm">
          <Smartphone className="mt-0.5 size-5 text-primary" />
          <p>
            En el teléfono: menú del navegador → <strong>Añadir a pantalla de inicio</strong>.
            La app funciona sin red; al volver la cobertura se vacía la cola de sincronización.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="h-12 w-full"
        onClick={() => void logout().then(() => router.push("/"))}
      >
        <LogOut />
        Cerrar sesión
      </Button>
    </div>
  );
}
