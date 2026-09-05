export function stripAccents(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function normalize(value: string) {
  return stripAccents(value).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}

export function tokens(value: string) {
  return normalize(value)
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

export function includesNormalized(haystack: string, needle: string) {
  return normalize(haystack).includes(normalize(needle));
}

export function ageFromBirthDate(iso: string) {
  if (!iso) return null;
  const birth = new Date(iso);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export const REGION_HINTS: Record<string, string[]> = {
  cervical: ["cuello", "cervical", "cervicalgia", "braquialgia"],
  lumbar: ["lumbar", "lumbago", "lumbalgia", "ciatica", "ciático", "espalda baja"],
  hombro: ["hombro", "manguito", "supraespinoso"],
  codo: ["codo", "epicondilo", "epicóndilo"],
  muneca: ["muñeca", "muneca", "carpiano", "mediano"],
  mano: ["mano", "dedos", "pulgar"],
  cadera: ["cadera", "ingle", "inguinal"],
  rodilla: ["rodilla", "rotula", "rótula"],
  tobillo: ["tobillo", "aquiles"],
  pie: ["pie", "talon", "talón", "fascia", "plantar"],
  equilibrio: ["caida", "caída", "vertigo", "vértigo", "equilibrio", "mareo"],
};
