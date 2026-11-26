/* Acompanhamento de cargas: etapas, modais e regras usadas pelo site e pela API. */
import { isValidCnpj } from "./forms.js";
import type { Paged } from "./paging.js";

/*
 * Etapas e tipos de transporte são cadastros. O que o sistema precisa saber de cada etapa é o TIPO:
 * onde a carga começa, o caminho até lá, quando está entregue e o que é problema.
 */
export type StageKind = "inicio" | "andamento" | "entrega" | "ocorrencia";

export const stageKindLabels: Record<StageKind, string> = { inicio: "Início", andamento: "Em andamento", entrega: "Entrega", ocorrencia: "Ocorrência" };

/** As etapas de início e de entrega são do sistema: podem mudar de nome, mas não podem sair. */
export const START_STAGE = "aguardando_coleta";
export const DONE_STAGE = "entregue";

export type StageRef = { key: string; name: string; kind: StageKind };
export type StageOption = StageRef & { active: boolean };
export type ModeRef = { key: string; name: string };
export type ModeOption = ModeRef & { active: boolean };

/** Já vêm na ordem certa: início, andamento, entrega e, por último, ocorrências. */
export type CargoOptions = { stages: StageOption[]; modes: ModeOption[] };

export type CargoInput = {
  invoice: string;
  customerName: string;
  customerDocument: string;
  origin: string;
  destination: string;
  mode: string;
  /** AAAA-MM-DD ou vazio */
  expectedAt: string;
};

export type CargoEventInput = {
  stage: string;
  location: string;
  /** o cliente vê este texto */
  note: string;
  /** AAAA-MM-DDTHH:mm no horário de Manaus; vazio = agora */
  at: string;
};

export type CargoEvent = { id: number; stage: StageRef; location: string; note: string; at: string; createdBy: string };

export type CargoSummary = {
  id: number; code: string; invoice: string; customerName: string; origin: string; destination: string;
  stage: StageRef; expectedAt: string; updatedAt: string;
};

export type CargoDetail = CargoSummary & { customerDocument: string; mode: ModeRef; events: CargoEvent[] };

export type CargoList = Paged<CargoSummary>;

/** O que o cliente enxerga: sem nome, documento ou e-mail de ninguém. */
export type PublicCargo = {
  code: string; invoice: string; origin: string; destination: string; mode: string; stage: StageRef; expectedAt: string;
  /** o caminho normal, do início à entrega, para a barra de progresso */
  route: string[];
  events: Omit<CargoEvent, "createdBy">[];
};

/** Sem 0/O, 1/I/L: o código é ditado por telefone. */
export const CARGO_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Aceita "hr abcd efgh", "HRABCDEFGH" ou "HR-ABCD-EFGH". */
export function normalizeCargoCode(input: string) {
  const c = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^HR[A-Z0-9]{8}$/.test(c) ? `HR-${c.slice(2, 6)}-${c.slice(6)}` : null;
}

export const normalizeDocument = (input: string) => input.toUpperCase().replace(/[.\-/\s]/g, "");

export function isValidCpf(input: string) {
  const c = normalizeDocument(input);
  if (!/^\d{11}$/.test(c) || /^(\d)\1{10}$/.test(c)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(c[i]) * (length + 1 - i);
    return ((sum * 10) % 11) % 10;
  };
  return digit(9) === Number(c[9]) && digit(10) === Number(c[10]);
}

export const isValidDocument = (input: string) => isValidCpf(input) || isValidCnpj(input);

export function formatDocument(document: string) {
  const c = normalizeDocument(document);
  if (c.length === 11) return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
  if (c.length === 14) return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
  return document;
}

/** "2026-11-30" vira "30/11/2026" sem passar por fuso horário. */
export const formatDay = (day: string) => (day ? day.split("-").reverse().join("/") : "");
