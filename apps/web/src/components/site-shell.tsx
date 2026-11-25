import "lenis/dist/lenis.css";
import { getSettings } from "@/lib/settings";
import { Footer } from "./footer";
import { Header } from "./header";
import { Providers } from "./providers";
import { WhatsApp } from "./whatsapp";

/** Moldura do site público (o portal dos funcionários não usa). */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <Providers>
      <Header settings={settings} />
      <main id="conteudo">{children}</main>
      <Footer settings={settings} />
      <WhatsApp contacts={settings.whatsapp} />
    </Providers>
  );
}
