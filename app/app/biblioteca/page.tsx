"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers";
import { db } from "@/lib/db";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { saveAndSync } from "@/lib/sync";
import { uid } from "@/lib/crypto";
import type { LibraryExercise, Region } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const REGIONS: Region[] = [
  "cervical",
  "lumbar",
  "hombro",
  "codo",
  "muneca",
  "mano",
  "cadera",
  "rodilla",
  "tobillo",
  "pie",
  "equilibrio",
  "global",
];

export default function LibraryPage() {
  const { user } = useAuth();
  const items = useLiveQuery(
    () => (user ? db.exercises.where("clinicId").equals(user.clinicId).toArray() : []),
    [user?.clinicId],
  );
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (items ?? []).filter((e) => !t || e.name.toLowerCase().includes(t));
  }, [items, q]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-3xl">Biblioteca de ejercicios</h1>
      <p className="text-sm text-muted-foreground">
        Fotos y vídeos de su clínica. Si configura Supabase, las subidas van al
        almacenamiento en la nube; si no, quedan en este dispositivo y viajan en
        la cola de sincronización.
        {supabaseConfigured() ? " Supabase está conectado." : " Modo local (sin credenciales)."}
      </p>
      <Input className="h-11" placeholder="Buscar ejercicio" value={q} onChange={(e) => setQ(e.target.value)} />
      <UploadForm
        onSave={async (row) => {
          if (!user) return;
          await saveAndSync("exercises", user.clinicId, row);
          toast.success("Ejercicio guardado");
        }}
        clinicId={user?.clinicId ?? ""}
        userId={user?.id ?? ""}
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {list.map((e) => (
          <li key={e.id} className="overflow-hidden rounded-2xl border bg-card">
            {(e.imageUrl || e.localImage) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.localImage || e.imageUrl} alt="" className="h-36 w-full object-cover" />
            )}
            <div className="p-3">
              <p className="font-medium">{e.name}</p>
              <p className="text-sm text-muted-foreground">{e.description}</p>
              {e.videoUrl && (
                <a className="mt-2 inline-block text-sm text-primary underline" href={e.videoUrl} target="_blank" rel="noreferrer">
                  Ver vídeo
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UploadForm({
  onSave,
  clinicId,
  userId,
}: {
  onSave: (row: LibraryExercise) => Promise<void>;
  clinicId: string;
  userId: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3 rounded-2xl border bg-card p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const file = (fd.get("photo") as File | null) ?? null;
        const video = (fd.get("video") as File | null) ?? null;
        setBusy(true);
        try {
          let imageUrl: string | undefined;
          let videoUrl: string | undefined;
          let localImage: string | undefined;
          const sb = getSupabase();
          if (file && file.size) {
            if (sb) {
              const path = `${clinicId}/${Date.now()}-${file.name}`;
              const up = await sb.storage.from("exercises").upload(path, file);
              if (up.error) throw up.error;
              imageUrl = sb.storage.from("exercises").getPublicUrl(path).data.publicUrl;
            } else {
              localImage = await readDataUrl(file);
            }
          }
          if (video && video.size) {
            if (sb) {
              const path = `${clinicId}/vid-${Date.now()}-${video.name}`;
              const up = await sb.storage.from("exercises").upload(path, video);
              if (up.error) throw up.error;
              videoUrl = sb.storage.from("exercises").getPublicUrl(path).data.publicUrl;
            } else {
              videoUrl = await readDataUrl(video);
            }
          }
          if (!videoUrl) {
            const pasted = String(fd.get("videoUrl") || "").trim();
            if (pasted) videoUrl = pasted;
          }
          await onSave({
            id: uid("ex"),
            clinicId,
            name: String(fd.get("name")),
            description: String(fd.get("description") || ""),
            region: String(fd.get("region")) as Region,
            imageUrl,
            videoUrl,
            localImage,
            uploadedBy: userId,
            createdAt: new Date().toISOString(),
          });
          e.currentTarget.reset();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No se pudo subir");
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="font-medium">Subir ejercicio</p>
      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" name="name" className="h-11" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" name="description" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="region">Región</Label>
        <select id="region" name="region" className="h-11 w-full rounded-lg border bg-transparent px-2.5" defaultValue="global">
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="photo">Foto</Label>
        <Input id="photo" name="photo" type="file" accept="image/*" className="h-11" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="video">Vídeo (archivo)</Label>
        <Input id="video" name="video" type="file" accept="video/*" className="h-11" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="videoUrl">o URL de vídeo</Label>
        <Input id="videoUrl" name="videoUrl" className="h-11" placeholder="https://" />
      </div>
      <Button type="submit" className="h-11 w-full" disabled={busy}>
        Guardar en la biblioteca
      </Button>
    </form>
  );
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("No se pudo leer el archivo"));
    r.readAsDataURL(file);
  });
}
