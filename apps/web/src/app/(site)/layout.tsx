import { SiteShell } from "@/components/site-shell";

// contatos e redes vêm do portal
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
