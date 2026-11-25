import "server-only";
import { cache } from "react";
import { siteSectionKeys, type SiteItem, type SiteSection } from "@hr/shared";
import { api } from "./api";
import { defaultSite } from "./site-defaults";
import type { SitePhoto } from "./site-types";

type PublicItem = SiteItem & { mediaAlt: string };

const toPhoto = (i: PublicItem): SitePhoto => ({
  id: String(i.id),
  src: i.mediaId ? `/midia/${i.mediaId}` : i.staticSrc ?? "",
  alt: i.mediaAlt,
  title: i.title,
  subtitle: i.subtitle,
  text: i.text,
});

/** Partes do site montadas pelo marketing. Se a API cair, usa o conteúdo padrão. */
export const getSiteContent = cache(async (): Promise<Record<SiteSection, SitePhoto[]>> => {
  const result = await api<PublicItem[]>("/public/site");
  if (!result.ok) return defaultSite;
  const content = Object.fromEntries(siteSectionKeys.map((key) => [key, result.data.filter((i) => i.section === key).map(toPhoto)])) as Record<SiteSection, SitePhoto[]>;
  // o topo da home nunca pode ficar vazio
  if (!content.destaques.length) content.destaques = defaultSite.destaques;
  return content;
});
