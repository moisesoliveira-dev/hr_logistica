import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import type { SettingsResponse } from "@hr/shared";
import { SettingsEditor } from "@/components/portal/settings-editor";
import { PageTitle } from "@/components/portal/ui";
import { apiData, requireContentEditor } from "@/lib/auth/session";
import { formatDate } from "@/lib/auth/shared";

export const metadata: Metadata = { title: "Contatos e redes" };

export default async function ContactsPage() {
  await requireContentEditor();
  const settings = await apiData<SettingsResponse>("/content/settings");
  return (
    <>
      <PageTitle eyebrow="Conteúdo do site" title="Contatos e redes" />
      <p className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-ink/60">
        {settings.version ? `Última alteração em ${formatDate(settings.version)} por ${settings.updatedBy}.` : "Ainda com os dados originais do site."}
        <a href="/fale-conosco" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-brand-deep hover:text-night"><ExternalLink className="size-4" aria-hidden /> Ver no site</a>
      </p>
      <SettingsEditor initial={settings.data} version={settings.version} />
    </>
  );
}
