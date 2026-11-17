import { EpisodeLink, ProviderContext } from "../types";
import { loadLibrary } from "./data";

export const getEpisodes = async function ({
  url,
  providerContext,
}: {
  url: string; // "<id>::<seasonNumber>"
  providerContext: ProviderContext;
}): Promise<EpisodeLink[]> {
  const [id, seasonStr] = url.split("::");
  const { items } = await loadLibrary(providerContext);
  const season = items
    .find((i) => i.id === id)
    ?.seasons?.find((s) => String(s.number) === seasonStr);
  if (!season) return [];
  return season.episodes.map((e, idx) => ({
    title: `Episode ${idx + 1} · ${e.title}`,
    link: e.url,
  }));
};
