export function withAmazonAffiliateTag(url: string, tag: string): string {
  if (!url) {
    return "";
  }

  const parsed = new URL(url);

  if (!/amazon\./i.test(parsed.hostname)) {
    return parsed.toString();
  }

  parsed.searchParams.set("tag", tag);
  return parsed.toString();
}
