import React from "react";
import { PAYMENT_METHODS } from "./paymentMethods";
import "./booking-feedback.css";

const PaymentMethodPicker = ({ value, onChange, disabled = false }) => {
  return (
    <div className="payment-picker" role="radiogroup" aria-label="Payment method">
      {PAYMENT_METHODS.map((method) => {
        const selected = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            className={`payment-picker__option${selected ? " is-selected" : ""}`}
            onClick={() => onChange(method.id)}
          >
            <span className="payment-picker__icon" aria-hidden="true">
              <i className={`bi ${method.icon}`} />
            </span>
            <span className="payment-picker__text">
              <span className="payment-picker__label">{method.label}</span>
              <span className="payment-picker__hint">{method.hint}</span>
            </span>
            <span className="payment-picker__check" aria-hidden="true">
              <i className={`bi ${selected ? "bi-check-circle-fill" : "bi-circle"}`} />
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PaymentMethodPicker;
