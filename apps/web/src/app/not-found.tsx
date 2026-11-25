import { SplitText } from "@/components/motion";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <SiteShell>
      <section className="grid-lines flex min-h-svh flex-col items-center justify-center gap-8 bg-night px-6 text-center text-white">
        <p className="display text-[clamp(7rem,30vw,18rem)] text-brand">404</p>
        <SplitText as="h1" text="Essa carga saiu da rota" className="display text-4xl sm:text-6xl" />
        <Button href="/" variant="leaf">Voltar ao início</Button>
      </section>
    </SiteShell>
  );
}
