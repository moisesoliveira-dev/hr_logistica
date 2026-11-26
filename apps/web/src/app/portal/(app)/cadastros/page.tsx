import { redirect } from "next/navigation";
import { requireCargoManager } from "@/lib/auth/session";

export default async function RegistryHomePage() {
  await requireCargoManager();
  redirect("/portal/cadastros/clientes");
}
