export interface PreloaderCounter {
  readonly target: number;
  readonly suffix: string;
  readonly desc: string;
}

export const preloaderCounters = [
  { target: 5, suffix: "+", desc: "Years" },
  { target: 20, suffix: "+", desc: "Brands" },
  { target: 360, suffix: "\u00b0", desc: "Digital" },
] as const satisfies readonly PreloaderCounter[];
