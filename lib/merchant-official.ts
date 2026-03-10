import { withAmazonAffiliateTag } from "@/lib/affiliate/amazon";

const OFFICIAL_DOMAINS: Record<string, string> = {
  amazon: "www.amazon.it",
  zalando: "www.zalando.it",
  "zalando prive": "www.zalando-prive.it",
  "farmacia loreto": "www.farmacialoreto.it",
  stylevana: "www.stylevana.com",
  trainpal: "www.mytrainpal.com",
  iherb: "www.iherb.com",
  lookfantastic: "www.lookfantastic.it",
  zooplus: "www.zooplus.it",
  "levi's": "www.levi.com",
  levis: "www.levi.com",
  europcar: "www.europcar.it",
  topfarmacia: "www.topfarmacia.it",
  "antony morato": "www.antonymorato.com",
  "fiorella rubino": "www.fiorellarubino.com",
  decathlon: "www.decathlon.it",
  "grandi navi veloci": "www.gnv.it",
  "emma materasso": "www.emma-sleep.it",
  smartbox: "www.smartbox.com",
  myprotein: "www.myprotein.it",
  prozis: "www.prozis.com",
  dyson: "www.dyson.it",
  samsung: "www.samsung.com",
  sony: "www.sony.it",
  hotiday: "www.hotiday.com",
  adidas: "www.adidas.it",
  honor: "www.honor.com",
  norauto: "www.norauto.it",
  lagostina: "www.lagostina.it",
  manomano: "www.manomano.it",
  colorland: "www.colorland.com",
  notino: "www.notino.it",
  ditano: "www.ditano.com",
  sarenza: "www.sarenza.it",
  shein: "it.shein.com",
  temu: "www.temu.com",
  "about you": "www.aboutyou.it",
  "booking.com": "www.booking.com",
  maxisport: "www.maxisport.com",
  "antony morato:": "www.antonymorato.com",
  ebay: "www.ebay.it",
  asos: "www.asos.com",
  sinsay: "www.sinsay.com",
  "dr. max": "www.drmax.it",
  drmax: "www.drmax.it",
  crocs: "www.crocs.eu",
  feltrinelli: "www.lafeltrinelli.it",
  heydude: "www.heydude.it",
  sklum: "www.sklum.com",
  profumeriaweb: "www.profumeriaweb.com"
};

function normalizeMerchantKey(name: string): string {
  return name.trim().toLowerCase();
}

export function inferOfficialMerchantDomain(name: string): string | undefined {
  return OFFICIAL_DOMAINS[normalizeMerchantKey(name)];
}

export function buildOfficialMerchantUrl(input: {
  merchantName: string;
  merchantDomain?: string;
  offerTitle?: string;
  currentUrl?: string;
  affiliateTag?: string;
}): string {
  const inferredDomain = input.merchantDomain || inferOfficialMerchantDomain(input.merchantName);

  if (!inferredDomain) {
    return input.currentUrl || "";
  }

  const httpsHome = `https://${inferredDomain}`;

  if (input.currentUrl) {
    try {
      const parsed = new URL(input.currentUrl);
      if (parsed.hostname.includes(inferredDomain.replace(/^www\./, ""))) {
        return /amazon\./i.test(parsed.hostname) && input.affiliateTag
          ? withAmazonAffiliateTag(parsed.toString(), input.affiliateTag)
          : parsed.toString();
      }
    } catch {
      return httpsHome;
    }
  }

  if (/amazon\./i.test(inferredDomain) && input.offerTitle) {
    const query = input.offerTitle
      .replace(/codice sconto|coupon|offerta|esclusivo|promo/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const searchUrl = new URL("https://www.amazon.it/s");
    if (query) {
      searchUrl.searchParams.set("k", query);
    }
    return input.affiliateTag ? withAmazonAffiliateTag(searchUrl.toString(), input.affiliateTag) : searchUrl.toString();
  }

  return httpsHome;
}

export function isOfficialMerchantUrl(url: string, merchantDomain?: string): boolean {
  if (!url || !merchantDomain) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname.includes(merchantDomain.replace(/^www\./, ""));
  } catch {
    return false;
  }
}
