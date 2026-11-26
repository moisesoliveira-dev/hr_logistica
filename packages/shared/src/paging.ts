/* Paginação das listas, usada pela API e pelo site. */

export type Paged<T> = { items: T[]; total: number; page: number; pageSize: number };

/** Quantos itens cada lista mostra por página. */
export const pageSizes = { cargas: 20, cadastros: 20, atividades: 30, usuarios: 20, noticias: 20, imagens: 12, hrNews: 6 } as const;

/** Página pedida, sempre dentro do que existe: um número inválido vira 1 e um alto demais vira a última. */
export function pageWindow(total: number, requested: unknown, pageSize: number) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const asked = Number(requested);
  const page = Number.isInteger(asked) && asked > 0 ? Math.min(asked, pages) : 1;
  return { page, pages, skip: (page - 1) * pageSize };
}

/** Para listas que já estão na memória. */
export function slicePage<T>(all: T[], requested: unknown, pageSize: number): Paged<T> {
  const { page, skip } = pageWindow(all.length, requested, pageSize);
  return { items: all.slice(skip, skip + pageSize), total: all.length, page, pageSize };
}
