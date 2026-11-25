"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { useReduced } from "./use-reduced";

/* Esquema posicionado pelas coordenadas aproximadas de cada cidade (não é um mapa em escala). */
const project = (lon: number, lat: number) => ({ x: (lon + 68) * 28, y: (5 - lat) * 18 + 20 });

const nodes = [
  { name: "Manaus", role: "Matriz", lon: -60, lat: -3.1, dx: -14, dy: 34, anchor: "end" },
  { name: "Boa Vista", role: "Distribuição e apoio", lon: -60.7, lat: 2.8, dx: 18, dy: 5, anchor: "start" },
  { name: "Porto Velho", role: "Ponto de apoio", lon: -63.9, lat: -8.76, dx: 0, dy: 32, anchor: "middle" },
  { name: "Belém", role: "Unidade de distribuição", lon: -48.5, lat: -1.45, dx: 0, dy: -20, anchor: "middle" },
  { name: "Codó", role: "Unidade de distribuição", lon: -43.9, lat: -4.45, dx: 8, dy: 32, anchor: "middle" },
  { name: "Fortaleza", role: "Ponto de apoio", lon: -38.5, lat: -3.7, dx: 0, dy: -20, anchor: "middle" },
  { name: "Goiânia", role: "Unidade de distribuição", lon: -49.25, lat: -16.7, dx: -18, dy: 5, anchor: "end" },
  { name: "Guarulhos", role: "Unidade de distribuição", lon: -46.5, lat: -23.45, dx: 18, dy: 5, anchor: "start" },
] as const;

const hub = project(nodes[0].lon, nodes[0].lat);

export function NetworkMap() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReduced();
  const onScreen = useInView(ref);
  const [active, setActive] = useState(0);

  return (
    <div>
      <svg ref={ref} viewBox="0 0 880 580" className="w-full" role="img" aria-label="Rede de unidades da HR da Amazônia partindo de Manaus">
        {nodes.slice(1).map((n, i) => {
          const p = project(n.lon, n.lat);
          const bend = Math.min(110, Math.hypot(p.x - hub.x, p.y - hub.y) * 0.25);
          const d = `M${hub.x} ${hub.y} Q${(hub.x + p.x) / 2} ${(hub.y + p.y) / 2 - bend} ${p.x} ${p.y}`;
          return (
            <g key={n.name}>
              <motion.path d={d} fill="none" stroke="var(--color-leaf)" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={inView ? { pathLength: 1, opacity: active === i + 1 ? 1 : 0.45, strokeWidth: active === i + 1 ? 4 : 2 } : undefined}
                transition={{ pathLength: { duration: 1.4, delay: 0.25 + i * 0.17 }, default: { duration: 0.3 } }}
              />
              {onScreen && inView && !reduce && (
                <circle r="4.5" fill="#fff" opacity="0">
                  <animateMotion dur={`${2.6 + (i % 3) * 0.7}s`} begin={`${1.6 + i * 0.3}s`} repeatCount="indefinite" path={d} />
                  <set attributeName="opacity" to="1" begin={`${1.6 + i * 0.3}s`} />
                </circle>
              )}
            </g>
          );
        })}
        {nodes.map((n, i) => {
          const p = project(n.lon, n.lat);
          const main = i === 0;
          return (
            <motion.g key={n.name} className="cursor-pointer" onPointerEnter={() => setActive(i)} onClick={() => setActive(i)}
              initial={{ scale: 0, opacity: 0 }} animate={inView ? { scale: 1, opacity: 1 } : undefined}
              transition={{ type: "spring", stiffness: 260, damping: 13, delay: i ? 1 + i * 0.15 : 0 }}
              style={{ transformOrigin: `${p.x}px ${p.y}px`, transformBox: "view-box" }}
            >
              {onScreen && (main || active === i) && !reduce && (
                <motion.circle cx={p.x} cy={p.y} fill="none" stroke="var(--color-leaf)" strokeWidth="2" initial={{ r: 8, opacity: 1 }} animate={{ r: [8, 34], opacity: [1, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
              )}
              <circle cx={p.x} cy={p.y} r="22" fill="transparent" />
              <circle cx={p.x} cy={p.y} r={main ? 13 : 8} fill={active === i || main ? "var(--color-leaf)" : "var(--color-brand)"} stroke="#fff" strokeWidth="3" />
              <text x={p.x + n.dx} y={p.y + n.dy} textAnchor={n.anchor} fill="#fff" fontSize={main ? 24 : 18} fontWeight="800">{n.name}</text>
            </motion.g>
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {nodes.map((n, i) => (
          <button key={n.name} type="button" onClick={() => setActive(i)} onFocus={() => setActive(i)} onMouseEnter={() => setActive(i)} aria-pressed={active === i}
            className="relative cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white">
            {active === i && <motion.span layoutId="map-pill" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
            <span className="relative">{n.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-white/70" aria-live="polite"><strong className="text-leaf">{nodes[active].name}</strong> — {nodes[active].role}</p>
    </div>
  );
}
