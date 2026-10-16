import { getRouteApi } from "@tanstack/react-router";
import { useMemo } from "react";

const rootRoute = getRouteApi("__root__");

/** Season, clubs and competitions loaded once by the root route. */
export function useCatalog() {
  const catalog = rootRoute.useLoaderData();
  return useMemo(() => {
    const clubs = new Map(catalog.clubs.map((c) => [c.slug, c]));
    const competitions = new Map(catalog.competitions.map((c) => [c.slug, c]));
    return {
      ...catalog,
      season: catalog.seasons.find((s) => s.isCurrent) ?? null,
      clubBySlug: (slug: string | null) => (slug ? clubs.get(slug) : undefined),
      competitionBySlug: (slug: string) => competitions.get(slug),
    };
  }, [catalog]);
}
