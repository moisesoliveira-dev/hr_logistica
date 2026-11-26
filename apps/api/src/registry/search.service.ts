import { Injectable } from "@nestjs/common";
import { formatDocument, normalizeDocument, searchText, type Suggestion } from "@hr/shared";
import { PrismaService } from "../prisma/prisma.service.js";
import { cities } from "./cities.js";

const LIMIT = 8;
// a HR opera no Norte: entre nomes parecidos, essas cidades aparecem primeiro
const north = new Set(["AM", "PA", "RO", "RR", "AC", "AP", "TO"]);

const indexed = cities.map((label) => {
  const uf = label.slice(-2);
  return { label, text: searchText(label), name: searchText(label.slice(0, -5)), first: north.has(uf) ? 0 : 1 };
});

export const isCity = (label: string) => cities.includes(label);

/** Cidades do IBGE que combinam com o que foi digitado: nome exato, depois começo do nome, depois o resto. */
export function searchCities(query: string, limit = LIMIT): Suggestion[] {
  const q = searchText(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const found: { label: string; score: number }[] = [];
  for (const city of indexed) {
    // cada palavra digitada precisa ser o começo de uma palavra da cidade (ou do estado)
    const parts = city.text.split(" ");
    if (!city.text.startsWith(q) && !words.every((w) => parts.some((p) => p.startsWith(w)))) continue;
    const rank = city.name === q || city.text === q ? 0 : city.text.startsWith(q) ? 1 : 2;
    found.push({ label: city.label, score: rank * 2 + city.first });
  }
  return found
    .sort((a, b) => a.score - b.score || a.label.length - b.label.length || a.label.localeCompare(b.label, "pt-BR"))
    .slice(0, limit)
    .map((c) => ({ value: c.label, label: c.label, detail: "Cidade (IBGE)" }));
}

const allWords = (query: string) => searchText(query).split(" ").filter(Boolean).slice(0, 6).map((w) => ({ search: { contains: w } }));

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Locais cadastrados primeiro, depois as cidades. */
  async places(query: string): Promise<Suggestion[]> {
    const words = allWords(query);
    if (searchText(query).length < 2) return [];
    const places = await this.prisma.place.findMany({ where: { AND: words }, orderBy: [{ name: "asc" }, { city: "asc" }], take: LIMIT });
    const registered = places.map((p) => ({ value: `${p.name}, ${p.city}`, label: `${p.name}, ${p.city}`, detail: "Local cadastrado" }));
    return [...registered, ...searchCities(query, Math.max(4, LIMIT - registered.length))];
  }

  async customers(query: string): Promise<Suggestion[]> {
    const text = searchText(query);
    if (text.length < 2) return [];
    const document = normalizeDocument(query);
    const customers = await this.prisma.customer.findMany({
      // com 4 números ou mais, também procura pelo CNPJ ou CPF
      where: { OR: [{ AND: allWords(query) }, ...(/\d{4,}/.test(document) ? [{ document: { contains: document } }] : [])] },
      orderBy: { name: "asc" },
      take: LIMIT,
    });
    return customers.map((c) => ({ value: c.name, label: c.name, detail: formatDocument(c.document), extra: formatDocument(c.document) }));
  }
}
