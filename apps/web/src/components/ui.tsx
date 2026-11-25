import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Magnetic } from "./motion";

const variants = {
  solid: "bg-brand text-white",
  leaf: "bg-leaf text-night",
  outline: "border border-current",
  light: "bg-white text-night",
};

/** Botão com texto que "rola" e preenchimento no hover. `magnetic` é exclusivo do "Cotação Online". */
export function Button({
  href, children, variant = "solid", external = false, magnetic = false,
}: { href: string; children: string; variant?: keyof typeof variants; external?: boolean; magnetic?: boolean }) {
  const inner = (
    <>
      <span aria-hidden className="absolute inset-0 translate-y-[102%] rounded-[50%] bg-night transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:rounded-none" />
      <span className="relative block h-5 overflow-hidden leading-5 group-hover:text-white">
        <span className="block transition-transform duration-500 ease-out group-hover:-translate-y-5">
          <span className="block">{children}</span>
          <span className="block" aria-hidden>{children}</span>
        </span>
      </span>
      <ArrowUpRight className="relative size-4 transition-transform duration-500 group-hover:rotate-45 group-hover:text-leaf" aria-hidden />
    </>
  );
  const cls = `group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-4 text-sm font-extrabold ${variants[variant]}`;
  const button = external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
  ) : (
    <Link href={href} className={cls}>{inner}</Link>
  );
  return magnetic ? <Magnetic>{button}</Magnetic> : <div className="inline-block">{button}</div>;
}
