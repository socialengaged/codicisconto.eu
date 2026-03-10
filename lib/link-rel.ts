export function getExternalLinkRel(input?: { sponsored?: boolean; nofollow?: boolean }): string {
  const tokens = ["noopener", "noreferrer", "external"];

  if (input?.nofollow !== false) {
    tokens.unshift("nofollow");
  }

  if (input?.sponsored) {
    tokens.unshift("sponsored");
  }

  return tokens.join(" ");
}
