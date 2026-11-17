import { ProviderContext, SettingsField } from "../types";

// Shown in the app's provider settings; saved to kvStore under `key`.
export const getSettingsSchema = async function ({
  providerContext,
}: {
  providerContext: ProviderContext;
}): Promise<SettingsField[]> {
  return [
    {
      key: "catalogueUrl",
      type: "text",
      label: "Catalogue URL",
      description:
        "Link to your catalogue.json (home server, NAS, LAN address or raw GitHub URL). Leave empty for the built-in demo library. The last good copy is cached for offline browsing.",
      placeholder: "http://192.168.1.10:8080/catalogue.json",
    } as SettingsField,
    {
      key: "tmdbKey",
      type: "text",
      label: "TMDB API key (for posters)",
      description:
        "Free key from themoviedb.org (Settings > API). Adds real posters and descriptions to your titles automatically.",
      placeholder: "paste your v3 API key",
    } as SettingsField,
  ];
};
