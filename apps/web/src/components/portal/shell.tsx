"use client";

import { motion, MotionConfig } from "motion/react";
import { ExternalLink, LogOut } from "lucide-react";
import { canEditContent, canManageCargo, roleLabels, type Role } from "@hr/shared";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { logout } from "@/lib/auth/actions";
import { ConfirmProvider } from "../confirm";

type Props = { user: { name: string; department: string; role: Role }; children: React.ReactNode };

export function PortalShell({ user, children }: Props) {
  const pathname = usePathname();
  const menu = useRef<HTMLUListElement>(null);
  const items = [
    { href: "/portal", label: "Início" },
    ...(canManageCargo(user.role) ? [{ href: "/portal/cargas", label: "Cargas" }, { href: "/portal/cadastros", label: "Cadastros" }] : []),
    ...(canEditContent(user.role)
      ? [
          { href: "/portal/conteudo/noticias", label: "Notícias" },
          { href: "/portal/conteudo/imagens", label: "Imagens" },
          { href: "/portal/conteudo/site", label: "Partes do site" },
          { href: "/portal/conteudo/contatos", label: "Contatos e redes" },
        ]
      : []),
    ...(user.role === "admin" ? [{ href: "/portal/usuarios", label: "Usuários" }, { href: "/portal/auditoria", label: "Atividades" }] : []),
    { href: "/portal/perfil", label: "Meu perfil" },
  ];

  // em telas estreitas o menu rola de lado: mantém a aba atual à vista
  useEffect(() => {
    const list = menu.current;
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]');
    if (list && current) list.scrollLeft = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2;
  }, [pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <ConfirmProvider>
        <div className="portal min-h-svh">
          <header className="sticky top-0 z-40">
            <div className="bg-night text-white">
              <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3 sm:px-8">
                <Link href="/portal" aria-label="Início do portal" className="shrink-0 bg-white px-2 py-1.5">
                  <Image src="/brand/logo.jpg" alt="HR da Amazônia" width={140} height={40} preload />
                </Link>
                <p className="ml-auto hidden text-right leading-tight sm:block">
                  <strong className="block text-sm">{user.name}</strong>
                  <span className="text-xs text-white/60">{user.department} · {roleLabels[user.role]}</span>
                </p>
                <Link href="/" aria-label="Ver o site" className="ml-auto flex items-center gap-2 border-white/20 px-2 py-2 text-sm font-bold text-white/75 hover:text-leaf sm:ml-2 sm:border-l sm:pl-5">
                  <ExternalLink className="size-4" aria-hidden /> <span className="hidden md:inline">Ver o site</span>
                </Link>
                <form action={logout}>
                  <button type="submit" className="flex cursor-pointer items-center gap-2 bg-leaf px-4 py-2.5 text-sm font-extrabold text-night transition-colors hover:bg-white">
                    <LogOut className="size-4" aria-hidden /> Sair
                  </button>
                </form>
              </div>
            </div>
            <nav aria-label="Portal" className="bg-brand text-white">
              <ul ref={menu} className="relative mx-auto flex max-w-6xl overflow-x-auto px-2 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
                {items.map((item) => {
                  const active = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(`${item.href}/`));
                  return (
                    <li key={item.href} className="shrink-0">
                      <Link href={item.href} aria-current={active ? "page" : undefined} className={`group relative block px-3.5 py-3.5 text-sm font-bold uppercase tracking-wide transition-colors ${active ? "text-night" : "text-white hover:bg-brand-deep"}`}>
                        {active && <motion.span layoutId="portal-tab" className="absolute inset-0 bg-paper" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
                        <span className="relative whitespace-nowrap">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </header>
          <main id="conteudo" className="min-w-0 overflow-x-clip px-5 pb-16 sm:px-8">
            <motion.div key={pathname} className="mx-auto max-w-6xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
              {children}
            </motion.div>
          </main>
        </div>
      </ConfirmProvider>
    </MotionConfig>
  );
}
