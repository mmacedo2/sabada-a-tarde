import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { api, sessionQuery } from "@/lib/api";

/**
 * The signed-in user, read from the session cookie in the browser. Pending
 * during SSR and the first render, so hydration stays consistent.
 * UI only: the API checks permissions again on every request.
 */
export function useSession() {
  const { data, isPending } = useQuery(sessionQuery);
  const user = data ?? null;
  return {
    user,
    isAdmin: user?.role === "admin",
    /** Admins and managers: both can edit games. */
    canEditGames: user?.role === "admin" || user?.role === "manager",
    isPending,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await api.post("/api/auth/logout").catch(() => undefined);
    queryClient.removeQueries({ queryKey: ["admin"] });
    queryClient.setQueryData(sessionQuery.queryKey, null);
    await navigate({ to: "/" });
  };
}
