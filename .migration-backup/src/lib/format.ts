// Formatters fr-BE — dates, monnaie, nombres
// Worlds Awakening utilise NX comme devise interne (cf. game-systems.ts).
// Pour les prix réels (abonnement, etc.), on utilise EUR au format belge.

const LOCALE = "fr-BE";

export const formatDate = (d: Date | string | number, opts?: Intl.DateTimeFormatOptions) => {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  return new Intl.DateTimeFormat(LOCALE, opts ?? { dateStyle: "medium" }).format(date);
};

export const formatDateTime = (d: Date | string | number) =>
  formatDate(d, { dateStyle: "medium", timeStyle: "short" });

export const formatRelative = (d: Date | string | number) => {
  const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  const diff = (date.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), "month");
  return rtf.format(Math.round(diff / 31536000), "year");
};

export const formatEUR = (amount: number) =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency: "EUR" }).format(amount);

export const formatNumber = (n: number) => new Intl.NumberFormat(LOCALE).format(n);
