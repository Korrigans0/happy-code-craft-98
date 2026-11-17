import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCampaigns from "./tools/list-campaigns";
import getCampaign from "./tools/get-campaign";
import listCharacters from "./tools/list-characters";
import getCharacter from "./tools/get-character";
import listCampaignNotes from "./tools/list-campaign-notes";
import createCampaignNote from "./tools/create-campaign-note";
import updateCharacter from "./tools/update-character";
import createCharacter from "./tools/create-character";

// Issuer must be the direct Supabase host, built from the project ref inlined at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "vtt-jdr",
  title: "VTT JDR",
  version: "0.2.0",
  instructions:
    "Outils pour Aetheria VTT (table de jeu de rôle virtuelle). Permet de lister et consulter les campagnes, leurs membres, les fiches de personnage de l'utilisateur connecté, de créer et modifier ses fiches (update_character exige expected_version = updated_at lu ; CONFLICT si la fiche a changé), de récupérer les fiches modifiées depuis la dernière synchro (list_characters updated_since), ainsi que de lire et créer des notes de campagne. Chaque appel agit au nom de l'utilisateur connecté et respecte ses permissions (MJ / joueur).",
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
    updateCharacter,
    createCharacter,
  ],
});
