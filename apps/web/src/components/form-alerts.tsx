"use client";

import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { CircleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function describe(field: Field) {
  // quando o rótulo envolve o campo, as opções da lista não fazem parte do nome
  const caption = field.labels?.[0]?.cloneNode(true) as HTMLElement | undefined;
  caption?.querySelectorAll("select, textarea, input").forEach((el) => el.remove());
  const raw = field.dataset.label ?? caption?.textContent ?? field.getAttribute("aria-label") ?? "";
  const label = raw.replace(/\s*\*\s*$/, "").trim();
  const where = label ? ` “${label}”` : "";
  const { validity, type } = field;
  if (validity.valueMissing) {
    if (type === "file") return `Escolha um arquivo em${where || " Anexo"}.`;
    return `Preencha o campo${where}.`;
  }
  if (validity.typeMismatch && type === "email") return `Digite um e-mail válido no campo${where}.`;
  if (validity.typeMismatch && type === "url") return `Cole o link completo no campo${where}.`;
  if (validity.badInput) return `Complete o campo${where}: o valor está incompleto ou inválido.`;
  return `Confira o campo${where}.`;
}

/** Avisos de preenchimento com o visual do sistema, no lugar dos balões do navegador. */
export function FormAlerts() {
  const [alert, setAlert] = useState<{ id: number; text: string } | null>(null);

  useEffect(() => {
    let waiting = false;
    let count = 0;
    const onInvalid = (event: Event) => {
      event.preventDefault(); // impede o balão do navegador
      const field = event.target as Field;
      field.setAttribute("data-invalid", "");
      const clear = () => {
        field.removeAttribute("data-invalid");
        field.removeEventListener("input", clear);
        field.removeEventListener("change", clear);
        setAlert(null);
      };
      field.addEventListener("input", clear);
      field.addEventListener("change", clear);
      // o navegador avisa um campo por vez; mostramos e focamos só o primeiro
      if (waiting) return;
      waiting = true;
      // todos os avisos de um envio chegam na mesma tarefa; um timer só libera depois do último
      setTimeout(() => { waiting = false; });
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: "center", behavior: "smooth" });
      setAlert({ id: ++count, text: describe(field) });
    };
    // o evento "invalid" não sobe pela página, por isso é ouvido na captura
    document.addEventListener("invalid", onInvalid, true);
    return () => document.removeEventListener("invalid", onInvalid, true);
  }, []);

  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(() => setAlert(null), 6000);
    return () => clearTimeout(timer);
  }, [alert]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[130] flex justify-center px-4">
        <AnimatePresence mode="wait">
          {alert && (
            <motion.div
              key={alert.id}
              role="alert"
              data-testid="aviso-formulario"
              className="pointer-events-auto flex max-w-md items-center gap-3 rounded-3xl bg-night py-3 pl-3 pr-2 text-white shadow-2xl shadow-night/40"
              initial={{ opacity: 0, y: -70, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: [0, -10, 8, -4, 0] }}
              exit={{ opacity: 0, y: -40, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 300, damping: 22, x: { type: "tween", duration: 0.4, delay: 0.15 } }}
            >
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-2xl bg-leaf text-night"><CircleAlert className="size-5" /></span>
              <span className="text-sm font-bold">{alert.text}</span>
              <button type="button" onClick={() => setAlert(null)} aria-label="Fechar aviso" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-white/10"><X className="size-4" aria-hidden /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
