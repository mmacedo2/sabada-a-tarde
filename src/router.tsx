import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { ApiError } from "./lib/api";
import { routeTree } from "./routeTree.gen";

/** An expired session in the admin sends the user back to the login page. */
function onApiError(error: unknown) {
  if (typeof window === "undefined" || !(error instanceof ApiError) || error.status !== 401) return;
  const path = window.location.pathname;
  if (path.startsWith("/admin"))
    window.location.assign(`/entrar?redirect=${encodeURIComponent(path)}`);
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: onApiError }),
    mutationCache: new MutationCache({ onError: onApiError }),
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
