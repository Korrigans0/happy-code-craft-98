import { Loader2 } from "lucide-react";

/** Shown while a page's code is downloaded on first visit. */
export default function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
