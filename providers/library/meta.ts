import { Info, ProviderContext } from "../types";
import { loadLibrary, posterFor } from "./data";

export const getMeta = async function ({
  link,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Info> {
  const { items } = await loadLibrary(providerContext);
  const item = items.find((i) => i.id === link);
  if (!item) throw new Error("Not found in library");

  const base = {
    title: item.title,
    synopsis: item.synopsis || "",
    image: posterFor(item),
    imdbId: item.imdbId || "",
    type: item.type,
  };

  if (item.type === "movie") {
    return {
      ...base,
      linkList: [
        {
          title: "Movie",
          directLinks: [{ title: "Play", link: item.url!, type: "movie" }],
        },
      ],
    } as Info;
  }

  // Series: one dropdown entry per season, episodes fetched via episodes.ts
  return {
    ...base,
    linkList: (item.seasons || []).map((s) => ({
      title: `Season ${s.number}`,
      episodesLink: `${item.id}::${s.number}`,
    })),
  } as Info;
};
