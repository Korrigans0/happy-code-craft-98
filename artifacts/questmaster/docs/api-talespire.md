# API Aetheria VTT pour TaleSpire (serveur MCP) — v0.2.0

## 1. Point d'entrée
`POST https://snawpxrejmcxfbiiowxr.supabase.co/functions/v1/mcp` — protocole MCP (JSON-RPC 2.0, transport « Streamable HTTP »).
En-têtes : `Authorization: Bearer <access_token OAuth>`, `Content-Type: application/json`, `Accept: application/json, text/event-stream`.

Appel d'un outil :
```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_character","arguments":{"character_id":"<uuid>"}}}
```
Réponse : `result.structuredContent` (JSON décrit ci-dessous) et `result.content[0].text` (même JSON en texte). En cas d'erreur métier : `result.isError = true` et `content[0].text = {"error":{"code","message",...}}`.
Séquence MCP : `initialize` → `notifications/initialized` → `tools/list` / `tools/call` (toute bibliothèque cliente MCP le fait).

## 2. Authentification OAuth (client externe)
Aucune clé secrète du backend n'est jamais remise au module : TaleSpire obtient un jeton au nom du joueur.
1. Découverte : `GET .../functions/v1/mcp/.well-known/oauth-protected-resource` → serveur d'autorisation `https://snawpxrejmcxfbiiowxr.supabase.co/auth/v1` ; métadonnées : `<issuer>/.well-known/oauth-authorization-server`.
2. Enregistrement dynamique du client (RFC 7591) sur `registration_endpoint` avec ses `redirect_uris` (ex. `http://127.0.0.1:<port>/callback` pour une app de bureau). Client public : pas de secret.
3. Autorisation : OAuth 2.1 « Authorization Code + PKCE (S256) » ; scopes `openid email profile`. Le joueur se connecte sur Aetheria VTT et valide l'écran de consentement (`/.lovable/oauth/consent`).
4. Échange du code sur `token_endpoint` → `access_token` (courte durée) + `refresh_token`. Rafraîchir avant expiration ; sur `401`, relancer le flux.
5. Le serveur vérifie la signature, l'émetteur, l'audience `authenticated` et la présence de `client_id` (un jeton de session copié du site est refusé). L'identité vient toujours du jeton, jamais des paramètres.

Stocker le refresh_token de manière chiffrée côté poste du joueur ; ne jamais l'écrire dans les fichiers de table partagés.

## 3. Règles d'accès (appliquées par la base, côté serveur)
- Lecture : propriétaire ; membres d'une campagne pour les fiches liées ; MJ pour les fiches de ses joueurs ; pré-tirés disponibles.
- Écriture : uniquement le propriétaire, et le MJ pour les pré-tirés de sa campagne. Un MJ ne modifie pas la fiche d'un joueur via l'API (même règle que le site). Un joueur ne peut jamais modifier la fiche d'un autre.
- Colonnes jamais modifiables : `id, user_id, system, kind, pregen_*, source_*, created_at, updated_at`.
- Quotas d'abonnement appliqués à la création.

## 4. Outils

### list_characters
| Paramètre | Type | Défaut |
|---|---|---|
| `scope` | `"owned"` \| `"accessible"` | `owned` |
| `updated_since` | ISO 8601 | — (renvoie seulement les fiches modifiées strictement après) |
| `system` | string (`Glyphes`, `Aetheria`, `Worlds Awakening`…) | — |
| `limit` | int 1–100 | 25 |
```json
{"characters":[{"id":"…","user_id":"…","name":"Maggle","race":"Humain","class":"Combattant","subclass":null,"level":1,"hp":10,"max_hp":10,"armor_class":10,"system":"Glyphes","kind":"standard","avatar_url":"https://…","updated_at":"2026-11-17T16:00:00.123+00:00","version":"2026-11-17T16:00:00.123+00:00","is_owner":true}],
 "server_time":"2026-11-17T16:05:00.000Z"}
```

### get_character
Paramètre : `character_id` (uuid).
```json
{"character":{ "...toutes les colonnes de la fiche...", "system_data":{ } },"version":"<updated_at>","can_edit":true}
```

### create_character
| Paramètre | Requis | Note |
|---|---|---|
| `name` | oui | 1–120 car. |
| `system` | oui | doit être un système connu |
| `race`, `class`, `level` | non | défauts `""`, `""`, `1` |
| `fields` | non | colonnes modifiables (cf. update) |
| `system_data` | non | données propres au système, `{}` par défaut |
Réponse : `{"character":{…},"version":"<updated_at>"}`.

### update_character (modification partielle)
| Paramètre | Requis | Note |
|---|---|---|
| `character_id` | oui | uuid |
| `expected_version` | oui | `version`/`updated_at` lu en dernier |
| `fields` | non | seules les clés présentes changent |
| `system_data_patch` | non | fusion profonde : objets fusionnés clé par clé, tableaux et valeurs remplacés, clés absentes conservées |

Champs de `fields` : identité (`name, race, class, subclass, level, background, alignment, backstory, personality_traits, ideals, bonds, flaws, appearance, avatar_url`), caractéristiques (`strength, dexterity, constitution, intelligence, wisdom, charisma`), PV/combat (`hp, max_hp, temp_hp, armor_class, initiative, speed, hit_dice, proficiency_bonus`), compétences (`saving_throws, skills, languages`), inventaire/équipement (`inventory, equipped_items, equipped_weapon_id, equipped_armor_id`), `gold`, `experience_points`, magie (`spellcasting_ability, spell_save_dc, spell_attack_bonus, known_spells, prepared_spells, spell_slots`).
Mana, blessures, héroïsme, aptitudes Glyphes, etc. vivent dans `system_data` : les modifier via `system_data_patch` (ex. `{"wounds":2}`), sans toucher au reste.

Exemple :
```json
{"character_id":"…","expected_version":"2026-11-17T16:00:00.123+00:00","fields":{"hp":7,"gold":42},"system_data_patch":{"heroism":3}}
```
Réponse : `{"character":{…},"version":"<nouveau updated_at>"}`.

## 5. Erreurs
| code | Signification | Action client |
|---|---|---|
| `UNAUTHENTICATED` (ou HTTP 401) | jeton absent/expiré/invalide | rafraîchir ou relancer OAuth |
| `NOT_FOUND` | fiche inexistante ou non visible | retirer de la liste locale |
| `FORBIDDEN` | lecture permise mais pas l'écriture | afficher en lecture seule |
| `CONFLICT` | fiche modifiée entre-temps ; contient `current_version` et `character` | fusionner/rejouer sur la nouvelle version |
| `FIELD_NOT_EDITABLE` | champ protégé ; liste dans `fields` | corriger la requête |
| `EMPTY_UPDATE` | rien à modifier | — |
| `UNKNOWN_SYSTEM` | système inconnu | — |
| `QUOTA_EXCEEDED` | limite de personnages du plan | informer le joueur |
| `DATABASE_ERROR` | autre erreur | réessayer plus tard |
Paramètres invalides : `isError` avec le message de validation.

## 6. Synchronisation
- **Site → TaleSpire** : garder `last_sync = server_time` de la réponse précédente ; interroger `list_characters { scope:"accessible", updated_since:last_sync }` toutes les 5–10 s pendant une partie (30–60 s sinon), puis `get_character` pour chaque fiche renvoyée. Comparer `version` pour ignorer ce qui est déjà connu.
- **TaleSpire → site** : `update_character` avec `expected_version`. L'écriture est atomique (« compare-and-set » sur `updated_at`) : si une autre modification est passée entre-temps, rien n'est écrit et `CONFLICT` est renvoyé. Le site et la table se mettent à jour en temps réel comme pour toute modification.
- **Résolution de conflit recommandée** : reprendre `character` du conflit, réappliquer uniquement les champs modifiés localement (envoyer des deltas, pas la fiche entière), renvoyer avec `current_version`. Ne jamais forcer en écrasant.
- Envoyer des changements groupés (débounce ~500 ms) plutôt qu'un appel par clic.

## 7. Limites actuelles
- Pas de flux push (WebSocket) dans le MCP : synchronisation par interrogation.
- Pas de suppression de fiche via l'API (volontaire).
- Les modifications MJ sur la fiche d'un joueur restent impossibles par l'API, comme sur le site.
- Activation en ligne seulement après publication du site.
