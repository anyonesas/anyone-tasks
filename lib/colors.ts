// Pastel palettes for project cards.
// We use full Tailwind class literals so the JIT scans them.
// All combinations stay dark-text-on-light-bg for AA contrast.

export interface Palette {
  bg: string;
  border: string;
  hover: string;
  meta: string;
  chip: string;
}

const PALETTES: Palette[] = [
  {
    bg: "bg-amber-200",
    border: "border-amber-300/60",
    hover: "hover:bg-amber-300",
    meta: "text-amber-900/60",
    chip: "bg-amber-900/10 text-amber-900",
  },
  {
    bg: "bg-orange-200",
    border: "border-orange-300/60",
    hover: "hover:bg-orange-300",
    meta: "text-orange-900/60",
    chip: "bg-orange-900/10 text-orange-900",
  },
  {
    bg: "bg-lime-200",
    border: "border-lime-300/60",
    hover: "hover:bg-lime-300",
    meta: "text-lime-900/60",
    chip: "bg-lime-900/10 text-lime-900",
  },
  {
    bg: "bg-emerald-200",
    border: "border-emerald-300/60",
    hover: "hover:bg-emerald-300",
    meta: "text-emerald-900/60",
    chip: "bg-emerald-900/10 text-emerald-900",
  },
  {
    bg: "bg-sky-200",
    border: "border-sky-300/60",
    hover: "hover:bg-sky-300",
    meta: "text-sky-900/60",
    chip: "bg-sky-900/10 text-sky-900",
  },
  {
    bg: "bg-violet-200",
    border: "border-violet-300/60",
    hover: "hover:bg-violet-300",
    meta: "text-violet-900/60",
    chip: "bg-violet-900/10 text-violet-900",
  },
  {
    bg: "bg-rose-200",
    border: "border-rose-300/60",
    hover: "hover:bg-rose-300",
    meta: "text-rose-900/60",
    chip: "bg-rose-900/10 text-rose-900",
  },
  {
    bg: "bg-fuchsia-200",
    border: "border-fuchsia-300/60",
    hover: "hover:bg-fuchsia-300",
    meta: "text-fuchsia-900/60",
    chip: "bg-fuchsia-900/10 text-fuchsia-900",
  },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function paletteFor(project: string): Palette {
  return PALETTES[hash(project) % PALETTES.length];
}

// Status accents (dot color + label background)
export const STATUS_ACCENT: Record<string, { dot: string; label: string }> = {
  pending: { dot: "bg-amber-500", label: "À traiter" },
  in_progress: { dot: "bg-blue-500", label: "En cours" },
  completed: { dot: "bg-emerald-500", label: "Traitée" },
  rejected: { dot: "bg-zinc-400", label: "Refusée" },
  info_provided: { dot: "bg-violet-500", label: "Info fournie" },
};
