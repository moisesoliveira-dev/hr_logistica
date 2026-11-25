import "server-only";
import { cache } from "react";
import { defaultSettings, type SiteSettings } from "@hr/shared";
import { api } from "./api";

/** Contatos, redes e unidades definidos no portal. Se a API cair, usa os valores padrão. */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const result = await api<SiteSettings>("/public/settings");
  return result.ok ? result.data : defaultSettings;
});
