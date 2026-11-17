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

export async function loadLibrary(
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

// Clean, minimalist poster fallback (plain dark card with the title).
export function posterFor(item: LibItem): string {
  if (item.poster) return item.poster;
  const t = encodeURIComponent(item.title);
  return `https://placehold.co/400x600/111111/eeeeee/png?text=${t}`;
}

export function detectType(url: string): string {
  return /\.m3u8(\?|$)/i.test(url) ? "m3u8" : "mp4";
}
