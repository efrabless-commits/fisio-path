export type RedFlagRule = {
  id: string;
  title: string;
  severity: "urgente" | "pronto";
  keywords: string[];
  action: string;
  specialty: string;
  citationIds: string[];
  diagnosisIds?: string[];
};

export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: "cauda",
    title: "Síndrome de cola de caballo",
    severity: "urgente",
    keywords: [
      "silla de montar", "silla de montar", "anestesia perineal", "anestesia genital",
      "retencion urinaria", "retención urinaria", "incontinencia", "esfinter", "esfínter",
      "perdida de heces", "pérdida de heces", "cola de caballo", "cauda",
    ],
    action: "Traslado inmediato a urgencias para RM y evaluación neuroquirúrgica.",
    specialty: "Urgencias / neurocirugía",
    citationIds: ["todd_cauda", "nice_ng59"],
    diagnosisIds: ["cauda_equina"],
  },
  {
    id: "fractura",
    title: "Sospecha de fractura",
    severity: "urgente",
    keywords: [
      "trauma mayor", "caida de altura", "caída de altura", "osteoporosis",
      "corticoides prolongados", "ottawa positivo", "imposibilidad de apoyar",
      "deformidad", "crepitacion osea",
    ],
    action: "Inmovilizar y derivar a imagen (radiografía u otra según región).",
    specialty: "Traumatología / urgencias",
    citationIds: ["downs_ottawa", "chou_2007"],
  },
  {
    id: "infeccion",
    title: "Infección osteoarticular o discal",
    severity: "urgente",
    keywords: [
      "fiebre", "escalofrios", "escalofríos", "uso de drogas intravenosas",
      "inmunosupresion", "inmunosupresión", "infeccion reciente", "herida",
      "dolor nocturno constante",
    ],
    action: "Derivar a urgencias. No movilizar de forma agresiva.",
    specialty: "Urgencias / infectología",
    citationIds: ["chou_2007", "nice_ng59"],
  },
  {
    id: "neoplasia",
    title: "Sospecha de patología oncológica",
    severity: "pronto",
    keywords: [
      "antecedente de cancer", "antecedente de cáncer", "perdida de peso",
      "pérdida de peso inexplicada", "dolor nocturno que no cede",
      "dolor constante no mecanico",
    ],
    action: "Derivar a médico de referencia para estudio. No demorar si hay déficit neurológico.",
    specialty: "Medicina interna / oncología",
    citationIds: ["chou_2007", "nice_ng59"],
  },
  {
    id: "mielopatia",
    title: "Mielopatía / signos de neurona motora superior",
    severity: "pronto",
    keywords: [
      "babinski", "clonus", "hiperreflexia", "torpeza de las manos",
      "mielopatia", "mielopatía", "marcha espastica",
    ],
    action: "Evitar manipulación cervical. Derivar a neurología o cirugía de columna.",
    specialty: "Neurología / cirugía de columna",
    citationIds: ["fehlings_2017"],
    diagnosisIds: ["mielopatia_cervical"],
  },
  {
    id: "tvp",
    title: "Trombosis venosa profunda",
    severity: "urgente",
    keywords: [
      "pantorrilla hinchada", "edema unilateral", "pierna caliente",
      "tvp", "trombosis", "cirugia reciente", "inmovilizacion prolongada",
    ],
    action: "No masajear ni aplicar calor. Derivar a urgencias según protocolo de TVP.",
    specialty: "Urgencias / medicina interna",
    citationIds: ["nice_ng158", "wells_2003"],
    diagnosisIds: ["tvp"],
  },
  {
    id: "gbs",
    title: "Parálisis flácida aguda (Guillain-Barré)",
    severity: "urgente",
    keywords: [
      "paralisis ascendente", "parálisis ascendente", "debilidad progresiva en dias",
      "areflexia aguda", "guillain",
    ],
    action: "Urgencias. Vigilancia respiratoria.",
    specialty: "Neurología / urgencias",
    citationIds: ["willison_gbs"],
    diagnosisIds: ["guillain_barre"],
  },
  {
    id: "deficit_progresivo",
    title: "Déficit neurológico progresivo",
    severity: "pronto",
    keywords: [
      "debilidad progresiva", "peor cada dia", "peor cada día",
      "pie caido de inicio", "pie caído",
    ],
    action: "Reevaluar y derivar a médico o neurología en 24–72 h según velocidad.",
    specialty: "Neurología",
    citationIds: ["nass_lumbar_radic", "nice_ng59"],
  },
  {
    id: "cardiovascular",
    title: "Síntomas cardiovasculares o respiratorios agudos",
    severity: "urgente",
    keywords: [
      "dolor toracico", "dolor torácico", "disnea de reposo", "síncope", "sincope",
      "sudoracion fria", "sudoración fría",
    ],
    action: "Detener la sesión y activar urgencias.",
    specialty: "Urgencias",
    citationIds: ["nice_ng158"],
  },
];
