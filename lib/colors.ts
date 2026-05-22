// Pastel palettes — color encodes criticality (risk if it breaks).
// Full Tailwind class literals so the JIT scans them.

export interface Palette {
  bg: string;
  border: string;
  hover: string;
  meta: string;
  chip: string;
  label: string;
}

const EMERALD: Palette = {
  bg: "bg-emerald-200",
  border: "border-emerald-300/60",
  hover: "hover:bg-emerald-300",
  meta: "text-emerald-900/60",
  chip: "bg-emerald-900/10 text-emerald-900",
  label: "Isolé",
};
const LIME: Palette = {
  bg: "bg-lime-200",
  border: "border-lime-300/60",
  hover: "hover:bg-lime-300",
  meta: "text-lime-900/60",
  chip: "bg-lime-900/10 text-lime-900",
  label: "Bas risque",
};
const AMBER: Palette = {
  bg: "bg-amber-200",
  border: "border-amber-300/60",
  hover: "hover:bg-amber-300",
  meta: "text-amber-900/60",
  chip: "bg-amber-900/10 text-amber-900",
  label: "Modéré",
};
const ORANGE: Palette = {
  bg: "bg-orange-200",
  border: "border-orange-300/60",
  hover: "hover:bg-orange-300",
  meta: "text-orange-900/60",
  chip: "bg-orange-900/10 text-orange-900",
  label: "Sensible",
};
const ROSE: Palette = {
  bg: "bg-rose-200",
  border: "border-rose-300/60",
  hover: "hover:bg-rose-300",
  meta: "text-rose-900/60",
  chip: "bg-rose-900/10 text-rose-900",
  label: "Critique",
};
const STONE: Palette = {
  bg: "bg-stone-200",
  border: "border-stone-300/60",
  hover: "hover:bg-stone-300",
  meta: "text-stone-700/60",
  chip: "bg-stone-900/10 text-stone-900",
  label: "—",
};

// criticality 1 = isolated, 5 = touches prod / payments / auth / security
const BY_CRITICALITY: Record<number, Palette> = {
  1: EMERALD,
  2: LIME,
  3: AMBER,
  4: ORANGE,
  5: ROSE,
};

export function paletteForCriticality(score: number | null | undefined): Palette {
  if (score === null || score === undefined) return STONE;
  return BY_CRITICALITY[score] ?? STONE;
}

// Status accents (dot color + label background)
export const STATUS_ACCENT: Record<string, { dot: string; label: string }> = {
  pending: { dot: "bg-amber-500", label: "À traiter" },
  in_progress: { dot: "bg-blue-500", label: "En cours" },
  completed: { dot: "bg-emerald-500", label: "Traitée" },
  rejected: { dot: "bg-zinc-400", label: "Refusée" },
  info_provided: { dot: "bg-violet-500", label: "Info fournie" },
};
