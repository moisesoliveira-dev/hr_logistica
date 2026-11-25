/* Utilidades que podem ser usadas no navegador, no servidor e no proxy. */
import type { Credential } from "@hr/shared";

export const SESSION_COOKIE = "hr_session";

export type FormState = {
  error?: string;
  success?: string;
  fields?: Record<string, string>;
  /** Devolve o que foi digitado para o formulário não esvaziar. Nunca inclui senhas. */
  values?: Record<string, string>;
  credential?: Credential;
  /** muda a cada resposta, para repetir a animação de erro */
  stamp?: number;
};

/** Só permite voltar para páginas do próprio portal (evita redirecionamento aberto). */
export const safeNext = (value: string) => (/^\/portal(\/[a-z0-9-]+)*$/.test(value) ? value : "/portal");

export const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Manaus", dateStyle: "short", timeStyle: "short" }) : "—";
