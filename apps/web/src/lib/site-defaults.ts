import type { SiteSection } from "@hr/shared";
import { clients, testimonials } from "./content";
import type { SitePhoto } from "./site-types";

/* Reserva para quando a API está fora do ar. O conteúdo de verdade é editado no portal. */
const item = (id: string, src: string, title = "", subtitle = "", text = ""): SitePhoto => ({ id, src, alt: "", title, subtitle, text });
const series = (prefix: string, total: number) => Array.from({ length: total }, (_, i) => item(`${prefix}-${i}`, `/fotos/${prefix}-0${i + 1}.jpg`));

export const defaultSite: Record<SiteSection, SitePhoto[]> = {
  destaques: [
    item("d1", "/fotos/sede-03.jpg", "Rodo-fluvial", "Carreta cruzando ponte sobre o rio na Amazônia"),
    item("d2", "/fotos/sede-02.jpg", "Matriz em Manaus", "Vista aérea da sede da HR da Amazônia em Manaus"),
    item("d3", "/fotos/sede-04.jpg", "Cabotagem", "Pátio de contêineres visto do alto"),
    item("d4", "/fotos/armazem-03.jpg", "Armazenagem", "Corredor de armazém com posições pallet verticalizadas"),
  ],
  depoimentos: testimonials.map((t) => item(t.name, "", t.name, t.role, t.quote)),
  clientes: clients.map((c) => item(c.name, c.logo, c.name)),
  galeria_frota: series("frota", 4),
  galeria_armazens: series("armazem", 4),
  galeria_estrutura: series("sede", 6),
};
