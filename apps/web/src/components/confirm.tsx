"use client";

import { motion } from "motion/react";
import { TriangleAlert } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react";

export type ConfirmOptions = { title: string; message: string; action: string };

type Request = ConfirmOptions & { button: HTMLButtonElement };

const ConfirmContext = createContext<((request: Request) => void) | null>(null);

function ConfirmDialog({ request, onClose }: { request: Request; onClose: (confirmed: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    // o foco começa em Cancelar: um Enter sem querer não apaga nada
    cancel.current?.focus();
  }, []);
  return (
    <dialog
      ref={dialog}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onCancel={(e) => { e.preventDefault(); onClose(false); }}
      onClose={() => onClose(false)}
      onClick={(e) => e.target === e.currentTarget && onClose(false)}
      data-lenis-prevent
      className="m-auto w-[min(28rem,calc(100vw-2rem))] overflow-visible bg-transparent p-0 text-ink backdrop:bg-night/70"
    >
      <motion.div className="panel bg-white p-7" initial={{ opacity: 0, scale: 0.8, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 21 }}>
        <motion.span aria-hidden className="grid size-14 place-items-center rounded-sm bg-red-100 text-red-700" initial={{ rotate: -25 }} animate={{ rotate: [-25, 14, -8, 0] }} transition={{ duration: 0.6, delay: 0.1 }}>
          <TriangleAlert className="size-7" />
        </motion.span>
        <h2 id={titleId} className="display mt-5 text-2xl">{request.title}</h2>
        <p id={messageId} className="mt-2 break-words text-ink/70">{request.message}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button ref={cancel} type="button" onClick={() => onClose(false)} className="cursor-pointer rounded-sm border border-ink/20 px-6 py-3 font-extrabold transition hover:bg-paper">Cancelar</button>
          <button type="button" onClick={() => onClose(true)} className="cursor-pointer rounded-sm bg-red-600 px-6 py-3 font-extrabold text-white transition hover:bg-night">{request.action}</button>
        </div>
      </motion.div>
    </dialog>
  );
}

/** Confirmação com o visual do sistema, no lugar da caixa do navegador. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const pending = useRef<Request | null>(null);

  const ask = useCallback((next: Request) => {
    pending.current = next;
    setRequest(next);
  }, []);

  const close = (confirmed: boolean) => {
    const current = pending.current;
    // fechar o diálogo dispara onClose de novo: a segunda chamada não faz nada
    if (!current) return;
    pending.current = null;
    setRequest(null);
    if (confirmed) current.button.form?.requestSubmit(current.button);
    else current.button.focus();
  };

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {request && <ConfirmDialog request={request} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

/** Para o onClick de um botão de formulário: segura o envio e só continua se a pessoa confirmar. */
export function useConfirmSubmit() {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error("useConfirmSubmit precisa estar dentro de ConfirmProvider.");
  return (options: ConfirmOptions) => (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    ask({ ...options, button: event.currentTarget });
  };
}

/** Botão de envio com confirmação, para usar em páginas do servidor. */
export function ConfirmButton({ confirm, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { confirm: ConfirmOptions }) {
  const confirmSubmit = useConfirmSubmit();
  return <button {...props} onClick={confirmSubmit(confirm)} />;
}
