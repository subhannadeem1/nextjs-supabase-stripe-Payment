export type MoneyMap = Record<string, number>;

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, currency = "EUR", opts?: { compact?: boolean }) {
  const key = `${currency}-${opts?.compact ? "c" : "f"}`;
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: opts?.compact ? 1 : 2,
        minimumFractionDigits: 0,
        notation: opts?.compact ? "compact" : "standard",
      });
    } catch {
      f = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
    }
    formatters.set(key, f);
  }
  return f.format(Number.isFinite(amount) ? amount : 0);
}

export function addMoney(map: MoneyMap, currency: string, amount: number) {
  if (!amount) return map;
  map[currency] = round2((map[currency] ?? 0) + amount);
  return map;
}

export function sumByCurrency<T>(items: T[], currencyOf: (t: T) => string, amountOf: (t: T) => number) {
  const map: MoneyMap = {};
  for (const item of items) addMoney(map, currencyOf(item), amountOf(item));
  return map;
}

export function mergeMoney(...maps: MoneyMap[]) {
  const out: MoneyMap = {};
  for (const m of maps) for (const [c, v] of Object.entries(m)) addMoney(out, c, v);
  return out;
}

/** Currencies ordered with the default first, then by size. */
export function orderedCurrencies(map: MoneyMap, defaultCurrency: string) {
  return Object.keys(map)
    .filter((c) => Math.abs(map[c]) > 0.004)
    .sort((a, b) => {
      if (a === defaultCurrency) return -1;
      if (b === defaultCurrency) return 1;
      return Math.abs(map[b]) - Math.abs(map[a]);
    });
}

export function formatMoneyMap(map: MoneyMap, defaultCurrency: string, opts?: { compact?: boolean }) {
  const keys = orderedCurrencies(map, defaultCurrency);
  if (keys.length === 0) return formatMoney(0, defaultCurrency, opts);
  return keys.map((c) => formatMoney(map[c], c, opts)).join(" · ");
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
