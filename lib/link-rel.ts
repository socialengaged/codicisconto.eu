export function getExternalLinkRel(input?: { sponsored?: boolean }): string {
  const tokens = ["nofollow", "noopener", "noreferrer", "external"];

  if (input?.sponsored) {
    tokens.unshift("sponsored");
  }

  return tokens.join(" ");
}
