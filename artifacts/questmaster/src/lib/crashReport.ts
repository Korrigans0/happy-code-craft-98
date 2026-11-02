// Sends a crash caught by an error boundary through the existing bug report
// function, so the GM team receives the same report as the manual form.
import { supabase } from "@/integrations/supabase/client";

const MAX_DESCRIPTION = 3900;
// The same crash is sent once per tab even if the visitor clicks again or the
// boundary re-mounts.
const sent = new Set<string>();

export function buildCrashDescription(error: Error, componentStack: string, scope: string): string {
  const stack = (error.stack ?? "").split("\n").slice(0, 8).join("\n");
  const components = componentStack.trim().split("\n").slice(0, 8).join("\n");
  const text = [
    `[Rapport automatique — erreur d'affichage (${scope})]`,
    `Message : ${error.message || String(error)}`,
    stack && `Pile :\n${stack}`,
    components && `Composants :\n${components}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return text.slice(0, MAX_DESCRIPTION);
}

export async function sendCrashReport(error: Error, componentStack: string, scope: string): Promise<boolean> {
  const fingerprint = `${scope}|${error.message}|${window.location.pathname}`;
  if (sent.has(fingerprint)) return true;
  try {
    const { data, error: invokeError } = await supabase.functions.invoke("report-bug", {
      body: {
        problemType: "bug",
        description: buildCrashDescription(error, componentStack, scope),
        reporterEmail: "",
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        platform: navigator.platform ?? "",
        screenSize: `${window.innerWidth}x${window.innerHeight} (dpr ${window.devicePixelRatio})`,
        language: navigator.language,
        screenshot: "",
      },
    });
    if (invokeError || !data?.success) return false;
    sent.add(fingerprint);
    return true;
  } catch {
    return false;
  }
}
