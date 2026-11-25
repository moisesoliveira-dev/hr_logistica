"use client";

import { Languages } from "lucide-react";
import { useEffect, useState } from "react";

const langs = ["pt", "en", "es"] as const;

declare global {
  interface Window {
    google?: { translate: { TranslateElement: new (o: object, id: string) => void } };
    googleTranslateElementInit?: () => void;
  }
}

/** O Google Tradutor mexe no DOM; sem isto o React pode quebrar ao navegar. */
function guardDom() {
  const remove = Node.prototype.removeChild;
  const insert = Node.prototype.insertBefore;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    return child.parentNode === this ? (remove.call(this, child) as T) : child;
  };
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    return ref && ref.parentNode !== this ? node : (insert.call(this, node, ref) as T);
  };
}

function loadTranslator() {
  if (document.getElementById("gt-script")) return;
  guardDom();
  const holder = document.createElement("div");
  holder.id = "google_translate_element";
  document.body.appendChild(holder);
  window.googleTranslateElementInit = () => {
    new window.google!.translate.TranslateElement({ pageLanguage: "pt", autoDisplay: false }, "google_translate_element");
  };
  const s = document.createElement("script");
  s.id = "gt-script";
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.body.appendChild(s);
}

export function Translate({ className = "" }: { className?: string }) {
  const [current, setCurrent] = useState<string>("pt");

  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/pt\/(\w+)/);
    if (match && match[1] !== "pt") {
      setCurrent(match[1]);
      loadTranslator(); // o script do Google só é carregado se o visitante pedir tradução
    }
  }, []);

  function choose(lang: string) {
    const host = location.hostname;
    const domains = ["", `;domain=${host}`, `;domain=.${host.split(".").slice(-3).join(".")}`];
    for (const d of domains) {
      document.cookie = lang === "pt"
        ? `googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT${d}`
        : `googtrans=/pt/${lang};path=/${d}`;
    }
    location.reload();
  }

  return (
    <div className={`notranslate flex items-center gap-1 ${className}`} translate="no" role="group" aria-label="Idioma">
      <Languages className="mr-1 size-3.5" aria-hidden />
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={current === l}
          className={`cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase transition ${current === l ? "bg-leaf text-night" : "opacity-70 hover:opacity-100"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
