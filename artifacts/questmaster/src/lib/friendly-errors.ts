/**
 * Convertit les erreurs techniques (Supabase / Postgres / Auth / Réseau)
 * en messages utilisateur lisibles en français.
 *
 * Utilisé de façon centralisée dans `api.ts` pour que tous les `err.message`
 * affichés dans les toasts soient déjà traduits.
 */

import { formatPlanError } from "@/lib/plan-limits";

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  details?: string;
  hint?: string;
}

const AUTH_MAP: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "Email ou mot de passe incorrect."],
  [/email not confirmed/i, "Votre email n'a pas encore été confirmé. Vérifiez votre boîte de réception."],
  [/user already registered/i, "Un compte existe déjà avec cet email."],
  [/password should be at least/i, "Le mot de passe est trop court (8 caractères minimum)."],
  [/rate limit|too many requests/i, "Trop de tentatives. Patientez quelques minutes avant de réessayer."],
  [/jwt expired|invalid jwt|not authenticated/i, "Votre session a expiré. Reconnectez-vous."],
  [/unsupported provider/i, "Ce mode de connexion n'est pas encore activé. Contactez le support."],
  [/network|failed to fetch|load failed/i, "Connexion impossible. Vérifiez votre réseau et réessayez."],
  [/timeout/i, "Le serveur met trop de temps à répondre. Réessayez."],
];

const POSTGRES_MAP: Array<[RegExp, string]> = [
  [/duplicate key value|already exists|unique constraint/i, "Cette entrée existe déjà."],
  [/violates foreign key/i, "Action impossible : un élément lié manque ou a été supprimé."],
  [/violates not-null/i, "Un champ obligatoire est manquant."],
  [/violates check constraint/i, "Une des valeurs saisies n'est pas valide."],
  [/permission denied|row-level security|new row violates/i, "Vous n'avez pas l'autorisation d'effectuer cette action."],
  [/does not exist|no rows/i, "Élément introuvable."],
];

/**
 * Tente de traduire un message d'erreur brut en français.
 * Renvoie le message original si aucune correspondance n'est trouvée
 * (mais nettoyé des préfixes techniques type "PGRST...").
 */
export function toFriendlyMessage(input: unknown): string {
  if (!input) return "Une erreur est survenue.";

  const err = (typeof input === "object" ? (input as ErrorLike) : null) ?? null;
  const raw =
    (err?.message as string | undefined) ??
    (typeof input === "string" ? input : null) ??
    "Une erreur est survenue.";

  // 1. Limites de plan
  const plan = formatPlanError(raw);
  if (plan) return plan;

  // 2. Auth
  for (const [re, msg] of AUTH_MAP) {
    if (re.test(raw)) return msg;
  }

  // 3. Postgres
  for (const [re, msg] of POSTGRES_MAP) {
    if (re.test(raw)) return msg;
  }

  // 4. Codes HTTP
  if (err?.status === 401 || err?.status === 403) {
    return "Accès refusé. Vous n'avez pas les permissions requises.";
  }
  if (err?.status === 404) return "Élément introuvable.";
  if (err?.status === 429) return "Trop de requêtes. Patientez un instant.";
  if (err?.status && err.status >= 500) {
    return "Le serveur rencontre un problème. Réessayez dans un instant.";
  }

  // 5. Nettoyage : retire les préfixes techniques type "JSON object requested..."
  //    ou "PGRST116" qui ne disent rien à l'utilisateur.
  const cleaned = raw
    .replace(/^PGRST\d+:?\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .trim();

  // Si le message reste très technique (contient "::", "duplicate key", JSON brut), fallback générique.
  if (
    /::|\bcolumn\b|\brelation\b|\bschema\b|^\{.*\}$|^\[.*\]$/i.test(cleaned) ||
    cleaned.length === 0 ||
    cleaned.length > 200
  ) {
    return "Une erreur est survenue. Réessayez ou contactez le support si le problème persiste.";
  }

  return cleaned;
}
