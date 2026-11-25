import { ParallaxImage, SplitText } from "./motion";
import { PageHero } from "./page-hero";
import { ScrollText } from "./sections";
import { Button } from "./ui";

type Props = { title: string; heading: string; subtitle: string; image: string; photo: string; paragraphs: [string, string] };

/** Modelo das páginas das empresas do grupo (Eficácia e Ambiental). */
export function CompanyPage({ title, heading, subtitle, image, photo, paragraphs }: Props) {
  return (
    <>
      <PageHero title={heading} eyebrow={title} image={image} />
      <section className="wrap max-w-5xl py-24">
        <SplitText text={subtitle} className="display text-4xl text-brand sm:text-6xl" />
        <ScrollText text={paragraphs[0]} className="mt-12 font-display text-2xl font-semibold leading-snug sm:text-3xl" />
        <ParallaxImage src={photo} alt={heading} sizes="(min-width: 1024px) 1024px, 100vw" className="my-14 aspect-video rounded-[2.5rem]" />
        <ScrollText text={paragraphs[1]} className="text-xl leading-relaxed" />
        <div className="mt-12"><Button href="/fale-conosco">Fale conosco</Button></div>
      </section>
    </>
  );
}
