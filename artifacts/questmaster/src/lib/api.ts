// Central API client — all calls go to /api/* on the same origin

const BASE = "/api";

function getHeaders(userId?: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (userId) headers["x-user-id"] = userId;
  return headers;
}

async function request<T>(method: string, path: string, body?: unknown, userId?: string | null): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: getHeaders(userId),
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
  getMe: (userId: string) => request<any>("GET", "/profiles/me", undefined, userId),
  updateMe: (userId: string, data: { display_name?: string; avatar_url?: string }) =>
    request<any>("PATCH", "/profiles/me", data, userId),
};

// CAMPAIGNS
export const campaignsApi = {
  list: (userId: string) => request<any[]>("GET", "/campaigns", undefined, userId),
  create: (userId: string, data: any) => request<any>("POST", "/campaigns", data, userId),
  get: (id: string) => request<any>("GET", `/campaigns/${id}`),
  update: (id: string, userId: string, data: any) => request<any>("PATCH", `/campaigns/${id}`, data, userId),
  delete: (id: string, userId: string) => request<any>("DELETE", `/campaigns/${id}`, undefined, userId),
  join: (userId: string, invite_code: string) => request<any>("POST", "/campaigns/join", { invite_code }, userId),
  getMembers: (id: string) => request<any[]>("GET", `/campaigns/${id}/members`),
  getMessages: (id: string) => request<any[]>("GET", `/campaigns/${id}/messages`),
  postMessage: (id: string, userId: string, data: any) => request<any>("POST", `/campaigns/${id}/messages`, data, userId),
  getNotes: (id: string, userId?: string) => request<any[]>("GET", `/campaigns/${id}/notes`, undefined, userId),
  createNote: (id: string, userId: string, data: any) => request<any>("POST", `/campaigns/${id}/notes`, data, userId),
  deleteNote: (id: string, noteId: string, userId: string) => request<any>("DELETE", `/campaigns/${id}/notes/${noteId}`, undefined, userId),
  getSessions: (id: string) => request<any[]>("GET", `/campaigns/${id}/sessions`),
  createSession: (id: string, userId: string, data: any) => request<any>("POST", `/campaigns/${id}/sessions`, data, userId),
  deleteSession: (id: string, sessionId: string) => request<any>("DELETE", `/campaigns/${id}/sessions/${sessionId}`),
  getTabletop: (id: string) => request<any>("GET", `/campaigns/${id}/tabletop`),
  saveTabletop: (id: string, userId: string, data: any) => request<any>("POST", `/campaigns/${id}/tabletop`, data, userId),
};

// CHARACTERS
export const charactersApi = {
  list: (userId: string) => request<any[]>("GET", "/characters", undefined, userId),
  create: (userId: string, data: any) => request<any>("POST", "/characters", data, userId),
  get: (id: string) => request<any>("GET", `/characters/${id}`),
  update: (id: string, userId: string, data: any) => request<any>("PATCH", `/characters/${id}`, data, userId),
  delete: (id: string, userId: string) => request<any>("DELETE", `/characters/${id}`, undefined, userId),
};

// COMPENDIUM
export const compendiumApi = {
  getSpells: () => request<any[]>("GET", "/compendium/spells"),
  createSpell: (userId: string, data: any) => request<any>("POST", "/compendium/spells", data, userId),
  getMonsters: () => request<any[]>("GET", "/compendium/monsters"),
  createMonster: (userId: string, data: any) => request<any>("POST", "/compendium/monsters", data, userId),
  getItems: () => request<any[]>("GET", "/compendium/items"),
  createItem: (userId: string, data: any) => request<any>("POST", "/compendium/items", data, userId),
  getWaCreatures: () => request<any[]>("GET", "/compendium/wa-creatures"),
  createWaCreature: (userId: string, data: any) => request<any>("POST", "/compendium/wa-creatures", data, userId),
  getAetheriaCreatures: (userId?: string) => request<any[]>("GET", "/compendium/aetheria-creatures", undefined, userId),
  createAetheriaCreature: (userId: string, data: any) => request<any>("POST", "/compendium/aetheria-creatures", data, userId),
};
