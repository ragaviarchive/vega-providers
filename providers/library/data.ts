import { ProviderContext } from "../types";

// ---------- Library schema (your own catalogue.json) ----------
export interface LibEpisode {
  title: string;
  url: string; // .mp4 / .mkv / .m3u8 (http(s):// or LAN address)
}
export interface LibSeason {
  number: number;
  episodes: LibEpisode[];
}
export interface LibItem {
  id: string;
  title: string;
  type: "movie" | "series";
  year?: number;
  genre?: string[];
  synopsis?: string;
  poster?: string;
  imdbId?: string;
  url?: string; // movies only
  seasons?: LibSeason[]; // series only
}
export interface Library {
  items: LibItem[];
}

// Built-in demo library: freely licensed Blender Foundation films.
// Works out of the box so the provider is usable before you add your own.
const SAMPLE_BASE =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/";
export const SAMPLE_LIBRARY: Library = {
  items: [
    {
      id: "big-buck-bunny",
      title: "Big Buck Bunny",
      type: "movie",
      year: 2008,
      genre: ["Animation", "Comedy"],
      synopsis: "A giant rabbit takes revenge on three bullying rodents.",
      url: SAMPLE_BASE + "BigBuckBunny.mp4",
    },
    {
      id: "sintel",
      title: "Sintel",
      type: "movie",
      year: 2010,
      genre: ["Animation", "Fantasy"],
      synopsis: "A young woman searches for the dragon she once befriended.",
      url: SAMPLE_BASE + "Sintel.mp4",
    },
    {
      id: "tears-of-steel",
      title: "Tears of Steel",
      type: "movie",
      year: 2012,
      genre: ["Sci-Fi"],
      synopsis: "Warriors and scientists try to save the world from robots.",
      url: SAMPLE_BASE + "TearsOfSteel.mp4",
    },
    {
      id: "blender-shorts",
      title: "Blender Shorts",
      type: "series",
      year: 2012,
      genre: ["Animation"],
      synopsis: "A tiny demo series made from open movies.",
      seasons: [
        {
          number: 1,
          episodes: [
            { title: "Elephants Dream", url: SAMPLE_BASE + "ElephantsDream.mp4" },
            { title: "For Bigger Blazes", url: SAMPLE_BASE + "ForBiggerBlazes.mp4" },
          ],
        },
      ],
    },
  ],
};

// ---------- Loading with offline cache ----------
const CACHE_KEY = "library_cache";

async function loadBase(
  providerContext: ProviderContext,
  signal?: AbortSignal
): Promise<Library> {
  const { axios, kvStore } = providerContext as any;
  let url = "";
  try {
    url = ((await kvStore.get("catalogueUrl")) || "").trim();
  } catch {}

  if (!url) return SAMPLE_LIBRARY;

  try {
    const res = await axios.get(url, { signal, timeout: 8000 });
    const lib: Library =
      typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    if (!lib || !Array.isArray(lib.items)) throw new Error("bad catalogue");
    // Cache so the catalogue still browses when the server is unreachable.
    try {
      await kvStore.set(CACHE_KEY, JSON.stringify(lib));
    } catch {}
    return lib;
  } catch (e) {
    try {
      const cached = await kvStore.get(CACHE_KEY);
      if (cached) return JSON.parse(cached) as Library;
    } catch {}
    return SAMPLE_LIBRARY;
  }
}

// Minimal poster fallback: soft pastel card with the title, colour picked per title.
const SOFT = [
  ["F6E6E4", "7A5C58"], // blush
  ["E4EEF6", "56697A"], // mist blue
  ["E6F2E8", "5A7560"], // sage
  ["F3EDE0", "7A6E55"], // sand
  ["ECE6F4", "69587A"], // lavender
  ["F6EBDD", "7A6350"], // peach
];
export function posterFor(item: LibItem): string {
  if (item.poster) return item.poster;
  let h = 0;
  for (const c of item.title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [bg, fg] = SOFT[h % SOFT.length];
  const t = encodeURIComponent(item.title);
  return `https://placehold.co/400x600/${bg}/${fg}/png?text=${t}`;
}

export function detectType(url: string): string {
  return /\.m3u8(\?|$)/i.test(url) ? "m3u8" : "mp4";
}

// ---------- Real artwork + synopsis from TMDB (needs a free API key) ----------
const TMDB_CACHE = "tmdb_cache";
const IMG = "https://image.tmdb.org/t/p/w500";

export async function loadLibrary(
  providerContext: ProviderContext,
  signal?: AbortSignal
): Promise<Library> {
  const lib = await loadBase(providerContext, signal);
  try {
    return await enrich(lib, providerContext, signal);
  } catch {
    return lib;
  }
}

async function enrich(
  lib: Library,
  providerContext: ProviderContext,
  signal?: AbortSignal
): Promise<Library> {
  const { axios, kvStore } = providerContext as any;
  const key = ((await kvStore.get("tmdbKey")) || "").trim();
  if (!key) return lib;

  let cache: Record<string, { poster?: string; overview?: string; imdbId?: string } | null> = {};
  try {
    cache = JSON.parse((await kvStore.get(TMDB_CACHE)) || "{}");
  } catch {}

  const todo = lib.items.filter((i) => !i.poster && cache[i.id] === undefined).slice(0, 40);
  for (let n = 0; n < todo.length; n += 8) {
    await Promise.all(
      todo.slice(n, n + 8).map(async (i) => {
        try {
          const kind = i.type === "series" ? "tv" : "movie";
          const yearParam =
            i.year ? (kind === "tv" ? `&first_air_date_year=${i.year}` : `&year=${i.year}`) : "";
          const r = await axios.get(
            `https://api.themoviedb.org/3/search/${kind}?api_key=${encodeURIComponent(key)}&query=${encodeURIComponent(i.title)}${yearParam}`,
            { signal, timeout: 8000 }
          );
          const hit = r.data?.results?.[0];
          cache[i.id] = hit
            ? {
                poster: hit.poster_path ? IMG + hit.poster_path : undefined,
                overview: hit.overview || undefined,
              }
            : null;
        } catch {
          // network/key error: don't cache, retry next time
        }
      })
    );
  }
  try {
    await kvStore.set(TMDB_CACHE, JSON.stringify(cache));
  } catch {}

  return {
    items: lib.items.map((i) => {
      const c = cache[i.id];
      if (!c) return i;
      return {
        ...i,
        poster: i.poster || c.poster,
        synopsis: i.synopsis || c.overview,
      };
    }),
  };
}
