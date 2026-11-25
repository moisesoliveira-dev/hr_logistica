/* Indicador visual apenas. A regra que vale é a da API (passwordProblem em apps/api/src/auth/password.ts). */
import { MIN_PASSWORD as MIN_LENGTH } from "@hr/shared";

export function strengthOf(password: string) {
  if (!password) return { score: 0, label: "" };
  if (password.length < MIN_LENGTH || new Set(password.toLowerCase()).size < 5) return { score: 1, label: "fraca" };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  const points = (password.length >= 14 ? 1 : 0) + (password.length >= 18 ? 1 : 0) + (kinds >= 3 ? 1 : 0);
  if (points === 0) return { score: 2, label: "razoável" };
  return points === 1 ? { score: 3, label: "boa" } : { score: 4, label: "forte" };
}
