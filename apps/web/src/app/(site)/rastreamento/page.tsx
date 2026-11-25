import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { Tracking } from "@/components/tracking";
import { getSettings } from "@/lib/settings";

const intro = "Informe o código da carga e o CNPJ ou CPF do cliente para ver onde ela está.";

export const metadata: Metadata = { title: "Acompanhe sua carga", description: intro };

type Props = { searchParams: Promise<{ codigo?: string | string[] }> };

export default async function Rastreamento({ searchParams }: Props) {
  const [{ codigo }, settings] = await Promise.all([searchParams, getSettings()]);
  return (
    <>
      <PageHero title="Onde está sua carga?" eyebrow="Acompanhe sua carga" image="/fotos/frota-03.jpg" intro={intro} />
      <section className="wrap max-w-5xl py-16">
        <Tracking initialCode={typeof codigo === "string" ? codigo.slice(0, 30).toUpperCase() : ""} legacyUrl={settings.trackingUrl} />
      </section>
    </>
  );
}
