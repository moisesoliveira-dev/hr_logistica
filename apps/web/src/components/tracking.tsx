"use client";

import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, ExternalLink, LoaderCircle, MapPin, PackageCheck, Search, TriangleAlert, Truck } from "lucide-react";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { cargoModes, cargoRoute, cargoStages, formatDay, type PublicCargo } from "@hr/shared";
import { trackCargo, type TrackingState } from "@/lib/tracking-action";

const empty: TrackingState = {};
const when = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Manaus", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Barra com o caminhão parado na etapa atual. */
function Progress({ cargo }: { cargo: PublicCargo }) {
  // numa ocorrência, o caminhão fica na última etapa normal que a carga alcançou
  const stage = cargo.stage === "ocorrencia" ? cargo.events.find((e) => e.stage !== "ocorrencia")?.stage ?? "aguardando_coleta" : cargo.stage;
  const step = Math.max(0, cargoRoute.indexOf(stage));
  const percent = (step / (cargoRoute.length - 1)) * 100;
  return (
    <div aria-hidden className="mt-8">
      <div className="relative h-12">
        <motion.span className="absolute bottom-1 grid size-10 place-items-center rounded-full bg-leaf text-night" initial={{ left: "0%", x: "0%" }} animate={{ left: `${percent}%`, x: `-${percent}%` }} transition={{ duration: 1.4, delay: 0.3, ease: [0.45, 0, 0.2, 1] }}>
          {step === cargoRoute.length - 1 ? <PackageCheck className="size-5" /> : <Truck className="size-5" />}
        </motion.span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/15">
        <motion.div className="h-full origin-left bg-leaf" initial={{ scaleX: 0 }} animate={{ scaleX: percent / 100 }} transition={{ duration: 1.4, delay: 0.3, ease: [0.45, 0, 0.2, 1] }} />
      </div>
      <div className="mt-2 flex justify-between text-xs font-bold uppercase tracking-wider text-white/60">
        <span>Coleta</span><span>Entrega</span>
      </div>
    </div>
  );
}

function Result({ cargo }: { cargo: PublicCargo }) {
  const problem = cargo.stage === "ocorrencia";
  const details = [
    ["Origem", cargo.origin], ["Destino", cargo.destination], ["Transporte", cargoModes[cargo.mode]],
    ...(cargo.invoice ? [["Nota fiscal", cargo.invoice]] : []),
    ...(cargo.expectedAt && cargo.stage !== "entregue" ? [["Previsão de entrega", formatDay(cargo.expectedAt)]] : []),
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 120, damping: 18 }} className="space-y-6">
      <section className="rounded-[2rem] bg-night p-6 text-white sm:p-9" aria-label="Situação da carga">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">Carga {cargo.code}</p>
        <h2 className={`display mt-3 flex flex-wrap items-center gap-3 text-3xl sm:text-5xl ${problem ? "text-amber-300" : "text-leaf"}`}>
          {problem && <TriangleAlert className="size-9" aria-hidden />}{cargoStages[cargo.stage]}
        </h2>
        <Progress cargo={cargo} />
        <dl className="mt-8 grid gap-5 border-t border-white/15 pt-6 sm:grid-cols-3">
          {details.map(([term, value]) => (
            <div key={term}><dt className="text-xs font-bold uppercase tracking-wider text-white/50">{term}</dt><dd className="mt-1 break-words text-lg font-bold">{value}</dd></div>
          ))}
        </dl>
      </section>

      <section className="rounded-[2rem] bg-white p-6 shadow-xl shadow-night/5 sm:p-9">
        <h3 className="display text-2xl">Histórico</h3>
        <ol className="mt-6">
          {cargo.events.map((event, i) => (
            <motion.li key={event.id} className="relative flex gap-4 pb-7 last:pb-0" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.09 }}>
              {i < cargo.events.length - 1 && <span aria-hidden className="absolute bottom-0 left-[9px] top-6 w-0.5 bg-ink/10" />}
              <span aria-hidden className={`mt-1 size-5 shrink-0 rounded-full border-4 ${event.stage === "ocorrencia" ? "border-amber-400 bg-amber-100" : i === 0 ? "border-brand bg-leaf" : "border-ink/20 bg-white"}`} />
              <div className="min-w-0">
                <p className="font-bold">{cargoStages[event.stage]}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink/60">
                  <time dateTime={event.at}>{when(event.at)}</time>
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden />{event.location}</span>
                </p>
                {event.note && <p className="mt-2 whitespace-pre-line break-words rounded-2xl bg-paper px-4 py-2.5 text-sm">{event.note}</p>}
              </div>
            </motion.li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-ink/50">Datas no horário de Manaus.</p>
      </section>
    </motion.div>
  );
}

export function Tracking({ initialCode, legacyUrl }: { initialCode: string; legacyUrl: string }) {
  const [state, action, pending] = useActionState(trackCargo, empty);
  const [code, setCode] = useState(initialCode);
  const [document, setDocument] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} action={action} className="rounded-[2rem] bg-white p-5 shadow-2xl shadow-night/10 sm:p-7">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div className="relative">
            <input id="code" name="code" required maxLength={30} autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="HR-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="field peer" />
            <label htmlFor="code" className="field-label">Código da carga</label>
          </div>
          <div className="relative">
            <input id="document" name="document" required maxLength={30} autoComplete="off" value={document} onChange={(e) => setDocument(e.target.value)} className="field peer" />
            <label htmlFor="document" className="field-label">CNPJ ou CPF do cliente</label>
          </div>
          <motion.button type="submit" disabled={pending} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-8 py-4 font-extrabold text-white transition hover:bg-night disabled:cursor-wait disabled:opacity-70">
            {pending ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Search className="size-5" aria-hidden />}
            {pending ? "Buscando..." : "Rastrear"}
          </motion.button>
        </div>
        <p className="mt-3 pl-1 text-sm text-ink/55">O código é informado pela nossa equipe quando a carga é cadastrada.</p>
      </form>

      <div aria-live="polite">
        <AnimatePresence mode="wait">
          {state.error && !pending && (
            <motion.p key={`erro-${state.stamp}`} role="alert" className="flex items-start gap-3 rounded-3xl bg-red-50 p-5 font-bold text-red-700" initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -14, 12, -8, 5, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              <CircleAlert className="size-6 shrink-0" aria-hidden />{state.error}
            </motion.p>
          )}
        </AnimatePresence>
        {state.cargo && <Result key={state.stamp} cargo={state.cargo} />}
      </div>

      <p className="text-center text-sm text-ink/60">
        Sua carga está no sistema anterior?{" "}
        <a href={legacyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-brand-deep underline underline-offset-4 hover:text-night">
          Acessar o rastreamento antigo <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </p>
    </div>
  );
}
