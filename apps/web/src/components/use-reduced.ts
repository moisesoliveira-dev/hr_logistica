"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

/** Como o useReducedMotion do Motion, mas sem divergir do HTML do servidor na hidratação. */
export const useReduced = () => useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
