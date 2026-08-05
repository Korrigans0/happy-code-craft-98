import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCampaigns from "./tools/list-campaigns";
import getCampaign from "./tools/get-campaign";
import listCharacters from "./tools/list-characters";
import getCharacter from "./tools/get-character";
import listCampaignNotes from "./tools/list-campaign-notes";
import createCampaignNote from "./tools/create-campaign-note";

// Issuer must be the direct Supabase host, built from the project ref inlined at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "vtt-jdr",
  title: "VTT JDR",
  version: "0.1.0",
  instructions:
    "Outils pour Aetheria VTT (table de jeu de rôle virtuelle). Permet de lister et consulter les campagnes, leurs membres, les fiches de personnage de l'utilisateur connecté, ainsi que de lire et créer des notes de campagne. Chaque appel agit au nom de l'utilisateur connecté et respecte ses permissions (MJ / joueur).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listCampaigns,
    getCampaign,
    listCharacters,
    getCharacter,
    listCampaignNotes,
    createCampaignNote,
  ],
});
