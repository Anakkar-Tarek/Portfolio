import { flagUrl } from "./phoneCodes";

export interface CurrencyOption {
  readonly code: string;
  readonly symbol: string;
  readonly label: string;
  readonly name: string;
  readonly flagIso: string;
  readonly flagSrc: string;
}

export const currencies = [
  { code: "USD", symbol: "$", label: "USD", name: "United States dollar", flagIso: "us", flagSrc: flagUrl("us") },
  { code: "EUR", symbol: "\u20ac", label: "EUR", name: "Euro", flagIso: "eu", flagSrc: flagUrl("eu") },
  { code: "MAD", symbol: "DH", label: "MAD", name: "Moroccan dirham", flagIso: "ma", flagSrc: flagUrl("ma") },
] as const satisfies readonly CurrencyOption[];
