export interface SourcePreset {
  id: string;
  name: string;
  url: string;
  merchantHint?: string;
  strategy: "structured" | "fallback" | "skip";
  keywords?: string[];
}

export const sourcePresets: SourcePreset[] = [
  {
    id: "source_codicesconto",
    name: "CodiceSconto",
    url: "https://www.codicesconto.com/",
    strategy: "structured",
    keywords: ["codice", "sconto", "coupon", "offerta"]
  },
  {
    id: "source_trovaprezzi_coupon",
    name: "Trovaprezzi Coupon",
    url: "https://www.trovaprezzi.it/codici-sconto-coupon",
    strategy: "structured",
    keywords: ["codice", "coupon", "sconto", "negozio"]
  },
  {
    id: "source_sconti",
    name: "Sconti.com",
    url: "https://sconti.com/",
    strategy: "structured",
    keywords: ["sconto", "coupon", "offerta", "promozione"]
  },
  {
    id: "source_codicerisparmio",
    name: "Codice Risparmio",
    url: "https://codicerisparmio.it/",
    strategy: "structured",
    keywords: ["codice", "sconto", "coupon", "spedizione"]
  },
  {
    id: "source_topnegozi",
    name: "TopNegozi",
    url: "https://www.topnegozi.it/",
    strategy: "structured",
    keywords: ["codice", "negozio", "offerta", "coupon"]
  },
  {
    id: "source_topnegozi_zalando",
    name: "TopNegozi Zalando",
    url: "https://www.topnegozi.it/zalando",
    merchantHint: "Zalando",
    strategy: "structured",
    keywords: ["zalando", "codice", "sconto", "coupon"]
  },
  {
    id: "source_cuponation_farmacia_loreto",
    name: "Cuponation Farmacia Loreto",
    url: "https://www.cuponation.it/codice-sconto-farmacia-loreto",
    merchantHint: "Farmacia Loreto",
    strategy: "structured",
    keywords: ["farmacia", "loreto", "codice", "sconto"]
  },
  {
    id: "source_discoup_best",
    name: "Discoup Migliori Codici",
    url: "https://www.discoup.com/it/migliori-codici-sconto.html",
    strategy: "structured",
    keywords: ["codice", "sconto", "coupon", "deal"]
  },
  {
    id: "source_scontify_zalando_prive_newsletter",
    name: "Scontify Zalando Prive Newsletter",
    url: "https://www.scontify.net/promozioni/prive-by-zalando-codice-sconto-di-10e-con-liscrizione-alla-newsletter/114350/",
    merchantHint: "Zalando Prive",
    strategy: "structured",
    keywords: ["zalando", "newsletter", "10e", "sconto"]
  },
  {
    id: "source_scontify_farmacia_loreto_app",
    name: "Scontify Farmacia Loreto App",
    url: "https://www.scontify.net/promozioni/farmacia-loreto-codice-sconto-del-10-su-app/599191/",
    merchantHint: "Farmacia Loreto",
    strategy: "structured",
    keywords: ["farmacia", "loreto", "app", "10"]
  }
];

export function getSourcePreset(source: { id?: string; baseUrl: string; name: string }) {
  return sourcePresets.find((preset) => preset.id === source.id || preset.url === source.baseUrl);
}
