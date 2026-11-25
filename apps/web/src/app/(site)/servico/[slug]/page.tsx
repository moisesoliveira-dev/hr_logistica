import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/detail-page";
import { services } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => services.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = services.find((i) => i.slug === slug);
  return { title: item?.title, description: item?.short };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const item = services.find((i) => i.slug === slug);
  if (!item) notFound();
  return <DetailPage key={slug} item={item} siblings={services} base="/servico" eyebrow="Serviços" />;
}
