import Link from "next/link";
import { Check, Smartphone, Stethoscope, WifiOff, Users, FileText } from "lucide-react";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <p className="font-heading text-xl text-primary">FisioConsulta</p>
        <div className="flex gap-2">
          <Button variant="ghost" render={<Link href="/entrar" />}>
            Entrar
          </Button>
          <Button render={<Link href="/registro" />}>Crear cuenta</Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2 md:items-center md:py-16">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Consultorio · clínica · domicilio
          </p>
          <h1 className="font-heading mt-2 text-4xl leading-tight md:text-5xl">
            La evaluación completa, del relato al informe, en el bolsillo.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Ficha del paciente, catálogo de tests, diagnóstico diferencial con
            referencias de guías clínicas, banderas rojas, plan de tratamiento y
            PDF para el médico o para casa. Pensada para usarse con el pulgar,
            también en el escritorio, e instalable como app.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="h-11 px-5" render={<Link href="/registro" />}>
              Empezar ahora
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-5" render={<Link href="/entrar" />}>
              Probar con cuentas demo
            </Button>
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Sesión en curso</p>
          <p className="font-heading mt-1 text-2xl">Elena Navarro · lumbociática</p>
          <ol className="mt-4 space-y-2 text-sm">
            {[
              "Ficha y antecedentes",
              "Tests priorizados (Lasègue, reflejos, EVA)",
              "Diferencial: radiculopatía 42 % · hernia 28 % · lumbalgia 18 %",
              "Sin banderas rojas → plan de 10 sesiones",
            ].map((s) => (
              <li key={s} className="flex gap-2 rounded-xl bg-secondary/60 px-3 py-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                {s}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-card/70 py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Stethoscope,
              title: "Un flujo clínico",
              text: "De la ficha al informe, sin saltar entre papeles ni hojas de cálculo.",
            },
            {
              icon: WifiOff,
              title: "Offline de verdad",
              text: "Trabaje en domicilio. Al reconectar, la cola de sincronización se vacía sola.",
            },
            {
              icon: Smartphone,
              title: "PWA instalable",
              text: "Añada a la pantalla de inicio. Se siente como una app nativa.",
            },
            {
              icon: FileText,
              title: "PDFs listos",
              text: "Evaluación, derivación al médico y plan casero con la biblioteca de ejercicios.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border bg-background p-5">
              <f.icon className="size-6 text-primary" />
              <h2 className="mt-3 font-heading text-xl">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-6xl px-4 py-14">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl">Planes</h2>
          <p className="mt-2 text-muted-foreground">
            Individual para un evaluador. Corporativo para equipos, con descuento
            por volumen y datos aislados por clínica. El administrador ve todos
            los informes del equipo.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {PLANS.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border bg-card p-5">
              <p className="text-sm text-primary">{p.discountPct ? `−${p.discountPct} % volumen` : "Un evaluador"}</p>
              <h3 className="font-heading mt-1 text-2xl">{p.name}</h3>
              <p className="mt-2 text-3xl font-semibold">
                {p.monthlyUsd} <span className="text-base font-normal text-muted-foreground">USD/mes</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{p.blurb}</p>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-5 h-11 w-full" render={<Link href={`/registro?plan=${p.id}`} />}>
                Elegir {p.name}
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          Cada clínica tiene su espacio. Un fisioterapeuta de Fisio Norte no ve
          las fichas de la Consulta Ana Ruiz.
        </p>
      </section>

      <footer className="border-t px-4 py-8 text-center text-sm text-muted-foreground">
        FisioConsulta es una herramienta de apoyo clínico. No sustituye el juicio
        profesional ni el diagnóstico médico.
      </footer>
    </div>
  );
}
