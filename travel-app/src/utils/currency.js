/** Base currency for stored Rwanda tour prices. */
export const BASE_CURRENCY = "RWF";

export const STORAGE_KEY = "rwandaquest-currency";

/** Approximate RWF per 1 unit of foreign currency (display estimates). */
export const RWF_PER_FOREIGN = {
  USD: 1350,
  EUR: 1450,
  GBP: 1700,
};

export const CURRENCIES = [
  { code: "RWF", symbol: "Frw", name: "Rwandan Franc" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

export function isCurrencyCode(code) {
  return CURRENCIES.some((c) => c.code === code);
}

export function getCurrencyMeta(code = BASE_CURRENCY) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

/** Normalize any supported amount to RWF. */
export function toRwf(amount, fromCurrency = BASE_CURRENCY) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  if (fromCurrency === BASE_CURRENCY) return n;
  const rate = RWF_PER_FOREIGN[fromCurrency];
  if (!rate) return n;
  return n * rate;
}

/** Convert an RWF amount to the target currency. */
export function fromRwf(rwfAmount, toCurrency = BASE_CURRENCY) {
  const n = Number(rwfAmount);
  if (!Number.isFinite(n)) return 0;
  if (toCurrency === BASE_CURRENCY) return n;
  const rate = RWF_PER_FOREIGN[toCurrency];
  if (!rate) return n;
  return n / rate;
}

export function convertMoney(amount, fromCurrency, toCurrency) {
  return fromRwf(toRwf(amount, fromCurrency), toCurrency);
}

export function formatMoney(amount, currency = BASE_CURRENCY, sourceCurrency = BASE_CURRENCY) {
  const rwf = toRwf(amount, sourceCurrency);
  const converted = fromRwf(rwf, currency);
  const meta = getCurrencyMeta(currency);

  if (currency === BASE_CURRENCY) {
    return `${meta.symbol} ${Math.round(converted).toLocaleString("en-US")}`;
  }

  const formatted = converted.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${meta.symbol}${formatted}`;
}

export function formatMoneyParts(amount, currency = BASE_CURRENCY, sourceCurrency = BASE_CURRENCY) {
  const rwf = toRwf(amount, sourceCurrency);
  const converted = fromRwf(rwf, currency);
  const meta = getCurrencyMeta(currency);

  if (currency === BASE_CURRENCY) {
    return {
      symbol: meta.symbol,
      amount: Math.round(converted).toLocaleString("en-US"),
    };
  }

  return {
    symbol: meta.symbol,
    amount: converted.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
  };
}

/** @deprecated Use convertMoney / formatMoney with CurrencyContext instead. */
export function rwfToUsdEstimate(rwf, rate = RWF_PER_FOREIGN.USD) {
  const n = Number(rwf);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.max(0, Math.round(n / rate));
}
