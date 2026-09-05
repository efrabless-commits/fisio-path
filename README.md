# FisioConsulta

Aplicación web para fisioterapeutas de consultorio, clínica privada o atención a domicilio. Funciona en el ordenador y como **PWA instalable** en el móvil, con **modo offline** y sincronización al reconectar.

Todo el producto está en español y pensado primero para el pulgar: botones grandes, navegación inferior y un flujo de sesión que se puede seguir en camilla.

## Qué incluye

- **Cuentas y planes**: individual (un evaluador) o corporativo (5, 10, 20 o 30+ fisioterapeutas) con descuento por volumen.
- **Datos aislados por clínica**. Un terapeuta de Fisio Norte no ve las fichas de otra consulta.
- **Roles**: fisioterapeuta y administrador corporativo (equipo + todos los informes).
- **Flujo de sesión**: ficha → catálogo de tests (neurológicos, musculoesqueléticos, adulto mayor, priorizados por contexto) → signos y síntomas en texto libre → diagnóstico diferencial 3–5 con signos para confirmar o descartar y **citas a guías clínicas / PubMed** → pruebas estructuradas (reflejos 0–4, Daniels 0–5, EVA 0–10) → **banderas rojas** y PDF de derivación, o plan de tratamiento → objetivos funcionales → informe PDF y plan casero.
- **Biblioteca de ejercicios** con fotos y vídeos (Supabase Storage si hay credenciales; si no, este dispositivo).
- **Evolución** por visita (dolor, rango, fuerza) comparable en la ficha.

La base de conocimiento es local y citable (NICE, JOSPT, OARSI, AAOS, AHA/ASA, revisiones en PubMed). La búsqueda en vivo a PubMed es un **complemento opcional**, no la fuente principal.

Esto es **apoyo a la decisión clínica**, no un diagnóstico médico automático.

## Cómo ejecutarlo

```bash
npm install
npm run dev -- --port 47321 --hostname 127.0.0.1
```

Abra [http://127.0.0.1:47321](http://127.0.0.1:47321).

Cuentas de demostración (contraseña `demo123`):

| Cuenta | Correo | Plan |
| --- | --- | --- |
| Ana Ruiz | ana@consulta.fisio | Individual |
| Lucía Herrera (admin) | lucia@fisionorte.fisio | Equipo 10 |
| Carlos Mendoza | carlos@fisionorte.fisio | Equipo 10 |

## PWA y offline

En el teléfono: menú del navegador → **Añadir a pantalla de inicio**. El service worker guarda el cascarón; IndexedDB (Dexie) guarda fichas, sesiones y la cola de sincronización. Al volver la red, `/api/sync` confirma los cambios. Si configura Supabase, la cola escribe también en la nube.

## Supabase (opcional)

Copie `.env.example` a `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Cree un bucket público `exercises` para fotos y vídeos. Sin estas variables la app sigue siendo usable al completo en local.

## Stack

Next.js (App Router), TypeScript, Tailwind, shadcn/ui, Dexie, jsPDF.
