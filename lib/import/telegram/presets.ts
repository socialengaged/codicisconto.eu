export interface TelegramSourcePreset {
  id: string;
  name: string;
  url: string;
  channelHandle: string;
  mode: "couponFeed" | "amazonDeals";
  merchantHint?: string;
  keywords: string[];
}

export const telegramSourcePresets: TelegramSourcePreset[] = [
  {
    id: "source_telegram_migliori_sconti",
    name: "Telegram Migliori_Sconti",
    url: "https://t.me/s/Migliori_Sconti",
    channelHandle: "Migliori_Sconti",
    mode: "couponFeed",
    keywords: ["sconto", "codice", "coupon", "scadenza", "telegram"]
  },
  {
    id: "source_telegram_codiciscont0",
    name: "Telegram CODICISCONT0",
    url: "https://t.me/s/CODICISCONT0",
    channelHandle: "CODICISCONT0",
    mode: "amazonDeals",
    merchantHint: "Amazon",
    keywords: ["amazon", "prezzo", "offerta", "telegram", "check-out"]
  }
];

export function getTelegramSourcePreset(source: { id?: string; baseUrl: string }) {
  return telegramSourcePresets.find((preset) => preset.id === source.id || preset.url === source.baseUrl);
}
