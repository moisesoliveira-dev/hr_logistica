"use client";

import { usePathname } from "next/navigation";
import { SplitText } from "./motion";
import { Button } from "./ui";

/** Convite para cotar, no rodapé. Some na própria página de cotação, onde seria repetido. */
export function FooterCta() {
  if (usePathname() === "/cotacao-online") return null;
  return (
    <div className="wrap flex flex-col items-start justify-between gap-8 border-b border-white/10 py-20 lg:flex-row lg:items-end">
      <SplitText text="Sua carga tem destino. Vamos levar?" highlight={["destino."]} className="display max-w-3xl text-5xl sm:text-7xl" />
      <Button href="/cotacao-online" variant="leaf">Solicitar cotação</Button>
    </div>
  );
}
