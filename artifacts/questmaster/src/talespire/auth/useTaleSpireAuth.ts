import { useCallback, useMemo, useState } from "react";
import { AetheriaMcpClient } from "../core/mcpClient";
import { accessToken, exchangeCode, loadTokens, signOut, startAuthorization, type StoredTokens } from "./oauth";

/** Session state of the Symbiote: OAuth in the same window or a pasted link code. */
export function useTaleSpireAuth() {
  const [tokens, setTokens] = useState<StoredTokens | null>(() => loadTokens());
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const client = useMemo(() => new AetheriaMcpClient(async (force) => {
    const t = await accessToken(force);
    if (!t) setTokens(null);
    return t;
  }), []);

  const signInHere = useCallback(async () => { window.location.assign(await startAuthorization()); }, []);
  const prepareLinkCode = useCallback(async () => {
    const url = await startAuthorization();
    setLinkUrl(url);
    window.open(url, "_blank", "noopener"); // system browser when the host allows it
    return url;
  }, []);
  const submitLinkCode = useCallback(async (code: string) => { setTokens(await exchangeCode(code)); setLinkUrl(null); }, []);
  const logout = useCallback(() => { signOut(); setTokens(null); }, []);

  return { tokens, client, signInHere, prepareLinkCode, linkUrl, submitLinkCode, logout };
}
