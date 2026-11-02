// Native Supabase auth (replaces previous Clerk shim).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

// A stalled session restore (blocked storage, network hiccup on refresh) must
// never leave every protected page spinning forever.
const SESSION_RESTORE_TIMEOUT_MS = 8000;

function toAuthUser(u: User | null | undefined): AuthUser | null {
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const display =
    (meta.display_name as string) ||
    (meta.full_name as string) ||
    (meta.name as string) ||
    (u.email ? u.email.split("@")[0] : undefined);
  return { id: u.id, email: u.email ?? "", display_name: display };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;
    const finish = () => {
      settled = true;
      setLoading(false);
    };
    // Listener first (per Supabase recommendation)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!settled) finish();
    });
    const timeout = window.setTimeout(() => {
      if (!settled) {
        console.warn("[auth] session restore timed out");
        finish();
      }
    }, SESSION_RESTORE_TIMEOUT_MS);
    // Then restore from storage
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch((err) => console.warn("[auth] session restore failed", err))
      .finally(finish);
    return () => {
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Token refreshes replace the session object without changing the user:
  // keep the same user object so consumers depending on it do not re-render.
  const sessionUser = session?.user;
  const userKey = sessionUser ? `${sessionUser.id}|${sessionUser.email}|${JSON.stringify(sessionUser.user_metadata ?? {})}` : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const user = useMemo(() => toAuthUser(sessionUser), [userKey]);

  const value = useMemo<AuthContextType>(
    () => ({ user, session, loading, signOut }),
    [user, session, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
