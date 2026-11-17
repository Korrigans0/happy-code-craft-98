import { MCP_ENDPOINT } from "./config";

export class McpHttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export class McpToolError extends Error {
  constructor(public code: string, message: string, public details: Record<string, unknown>) { super(message); }
}

type TokenProvider = (forceRefresh?: boolean) => Promise<string | null>;

/** Parses a JSON or SSE (text/event-stream) JSON-RPC response. */
async function readRpc(res: Response): Promise<any> {
  const text = await res.text();
  if ((res.headers.get("content-type") ?? "").includes("text/event-stream")) {
    const lines = text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim());
    for (const line of lines.reverse()) {
      try { const msg = JSON.parse(line); if ("result" in msg || "error" in msg) return msg; } catch { /* next */ }
    }
    return null;
  }
  return text ? JSON.parse(text) : null;
}

/** Minimal MCP client (Streamable HTTP) calling the documented Aetheria API v0.2.0. */
export class AetheriaMcpClient {
  private sessionId: string | null = null;
  private initialized = false;
  private nextId = 1;
  constructor(private getToken: TokenProvider) {}

  private async post(body: unknown, retry = true): Promise<Response> {
    const token = await this.getToken();
    if (!token) throw new McpHttpError(401, "Not authenticated");
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
    const res = await fetch(MCP_ENDPOINT, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.status === 401 && retry) {
      await this.getToken(true);
      return this.post(body, false);
    }
    if (!res.ok && res.status !== 202) throw new McpHttpError(res.status, `HTTP ${res.status}`);
    const sid = res.headers.get("mcp-session-id");
    if (sid) this.sessionId = sid;
    return res;
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    const res = await this.post({
      jsonrpc: "2.0", id: this.nextId++, method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "aetheria-talespire", version: "0.1.0" } },
    });
    await readRpc(res);
    await this.post({ jsonrpc: "2.0", method: "notifications/initialized" });
    this.initialized = true;
  }

  async callTool<T = any>(name: string, args: Record<string, unknown>): Promise<T> {
    await this.ensureInitialized();
    const res = await this.post({ jsonrpc: "2.0", id: this.nextId++, method: "tools/call", params: { name, arguments: args } });
    const msg = await readRpc(res);
    if (msg?.error) {
      // Session expired server-side: re-initialize once.
      this.initialized = false; this.sessionId = null;
      throw new McpToolError("RPC_ERROR", msg.error.message ?? "RPC error", {});
    }
    const result = msg?.result;
    if (result?.isError) {
      const text = result.content?.[0]?.text ?? "";
      try {
        const parsed = JSON.parse(text);
        const { code, message, ...rest } = parsed.error ?? {};
        throw new McpToolError(code ?? "TOOL_ERROR", message ?? text, rest);
      } catch (e) {
        if (e instanceof McpToolError) throw e;
        throw new McpToolError("TOOL_ERROR", text, {});
      }
    }
    return result?.structuredContent as T;
  }
}
