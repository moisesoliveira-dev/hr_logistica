"use client";

import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useState, type KeyboardEvent } from "react";
import type { MediaItem, Paged } from "@hr/shared";
import { Pagination } from "../pagination";

type Result = { key: string; data?: Paged<MediaItem> };

/** O acervo dentro do seletor de imagem: busca e páginas, sem sair do formulário. */
export function MediaGallery({ selected, onPick }: { selected: string; onPick: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${page}|${query}`;
  const waiting = result?.key !== key;

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/portal/busca/imagens", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: query, page }), signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        setResult({ key: `${page}|${query}`, data: await response.json() });
      } catch {
        if (!controller.signal.aborted) setResult({ key: `${page}|${query}` });
      }
    }, query ? 200 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, page]);

  // o Enter na busca não pode enviar o formulário da notícia ou do item
  const keepForm = (event: KeyboardEvent) => event.key === "Enter" && event.preventDefault();
  const data = result?.data;

  return (
    <div className="mt-3 bg-paper p-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" aria-hidden />
        <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} onKeyDown={keepForm} placeholder="Buscar por descrição ou nome do arquivo" aria-label="Buscar no acervo" maxLength={100} className="w-full rounded-sm border border-ink/15 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-brand" />
        {waiting && <LoaderCircle className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-brand" aria-hidden />}
      </div>

      {data && data.items.length > 0 && (
        <ul className={`mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 ${waiting ? "opacity-50" : ""}`}>
          {data.items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => onPick(m.id)} aria-label={`Usar ${m.alt || m.filename}`} title={m.alt || m.filename} className={`block w-full cursor-pointer overflow-hidden rounded-sm ${m.id === selected ? "ring-4 ring-brand" : "hover:opacity-80"}`}>
                <img src={`/portal/midia/${m.id}`} alt="" loading="lazy" className="aspect-video w-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!waiting && !data && <p role="status" className="p-4 text-center text-sm text-ink/60">Não foi possível carregar o acervo agora.</p>}
      {!waiting && data?.total === 0 && <p role="status" className="p-4 text-center text-sm text-ink/55">{query ? "Nenhuma imagem encontrada." : "Envie imagens na página Imagens."}</p>}
      {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} unit={["imagem", "imagens"]} onPage={setPage} />}
    </div>
  );
}
