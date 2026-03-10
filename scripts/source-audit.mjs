import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");
const targetsPath = path.join(rootDir, "data", "source-audit-targets.json");
const outputPath = path.join(rootDir, "docs", "source-audit-output.json");

const DEFAULT_KEYWORDS = ["sconto", "coupon", "codice", "offerta", "promozione", "deal"];

function decodeEntities(input) {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&euro;/g, "euro")
    .replace(/&ndash;|&mdash;/g, "-");
}

function stripHtmlPreservingBlocks(input) {
  return decodeEntities(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(article|section|div|li|ul|ol|tr|table|p|br|h1|h2|h3|h4|h5|h6)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "\n")
      .replace(/\t/g, " ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}

function detectAccessIssue(text) {
  const normalized = text.toLowerCase();

  if (/enable javascript and cookies to continue/.test(normalized)) {
    return "challenge";
  }

  if (
    /student verification|verified students|student discount|member-only|members only|sign up to unlock|get code after sign in|verifica studente/.test(
      normalized
    )
  ) {
    return "auth";
  }

  return undefined;
}

function detectRenderMode(html, text) {
  const scriptCount = (html.match(/<script/gi) || []).length;
  if (scriptCount > 25 && text.length < 3000) {
    return "js-heavy";
  }
  if (scriptCount > 10) {
    return "mixed";
  }
  return "server-rendered";
}

function extractOfferBlocks(html, keywords = DEFAULT_KEYWORDS) {
  const text = stripHtmlPreservingBlocks(html);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const candidates = lines
    .filter((line) => line.length >= 25 && line.length <= 260)
    .filter((line) => {
      const normalized = line.toLowerCase();
      return keywords.some((keyword) => normalized.includes(keyword));
    });

  return Array.from(new Set(candidates))
    .slice(0, 40)
    .map((line) => {
      const code =
        line.match(/(?:codice|coupon|voucher)[:\s-]*([A-Z0-9_-]{4,20})/i)?.[1] ||
        line.match(/\b[A-Z0-9]{5,12}\b/g)?.find((token) => /\d/.test(token));
      const valueLabel =
        line.match(/-?\d{1,3}\s?%/)?.[0] ||
        line.match(/\d{1,3}(?:[.,]\d{1,2})?\s?(?:euro|€)/i)?.[0] ||
        (/(spedizione gratis|gratis)/i.test(line) ? "Spedizione gratis" : undefined);
      const expiresAtText = line.match(/(?:scade|valido fino al|fino al)\s+([^,.]+)/i)?.[1]?.trim();
      let confidenceScore = 0.4;
      if (valueLabel) confidenceScore += 0.2;
      if (code) confidenceScore += 0.2;
      if (expiresAtText) confidenceScore += 0.1;
      if (line.length < 170) confidenceScore += 0.05;

      return {
        title: line.slice(0, 120),
        text: line,
        code,
        valueLabel,
        expiresAtText,
        confidenceScore: Math.min(confidenceScore, 0.95)
      };
    })
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 5);
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": "codicisconto.eu source audit/1.0"
      },
      signal: controller.signal
    });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRobots(url) {
  const robotsUrl = `${new URL(url).origin}/robots.txt`;
  try {
    const result = await fetchWithTimeout(robotsUrl, 8000);
    if (!result.ok) {
      return { robotsUrl, status: result.status, available: false, snippet: "" };
    }

    return {
      robotsUrl,
      status: result.status,
      available: true,
      snippet: result.body.split("\n").slice(0, 20).join("\n")
    };
  } catch (error) {
    return {
      robotsUrl,
      status: 0,
      available: false,
      snippet: `robots fetch error: ${error instanceof Error ? error.message : "unknown"}`
    };
  }
}

function summarizeStrategy(target, accessIssue, sampleCount) {
  if (target.strategy === "skip") {
    return "skip";
  }

  if (accessIssue === "challenge") {
    return "skip";
  }

  if (accessIssue === "auth") {
    return "skip";
  }

  if (sampleCount === 0) {
    return "fallback";
  }

  return target.strategy;
}

async function main() {
  const targets = JSON.parse(await readFile(targetsPath, "utf8"));
  const results = [];

  for (const target of targets) {
    const record = {
      id: target.id,
      name: target.name,
      url: target.url,
      merchantHint: target.merchantHint || "",
      configuredStrategy: target.strategy,
      finalStrategy: target.strategy,
      publicAccess: "unknown",
      renderMode: "unknown",
      accessIssue: "",
      httpStatus: 0,
      robots: null,
      extractedCount: 0,
      samples: [],
      notes: []
    };

    record.robots = await fetchRobots(target.url);

    if (target.strategy === "skip") {
      record.publicAccess = "limited";
      record.accessIssue = "configured_skip";
      record.finalStrategy = "skip";
      record.notes.push("Fonte marcata come skip nel catalogo iniziale.");
      results.push(record);
      continue;
    }

    try {
      const page = await fetchWithTimeout(target.url, 18000);
      record.httpStatus = page.status;

      if (!page.ok) {
        record.publicAccess = "no";
        record.notes.push(`HTTP status ${page.status}`);
        results.push(record);
        continue;
      }

      const text = stripHtmlPreservingBlocks(page.body);
      const accessIssue = detectAccessIssue(text);
      const samples = extractOfferBlocks(page.body);

      record.publicAccess = accessIssue ? "limited" : "yes";
      record.renderMode = detectRenderMode(page.body, text);
      record.accessIssue = accessIssue || "";
      record.samples = samples;
      record.extractedCount = samples.length;
      record.finalStrategy = summarizeStrategy(target, accessIssue, samples.length);

      if (accessIssue === "auth") {
        record.notes.push("Pagina pubblica ma contenuto utile legato a login o verifica utente.");
      } else if (accessIssue === "challenge") {
        record.notes.push("Pagina protetta da challenge JavaScript/cookie, da non schedulare server-side.");
      } else if (samples.length === 0) {
        record.notes.push("Nessun blocco robusto rilevato: usare fallback testuale o pagine piu specifiche.");
      } else {
        record.notes.push("Campioni estratti con euristiche testuali da validare manualmente.");
      }
    } catch (error) {
      record.publicAccess = "error";
      record.finalStrategy = target.strategy === "structured" ? "fallback" : target.strategy;
      record.notes.push(error instanceof Error ? error.message : "Errore sconosciuto");
    }

    results.push(record);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalSources: results.length,
        results
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`Audit completato. Output scritto in ${outputPath}`);
  for (const result of results) {
    console.log(
      `${result.name} | access=${result.publicAccess} | strategy=${result.finalStrategy} | extracted=${result.extractedCount} | status=${result.httpStatus}`
    );
  }
}

await main();
