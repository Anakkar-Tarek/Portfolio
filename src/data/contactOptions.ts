export interface CurrencyOption {
  readonly code: string;
  readonly symbol: string;
}

export const currencies = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "\u20ac" },
  { code: "MAD", symbol: "DH" },
] as const satisfies readonly CurrencyOption[];
