"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Users,
  UserRound,
  Settings,
  WifiOff,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";

const NAV = [
  { href: "/app", label: "Inicio", icon: Home },
  { href: "/app/pacientes", label: "Pacientes", icon: UserRound },
  { href: "/app/sesion/nueva", label: "Sesión", icon: ClipboardList },
  { href: "/app/informes", label: "Informes", icon: FileText },
  { href: "/app/mas", label: "Más", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, user, clinic, online, pending, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/entrar");
  }, [ready, user, router]);

  if (!ready || !user || !clinic) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
        Cargando consultorio…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col md:flex-row">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="px-5 py-6">
          <p className="font-heading text-xl text-primary">FisioConsulta</p>
          <p className="mt-1 text-sm text-muted-foreground">{clinic.name}</p>
          <p className="text-xs text-muted-foreground">{user.name}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          {user.role === "admin_corporativo" && (
            <Link
              href="/app/equipo"
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
                pathname.startsWith("/app/equipo")
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-sidebar-accent"
              }`}
            >
              <Users className="size-4" />
              Equipo
            </Link>
          )}
          <Link
            href="/app/biblioteca"
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${
              pathname.startsWith("/app/biblioteca")
                ? "bg-primary text-primary-foreground"
                : "hover:bg-sidebar-accent"
            }`}
          >
            <BookOpen className="size-4" />
            Biblioteca
          </Link>
        </nav>
        <div className="p-4">
          <Button variant="ghost" className="w-full justify-start" onClick={() => void logout().then(() => router.push("/"))}>
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col pb-20 md:pb-0">
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-100 px-3 py-2 text-sm text-amber-950">
            <WifiOff className="size-4" />
            Sin conexión. Los datos se guardan en este dispositivo y se sincronizarán al reconectar.
          </div>
        )}
        {online && pending > 0 && (
          <div className="bg-secondary px-3 py-2 text-center text-sm">
            {pending} cambio{pending === 1 ? "" : "s"} pendiente{pending === 1 ? "" : "s"} de sincronizar
          </div>
        )}
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <div>
            <p className="font-heading text-lg text-primary">FisioConsulta</p>
            <p className="text-xs text-muted-foreground">{clinic.name}</p>
          </div>
          <Badge variant="secondary">{user.role === "admin_corporativo" ? "Admin" : "Fisio"}</Badge>
        </header>
        <main className="flex-1 px-4 py-4 md:px-8 md:py-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
