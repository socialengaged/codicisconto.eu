import { slugify } from "@/lib/utils";

export interface CategoryPreset {
  id: string;
  name: string;
  slug: string;
  description: string;
  keywords: string[];
}

export const categoryPresets: CategoryPreset[] = [
  {
    id: "category_elettronica",
    name: "Elettronica",
    slug: "elettronica",
    description: "Sconti su device, accessori, smart home e periferiche.",
    keywords: ["elettronica", "smartphone", "tablet", "usb", "hdmi", "bluetooth", "wifi"]
  },
  {
    id: "category_casa",
    name: "Casa",
    slug: "casa",
    description: "Promozioni per cucina, pulizia, arredo e organizzazione.",
    keywords: ["casa", "home", "kitchen", "cucina", "pulizia", "lampada", "arredo", "organizer"]
  },
  {
    id: "category_prime",
    name: "Prime",
    slug: "prime",
    description: "Coupon e vantaggi riservati agli utenti Prime.",
    keywords: ["prime", "amazon prime"]
  },
  {
    id: "category_audio_video",
    name: "Audio e Video",
    slug: "audio-video",
    description: "Offerte su TV, cuffie, speaker, soundbar e dispositivi per l'intrattenimento.",
    keywords: ["tv", "4k", "ambilight", "airpods", "auricolari", "cuffie", "soundbar", "speaker", "dolby", "buds"]
  },
  {
    id: "category_informatica",
    name: "Informatica",
    slug: "informatica",
    description: "Notebook, monitor, stampanti, storage e accessori per studio e lavoro.",
    keywords: ["laptop", "notebook", "pc", "computer", "ssd", "ram", "monitor", "stampante", "windows", "galaxy book"]
  },
  {
    id: "category_gaming",
    name: "Gaming",
    slug: "gaming",
    description: "Console, videogiochi e accessori gaming per giocare al miglior prezzo.",
    keywords: ["playstation", "ps5", "xbox", "gaming", "nintendo", "controller", "console", "nba 2k"]
  },
  {
    id: "category_smart_home",
    name: "Smart Home e Sicurezza",
    slug: "smart-home-sicurezza",
    description: "Dispositivi per casa connessa, videocitofoni, telecamere e domotica.",
    keywords: ["ring", "blink", "videocitofono", "telecamera", "sicurezza", "smart home", "domotica", "allarme"]
  },
  {
    id: "category_cura_persona",
    name: "Cura della Persona",
    slug: "cura-persona",
    description: "Beauty tech, igiene orale, grooming e benessere quotidiano.",
    keywords: ["oral-b", "spazzolino", "grooming", "tagliacapelli", "barba", "cura personale", "beauty", "rasoio"]
  },
  {
    id: "category_moda_sport",
    name: "Moda e Sport",
    slug: "moda-sport",
    description: "Scarpe, accessori, abbigliamento e prodotti per sport e tempo libero.",
    keywords: ["scarpe", "puma", "sneakers", "abbigliamento", "moda", "sport", "fitness", "running"]
  },
  {
    id: "category_mobile_tablet",
    name: "Smartphone e Tablet",
    slug: "smartphone-tablet",
    description: "Promo su telefoni, tablet, wearable e accessori mobile.",
    keywords: ["smartphone", "iphone", "android", "tablet", "galaxy tab", "watch", "wearable", "redmi"]
  }
];

export function inferCategoryPresetIds(input: string, merchantName?: string): string[] {
  const haystack = `${input} ${merchantName || ""}`.toLowerCase();

  const matches = categoryPresets
    .filter((preset) => preset.keywords.some((keyword) => haystack.includes(keyword)))
    .map((preset) => preset.id);

  if (/amazon/i.test(merchantName || "") && !matches.includes("category_prime")) {
    matches.push("category_prime");
  }

  if (
    matches.some((id) =>
      ["category_audio_video", "category_informatica", "category_gaming", "category_smart_home", "category_mobile_tablet"].includes(id)
    ) &&
    !matches.includes("category_elettronica")
  ) {
    matches.push("category_elettronica");
  }

  return Array.from(new Set(matches)).sort((left, right) => {
    const leftPreset = categoryPresets.find((item) => item.id === left);
    const rightPreset = categoryPresets.find((item) => item.id === right);
    return (leftPreset?.name || left).localeCompare(rightPreset?.name || right, "it");
  });
}

export function slugToCategoryId(slug: string): string {
  return `category_${slugify(slug).replace(/-/g, "_")}`;
}
