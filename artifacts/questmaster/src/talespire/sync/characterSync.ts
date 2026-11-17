// Bidirectional sync: queues local edits (persisted for offline use), pushes them with
// expected_version, rebases on CONFLICT, and polls the site for remote changes.
import { AetheriaMcpClient, McpToolError } from "../core/mcpClient";
import { POLL_INTERVAL_MS, SAVE_DEBOUNCE_MS } from "../core/config";
import { loadJson, saveJson } from "../core/storage";
import { applyPatch, combinePatches, emptyPatch, isEmptyPatch, type PendingPatch } from "./pendingPatch";

export type SyncStatus = "synced" | "pending" | "saving" | "offline" | "error" | "readonly";
export interface CharacterEntry {
  server: Record<string, any>;     // last confirmed server copy
  version: string;
  canEdit: boolean;
  pending: PendingPatch;
  status: SyncStatus;
  remoteRevision: number;          // bumps only when a change from elsewhere arrives
  error?: string;
}

type Listener = () => void;
const MAX_CONFLICT_RETRIES = 3;

export class CharacterSync {
  private entries = new Map<string, CharacterEntry>();
  private listeners = new Set<Listener>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private poller: ReturnType<typeof setInterval> | null = null;
  private lastPoll: string | null = null;
  private flushing = new Set<string>();

  constructor(private api: AetheriaMcpClient) {
    window.addEventListener("online", () => this.flushAll());
  }

  subscribe(fn: Listener) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private emit() { this.listeners.forEach((l) => l()); }
  get(id: string) { return this.entries.get(id); }
  /** Server copy with queued edits applied: what the sheet should display. */
  view(id: string) { const e = this.entries.get(id); return e ? applyPatch(e.server, e.pending) : null; }

  private update(id: string, patch: Partial<CharacterEntry>) {
    const e = this.entries.get(id); if (!e) return;
    this.entries.set(id, { ...e, ...patch });
    if ("pending" in patch) saveJson(`pending:${id}`, this.entries.get(id)!.pending);
    this.emit();
  }

  async open(id: string) {
    const res = await this.api.callTool<{ character: any; version: string; can_edit: boolean }>("get_character", { character_id: id });
    const pending = loadJson<PendingPatch>(`pending:${id}`, emptyPatch());
    const prev = this.entries.get(id);
    this.entries.set(id, {
      server: res.character, version: res.version, canEdit: res.can_edit, pending,
      status: !res.can_edit ? "readonly" : isEmptyPatch(pending) ? "synced" : "pending",
      remoteRevision: (prev?.remoteRevision ?? 0) + 1,
    });
    this.emit();
    if (!isEmptyPatch(pending) && res.can_edit) this.flush(id);
    this.startPolling();
  }

  close(id: string) { this.flush(id); this.entries.delete(id); this.emit(); }

  /** Called by the sheet adapter with a minimal patch. */
  edit(id: string, patch: PendingPatch) {
    const e = this.entries.get(id);
    if (!e || !e.canEdit || isEmptyPatch(patch)) return;
    this.update(id, { pending: combinePatches(e.pending, patch), status: "pending" });
    clearTimeout(this.timers.get(id));
    this.timers.set(id, setTimeout(() => this.flush(id), SAVE_DEBOUNCE_MS));
  }

  flushAll() { this.entries.forEach((_, id) => this.flush(id)); }

  async flush(id: string, attempt = 0): Promise<void> {
    const e = this.entries.get(id);
    if (!e || isEmptyPatch(e.pending) || this.flushing.has(id)) return;
    if (!navigator.onLine) { this.update(id, { status: "offline" }); return; }
    this.flushing.add(id);
    const sent = e.pending;
    this.update(id, { status: "saving" });
    try {
      const res = await this.api.callTool<{ character: any; version: string }>("update_character", {
        character_id: id,
        expected_version: e.version,
        ...(Object.keys(sent.fields).length ? { fields: sent.fields } : {}),
        ...(Object.keys(sent.systemData).length ? { system_data_patch: sent.systemData } : {}),
      });
      const now = this.entries.get(id); if (!now) return;
      // Keep edits made while the request was in flight.
      const left = now.pending === sent ? emptyPatch() : now.pending;
      this.update(id, { server: res.character, version: res.version, pending: left, status: isEmptyPatch(left) ? "synced" : "pending", error: undefined });
      if (!isEmptyPatch(left)) setTimeout(() => this.flush(id), 0);
    } catch (err) {
      if (err instanceof McpToolError && err.code === "CONFLICT" && attempt < MAX_CONFLICT_RETRIES) {
        // Rebase: adopt the newer server copy, keep local edits on top, retry.
        const latest = err.details.character as Record<string, any> | undefined;
        const version = err.details.current_version as string | undefined;
        if (latest && version) {
          const now = this.entries.get(id)!;
          this.update(id, { server: latest, version, remoteRevision: now.remoteRevision + 1 });
          this.flushing.delete(id);
          return this.flush(id, attempt + 1);
        }
      }
      if (err instanceof McpToolError && (err.code === "FORBIDDEN" || err.code === "FIELD_NOT_EDITABLE")) {
        this.update(id, { status: "error", error: err.message, canEdit: err.code !== "FORBIDDEN" ? e.canEdit : false });
      } else {
        this.update(id, { status: navigator.onLine ? "error" : "offline", error: (err as Error).message });
        setTimeout(() => this.flush(id), 5000); // network/server hiccup: retry, edits stay queued
      }
    } finally {
      this.flushing.delete(id);
    }
  }

  private startPolling() {
    if (this.poller) return;
    this.poller = setInterval(() => this.poll(), POLL_INTERVAL_MS);
  }

  stop() { if (this.poller) clearInterval(this.poller); this.poller = null; }

  /** Site → TaleSpire: fetch characters changed since the last poll and refresh open ones. */
  async poll() {
    if (!this.entries.size || !navigator.onLine) return;
    try {
      const res = await this.api.callTool<{ characters: { id: string; version: string }[]; server_time: string }>("list_characters", {
        scope: "accessible", limit: 100, ...(this.lastPoll ? { updated_since: this.lastPoll } : {}),
      });
      this.lastPoll = res.server_time;
      for (const c of res.characters) {
        const e = this.entries.get(c.id);
        if (!e || Date.parse(c.version) === Date.parse(e.version)) continue;
        if (!isEmptyPatch(e.pending)) { this.flush(c.id); continue; } // conflict path rebases
        await this.open(c.id);
      }
    } catch { /* next tick retries */ }
  }
}
