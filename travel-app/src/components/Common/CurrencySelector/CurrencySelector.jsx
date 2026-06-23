import React from "react";
import { useCurrency } from "../../../context/CurrencyContext";
import "./currency-selector.css";

const CurrencySelector = ({ className = "", compact = false }) => {
  const { currency, setCurrency, currencies } = useCurrency();

  return (
    <label className={`currency-selector ${compact ? "currency-selector--compact" : ""} ${className}`.trim()}>
      <span className="visually-hidden">Display currency</span>
      <i className="bi bi-currency-exchange currency-selector__icon" aria-hidden="true" />
      <select
        className="currency-selector__select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        aria-label="Change display currency"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {compact ? c.code : `${c.code} — ${c.name}`}
          </option>
        ))}
      </select>
    </label>
  );
};

export default CurrencySelector;
