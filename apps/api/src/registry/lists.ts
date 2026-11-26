/* Leitura das listas cadastradas, usada pelas cargas, pelo painel e pelas contas. */
import type { CargoOptions, StageKind, StageOption, StageRef } from "@hr/shared";
import type { Prisma, Stage } from "../generated/prisma/client.js";

const kindOrder: Record<StageKind, number> = { inicio: 0, andamento: 1, entrega: 2, ocorrencia: 3 };

export const toStageRef = (s: Stage): StageRef => ({ key: s.key, name: s.name, kind: s.kind });

/** Na ordem em que a carga anda: início, andamento, entrega e, por último, as ocorrências. */
export async function loadStages(db: Prisma.TransactionClient) {
  const stages = await db.stage.findMany({ orderBy: [{ position: "asc" }, { key: "asc" }] });
  return stages.sort((a, b) => kindOrder[a.kind] - kindOrder[b.kind]);
}

export async function loadCargoOptions(db: Prisma.TransactionClient): Promise<CargoOptions> {
  const [stages, modes] = await Promise.all([loadStages(db), db.transportMode.findMany({ orderBy: { name: "asc" } })]);
  return {
    stages: stages.map((s): StageOption => ({ ...toStageRef(s), active: s.active })),
    modes: modes.map((m) => ({ key: m.key, name: m.name, active: m.active })),
  };
}
