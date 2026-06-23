import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  BASE_CURRENCY,
  CURRENCIES,
  STORAGE_KEY,
  convertMoney,
  formatMoney,
  formatMoneyParts,
  fromRwf,
  isCurrencyCode,
  toRwf,
} from "../utils/currency";

const CurrencyContext = createContext({
  currency: BASE_CURRENCY,
  setCurrency: () => {},
  formatPrice: (amount, sourceCurrency = BASE_CURRENCY) =>
    formatMoney(amount, BASE_CURRENCY, sourceCurrency),
  formatPriceParts: (amount, sourceCurrency = BASE_CURRENCY) =>
    formatMoneyParts(amount, BASE_CURRENCY, sourceCurrency),
  convertToDisplay: (amount, sourceCurrency = BASE_CURRENCY) =>
    fromRwf(toRwf(amount, sourceCurrency), BASE_CURRENCY),
  currencies: CURRENCIES,
});

function readStoredCurrency() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isCurrencyCode(saved)) return saved;
  } catch {
    /* ignore */
  }
  return BASE_CURRENCY;
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(readStoredCurrency);

  const setCurrency = useCallback((code) => {
    if (!isCurrencyCode(code)) return;
    setCurrencyState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const formatPrice = useCallback(
    (amount, sourceCurrency = BASE_CURRENCY) =>
      formatMoney(amount, currency, sourceCurrency),
    [currency],
  );

  const formatPriceParts = useCallback(
    (amount, sourceCurrency = BASE_CURRENCY) =>
      formatMoneyParts(amount, currency, sourceCurrency),
    [currency],
  );

  const convertToDisplay = useCallback(
    (amount, sourceCurrency = BASE_CURRENCY) =>
      convertMoney(amount, sourceCurrency, currency),
    [currency],
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      formatPrice,
      formatPriceParts,
      convertToDisplay,
      currencies: CURRENCIES,
    }),
    [currency, setCurrency, formatPrice, formatPriceParts, convertToDisplay],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
