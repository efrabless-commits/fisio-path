import type { PlanId } from "./types";

export type Plan = {
  id: PlanId;
  name: string;
  seats: number;
  monthlyUsd: number;
  discountPct: number;
  blurb: string;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "individual",
    name: "Individual",
    seats: 1,
    monthlyUsd: 39,
    discountPct: 0,
    blurb: "Un evaluador. Consultorio, clínica o visitas a domicilio.",
    features: [
      "Fichas de pacientes ilimitadas",
      "Evaluación, diferencial y plan de tratamiento",
      "Informes PDF y plan casero",
      "Modo offline con sincronización",
      "Biblioteca de ejercicios",
    ],
  },
  {
    id: "corporativo_5",
    name: "Equipo 5",
    seats: 5,
    monthlyUsd: 176,
    discountPct: 10,
    blurb: "Cinco fisioterapeutas. 10 % de descuento por volumen.",
    features: [
      "Todo lo del plan Individual",
      "Espacio de datos aislado por clínica",
      "Administrador corporativo",
      "Informes de todo el equipo",
    ],
  },
  {
    id: "corporativo_10",
    name: "Equipo 10",
    seats: 10,
    monthlyUsd: 332,
    discountPct: 15,
    blurb: "Diez fisioterapeutas. 15 % de descuento por volumen.",
    features: [
      "Todo lo del Equipo 5",
      "Comparativa de evolución entre terapeutas",
      "Exportación semanal y mensual de la clínica",
    ],
  },
  {
    id: "corporativo_20",
    name: "Equipo 20",
    seats: 20,
    monthlyUsd: 624,
    discountPct: 20,
    blurb: "Veinte fisioterapeutas. 20 % de descuento por volumen.",
    features: [
      "Todo lo del Equipo 10",
      "Roles y altas/bajas del equipo",
      "Prioridad de soporte clínico",
    ],
  },
  {
    id: "corporativo_30",
    name: "Equipo 30+",
    seats: 30,
    monthlyUsd: 878,
    discountPct: 25,
    blurb: "Treinta o más. 25 % de descuento; asientos extra al mismo precio unitario.",
    features: [
      "Todo lo del Equipo 20",
      "Asientos adicionales a USD 29,25",
      "Aislamiento de datos por clínica",
    ],
  },
];

export function planById(id: PlanId) {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function isCorporate(id: PlanId) {
  return id !== "individual";
}

export const LIST_SEAT_PRICE = 39;
