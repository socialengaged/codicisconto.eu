function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMetaContent(html: string, keys: string[]): string | undefined {
  for (const key of keys) {
    const propertyPattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i"
    );
    const directMatch = html.match(propertyPattern)?.[1];
    if (directMatch) {
      return decodeHtmlEntities(directMatch);
    }

    const reversePattern = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
      "i"
    );
    const reverseMatch = html.match(reversePattern)?.[1];
    if (reverseMatch) {
      return decodeHtmlEntities(reverseMatch);
    }
  }

  return undefined;
}

function absolutizeUrl(candidate: string, baseUrl: string): string | undefined {
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function extractAmazonImage(html: string, baseUrl: string): string | undefined {
  const metaImage = extractMetaContent(html, ["og:image", "twitter:image", "twitter:image:src"]);
  if (metaImage) {
    return absolutizeUrl(metaImage, baseUrl);
  }

  const hiResMatch = html.match(/"hiRes":"(https?:\\\/\\\/[^"]+)"/i)?.[1];
  if (hiResMatch) {
    return hiResMatch.replace(/\\\//g, "/");
  }

  const largeMatch = html.match(/"large":"(https?:\\\/\\\/[^"]+)"/i)?.[1];
  if (largeMatch) {
    return largeMatch.replace(/\\\//g, "/");
  }

  return undefined;
}

export async function fetchOfficialPageImage(url: string): Promise<string | undefined> {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "accept-language": "it-IT,it;q=0.9,en;q=0.8"
    },
    redirect: "follow",
    cache: "no-store"
  });

  if (!response.ok) {
    return undefined;
  }

  const html = await response.text();
  const finalUrl = response.url || url;
  const metaImage = extractMetaContent(html, ["og:image", "twitter:image", "twitter:image:src"]);
  const iconImage = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1];

  const candidate =
    /amazon\./i.test(finalUrl) || /amazon\./i.test(url)
      ? extractAmazonImage(html, finalUrl)
      : metaImage || (iconImage ? decodeHtmlEntities(iconImage) : undefined);

  return candidate ? absolutizeUrl(candidate, finalUrl) : undefined;
}
