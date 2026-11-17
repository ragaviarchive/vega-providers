import { Post, ProviderContext } from "../types";
import { loadLibrary, posterFor, LibItem } from "./data";

const toPost = (i: LibItem): Post => ({
  title: i.year ? `${i.title} (${i.year})` : i.title,
  link: i.id,
  image: posterFor(i),
});

export const getPosts = async function ({
  filter,
  page,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue?: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  if (page > 1) return []; // whole library is returned on page 1
  const { items } = await loadLibrary(providerContext, signal);

  let out = items;
  if (filter === "movie" || filter === "series") {
    out = items.filter((i) => i.type === filter);
  } else if (filter === "recent") {
    out = [...items].reverse().slice(0, 30); // later entries = newer
  } else if (filter.startsWith("genre:")) {
    const g = filter.slice(6).toLowerCase();
    out = items.filter((i) => (i.genre || []).some((x) => x.toLowerCase() === g));
  }
  return out.map(toPost);
};

export const getSearchPosts = async function ({
  searchQuery,
  page,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue?: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  if (page > 1) return [];
  const q = searchQuery.trim().toLowerCase();
  const { items } = await loadLibrary(providerContext, signal);
  return items.filter((i) => i.title.toLowerCase().includes(q)).map(toPost);
};
