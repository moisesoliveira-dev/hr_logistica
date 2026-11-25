import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/detail-page";
import { solutions } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => solutions.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = solutions.find((i) => i.slug === slug);
  return { title: item?.title, description: item?.short };
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const item = solutions.find((i) => i.slug === slug);
  if (!item) notFound();
  return <DetailPage key={slug} item={item} siblings={solutions} base="/solucao" eyebrow="Soluções" />;
}
