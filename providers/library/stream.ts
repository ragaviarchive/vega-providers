import { ProviderContext, Stream } from "../types";
import { detectType } from "./data";

// `link` is already a direct media URL (from meta/episodes), so no scraping.
// Direct files are listed first, which suits downloads (offline viewing).
export const getStream = async function ({
  link,
}: {
  link: string;
  type: string;
  signal: AbortSignal;
  isDownload?: boolean;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  return [
    {
      server: "Library",
      link,
      type: detectType(link),
    } as Stream,
  ];
};
