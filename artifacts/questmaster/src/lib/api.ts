// Central API client — all calls go to /api/* on the same origin.
// Clerk session cookies are sent automatically by the browser (credentials: "include").
// No manual user-id headers needed.

const BASE = "/api";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// PROFILES
export const profilesApi = {
  getMe: () => request<any>("GET", "/profiles/me"),
  updateMe: (data: { display_name?: string; avatar_url?: string | null }) =>
    request<any>("PATCH", "/profiles/me", data),
};

// CAMPAIGNS
export const campaignsApi = {
  list: () => request<any[]>("GET", "/campaigns"),
  create: (data: any) => request<any>("POST", "/campaigns", data),
  get: (id: string) => request<any>("GET", `/campaigns/${id}`),
  update: (id: string, data: any) => request<any>("PATCH", `/campaigns/${id}`, data),
  delete: (id: string) => request<any>("DELETE", `/campaigns/${id}`),
  join: (invite_code: string) => request<any>("POST", "/campaigns/join", { invite_code }),
  getMembers: (id: string) => request<any[]>("GET", `/campaigns/${id}/members`),
  removeMember: (id: string, memberId: string) => request<any>("DELETE", `/campaigns/${id}/members/${memberId}`),
  assignCharacter: (id: string, memberId: string, characterId: string | null) =>
    request<any>("PATCH", `/campaigns/${id}/members/${memberId}`, { character_id: characterId }),
  getMessages: (id: string) => request<any[]>("GET", `/campaigns/${id}/messages`),
  postMessage: (id: string, data: any) => request<any>("POST", `/campaigns/${id}/messages`, data),
  getNotes: (id: string) => request<any[]>("GET", `/campaigns/${id}/notes`),
  createNote: (id: string, data: any) => request<any>("POST", `/campaigns/${id}/notes`, data),
  deleteNote: (id: string, noteId: string) => request<any>("DELETE", `/campaigns/${id}/notes/${noteId}`),
  getSessions: (id: string) => request<any[]>("GET", `/campaigns/${id}/sessions`),
  createSession: (id: string, data: any) => request<any>("POST", `/campaigns/${id}/sessions`, data),
  deleteSession: (id: string, sessionId: string) => request<any>("DELETE", `/campaigns/${id}/sessions/${sessionId}`),
  getTabletop: (id: string) => request<any>("GET", `/campaigns/${id}/tabletop`),
  saveTabletop: (id: string, data: any) => request<any>("POST", `/campaigns/${id}/tabletop`, data),
};

// CHARACTERS
export const charactersApi = {
  list: () => request<any[]>("GET", "/characters"),
  create: (data: any) => request<any>("POST", "/characters", data),
  get: (id: string) => request<any>("GET", `/characters/${id}`),
  update: (id: string, data: any) => request<any>("PATCH", `/characters/${id}`, data),
  delete: (id: string) => request<any>("DELETE", `/characters/${id}`),
};

// COMPENDIUM
export const compendiumApi = {
  getSpells: () => request<any[]>("GET", "/compendium/spells"),
  createSpell: (data: any) => request<any>("POST", "/compendium/spells", data),
  getMonsters: () => request<any[]>("GET", "/compendium/monsters"),
  createMonster: (data: any) => request<any>("POST", "/compendium/monsters", data),
  getItems: () => request<any[]>("GET", "/compendium/items"),
  createItem: (data: any) => request<any>("POST", "/compendium/items", data),
  getWaCreatures: () => request<any[]>("GET", "/compendium/wa-creatures"),
  createWaCreature: (data: any) => request<any>("POST", "/compendium/wa-creatures", data),
  syncWaCreatures: () => request<any>("POST", "/compendium/wa-creatures/sync", {}),
  getAetheriaCreatures: () => request<any[]>("GET", "/compendium/aetheria-creatures"),
  createAetheriaCreature: (data: any) => request<any>("POST", "/compendium/aetheria-creatures", data),
};
