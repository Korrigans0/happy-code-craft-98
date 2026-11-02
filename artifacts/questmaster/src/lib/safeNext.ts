// Validates the `?next=` destination used after sign-in. Only same-site paths
// are accepted: "//host" and "/\host" are treated by browsers as another site.
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || raw.length > 2048) return "";
  if (!raw.startsWith("/")) return "";
  if (raw.startsWith("//") || raw.includes("\\")) return "";
  // Control characters (tabs, newlines) are stripped by URL parsers and can
  // turn "/\t/evil.com" into "//evil.com".
  if (/[\u0000-\u001f\u007f]/.test(raw)) return "";
  return raw;
}

/** Path to send a signed-out visitor to, remembering where they wanted to go. */
export function signInPathFor(pathname: string, search = "", hash = ""): string {
  const next = safeNextPath(`${pathname}${search}${hash}`);
  return next && next !== "/" ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";
}
