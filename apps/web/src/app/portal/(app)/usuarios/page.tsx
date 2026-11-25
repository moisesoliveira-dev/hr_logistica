import type { Metadata } from "next";
import type { Employee } from "@hr/shared";
import { PageTitle } from "@/components/portal/ui";
import { UserAdmin } from "@/components/portal/users";
import { apiData, requireAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  const { user } = await requireAdmin();
  const employees = await apiData<Employee[]>("/users");
  return (
    <>
      <PageTitle eyebrow="Administração" title="Usuários" />
      <UserAdmin employees={employees.map((e) => ({ ...e, lastLogin: e.lastLoginAt ? formatDate(e.lastLoginAt) : "nunca" }))} selfId={user.id} />
    </>
  );
}
