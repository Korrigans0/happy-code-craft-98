import { useQuery } from "@tanstack/react-query";
import { rolesApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export function useIsAdmin() {
  const { user } = useAuth();
  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => rolesApi.isAdmin(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  return isAdmin;
}
