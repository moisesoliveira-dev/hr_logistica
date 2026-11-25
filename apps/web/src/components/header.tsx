"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, ChevronDown, Lock, Mail, PackageSearch } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { socialNetworks, type SiteSettings } from "@hr/shared";
import { company, nav, type NavLink } from "@/lib/content";
import { BrandIcon } from "./icons";
import { Magnetic } from "./motion";
import { Translate } from "./translate";

function Anchor({ link, className, children, onClick }: { link: NavLink; className?: string; children: React.ReactNode; onClick?: () => void }) {
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>{children}</a>
  ) : (
    <Link href={link.href} className={className} onClick={onClick}>{children}</Link>
  );
}

export function Header({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 500 && y > previous);
  });

  useEffect(() => { setMenu(false); setOpen(null); }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    document.documentElement.classList.add("lenis-stopped");
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", key);
    return () => {
      document.documentElement.classList.remove("lenis-stopped");
      document.body.style.overflow = "";
      window.removeEventListener("keydown", key);
    };
  }, [menu]);

  const isActive = (item: (typeof nav)[number]) =>
    "href" in item ? item.href === pathname : item.children.some((c) => c.href === pathname);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: hidden && !menu && !open ? "-110%" : "0%" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        onFocusCapture={() => setHidden(false)}
      >
        <motion.div className="overflow-hidden bg-night text-white/80" animate={{ height: scrolled ? 0 : 38, opacity: scrolled ? 0 : 1 }} initial={false} inert={scrolled}>
          <div className="wrap flex h-[38px] items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              {settings.social.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={socialNetworks[s.network]} className="transition hover:-translate-y-0.5 hover:text-leaf">
                  <BrandIcon id={s.network} className="size-4" />
                </a>
              ))}
              <a href={`mailto:${settings.email}`} className="ml-2 hidden items-center gap-1.5 hover:text-leaf md:flex">
                <Mail className="size-3.5" aria-hidden /> {settings.email}
              </a>
            </div>
            <div className="flex items-center gap-5">
              <Link href="/rastreamento" className="hidden items-center gap-1.5 font-bold hover:text-leaf sm:flex">
                <PackageSearch className="size-3.5" aria-hidden /> Acompanhe sua carga
              </Link>
              <Link href="/login" prefetch={false} className="hidden items-center gap-1.5 font-bold hover:text-leaf sm:flex">
                <Lock className="size-3.5" aria-hidden /> Área do Colaborador
              </Link>
              <Translate />
            </div>
          </div>
        </motion.div>

        <div className="px-3 pt-3 sm:px-5">
          <nav aria-label="Principal" className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full border border-white/60 bg-white/95 py-2 pl-5 pr-2 transition-shadow duration-500 ${scrolled ? "shadow-2xl shadow-night/25" : "shadow-lg shadow-night/10"}`}>
            <Link href="/" aria-label={`${company.name} — página inicial`} className="shrink-0">
              <motion.span className="block" whileHover={{ scale: 1.06, rotate: -2 }}>
                <Image src="/brand/logo.jpg" alt={`${company.name} ${company.tagline}`} width={149} height={42} preload className="mix-blend-multiply" />
              </motion.span>
            </Link>

            <ul className="hidden items-center lg:flex" onMouseLeave={() => { setHovered(null); setOpen(null); }}>
              {nav.map((item) => {
                const expanded = open === item.label;
                const cls = `relative flex cursor-pointer items-center gap-1 rounded-full px-4 py-2.5 text-sm font-bold ${isActive(item) ? "text-brand-deep" : "text-ink"}`;
                const content = (
                  <>
                    {hovered === item.label && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-leaf/25" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                    <span className="relative">{item.label}</span>
                  </>
                );
                return (
                  <li
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => { setHovered(item.label); setOpen("children" in item ? item.label : null); }}
                    onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen((o) => (o === item.label ? null : o)); }}
                    onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
                  >
                    {"href" in item ? (
                      <Link href={item.href} className={cls}>{content}</Link>
                    ) : (
                      <button type="button" className={cls} aria-expanded={expanded} onClick={() => setOpen(item.label)}>
                        {content}
                        <ChevronDown className={`relative size-3.5 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                    )}
                    <AnimatePresence>
                      {"children" in item && expanded && (
                        <motion.div
                          className="absolute left-1/2 top-full w-80 -translate-x-1/2 pt-4"
                          initial={{ opacity: 0, y: 24, rotateX: -35, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.18 } }}
                          transition={{ type: "spring", stiffness: 300, damping: 24 }}
                          style={{ transformOrigin: "top", transformPerspective: 900 }}
                        >
                          <motion.ul className="rounded-3xl bg-night p-3 text-white shadow-2xl" initial="hidden" animate="show" transition={{ staggerChildren: 0.045 }}>
                            {item.children.map((child) => (
                              <motion.li key={child.href} variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0 } }}>
                                <Anchor link={child} onClick={() => setOpen(null)} className={`group/item flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-brand ${child.href === pathname ? "text-leaf" : ""}`}>
                                  <span className="transition-transform duration-300 group-hover/item:translate-x-1.5">{child.label}</span>
                                  <ArrowUpRight className="size-4 -translate-x-2 opacity-0 transition group-hover/item:translate-x-0 group-hover/item:opacity-100" aria-hidden />
                                </Anchor>
                              </motion.li>
                            ))}
                          </motion.ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2">
              <Magnetic>
                <Link href="/cotacao-online" className="group relative hidden overflow-hidden rounded-full bg-brand px-6 py-3 text-sm font-extrabold text-white sm:block">
                  <span aria-hidden className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/35 transition-all duration-700 group-hover:left-[130%]" />
                  <span className="relative">Cotação Online</span>
                </Link>
              </Magnetic>
              <button type="button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label={menu ? "Fechar menu" : "Abrir menu"} className="relative grid size-11 cursor-pointer place-items-center rounded-full bg-night lg:hidden">
                <motion.span className="absolute h-0.5 w-5 bg-white" animate={menu ? { rotate: 45, y: 0 } : { rotate: 0, y: -4 }} />
                <motion.span className="absolute h-0.5 w-5 bg-white" animate={menu ? { rotate: -45, y: 0 } : { rotate: 0, y: 4 }} />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            data-lenis-prevent
            className="grid-lines fixed inset-0 z-40 overflow-y-auto bg-night px-6 pb-16 pt-36 text-white lg:hidden"
            initial={{ clipPath: "circle(0% at 92% 80px)" }}
            animate={{ clipPath: "circle(160% at 92% 80px)" }}
            exit={{ clipPath: "circle(0% at 92% 80px)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.09, delayChildren: 0.25 }} className="space-y-8">
              {[...nav, { label: "Cotação Online", href: "/cotacao-online" }].map((item) => (
                <motion.div key={item.label} variants={{ hidden: { opacity: 0, x: -60, rotate: -4 }, show: { opacity: 1, x: 0, rotate: 0 } }}>
                  {"href" in item ? (
                    <Link href={item.href} onClick={() => setMenu(false)} className="font-display text-3xl font-extrabold">{item.label}</Link>
                  ) : (
                    <>
                      <p className="eyebrow mb-3 text-leaf">{item.label}</p>
                      <ul className="space-y-2.5">
                        {item.children.map((c) => (
                          <li key={c.href}><Anchor link={c} onClick={() => setMenu(false)} className="text-lg font-semibold text-white/85">{c.label}</Anchor></li>
                        ))}
                      </ul>
                    </>
                  )}
                </motion.div>
              ))}
              <Link href="/login" prefetch={false} onClick={() => setMenu(false)} className="flex w-fit items-center gap-2 rounded-full border border-leaf px-5 py-3 font-bold text-leaf">
                <Lock className="size-4" aria-hidden /> Área do Colaborador
              </Link>
              <Translate />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
