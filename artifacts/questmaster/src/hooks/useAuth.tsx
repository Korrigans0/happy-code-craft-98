// Auth is now handled by Clerk.
// This hook is a compatibility shim so all existing components can keep
// calling `useAuth()` without changes — it maps Clerk's useUser/useClerk
// to the shape the rest of the app expects.

import { useUser, useClerk } from "@clerk/react";
import { createContext, useContext } from "react";

interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: { user: AuthUser } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

// Kept for any component that still imports AuthProvider — it's now a no-op wrapper
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useAuth(): AuthContextType {
  const { user, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const authUser: AuthUser | null = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        display_name:
          user.fullName ||
          user.firstName ||
          user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          undefined,
      }
    : null;

  return {
    user: authUser,
    session: authUser ? { user: authUser } : null,
    loading: !isLoaded,
    signOut: () => clerkSignOut(),
  };
}
