export const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit / Debit Card",
    hint: "Visa, Mastercard",
    icon: "bi-credit-card",
  },
  {
    id: "mobile-money",
    label: "Mobile Money",
    hint: "MTN / Airtel",
    icon: "bi-phone",
  },
  {
    id: "bank-transfer",
    label: "Bank Transfer",
    hint: "Local & international",
    icon: "bi-bank",
  },
  {
    id: "pay-later",
    label: "Pay Later",
    hint: "Request invoice by email",
    icon: "bi-clock",
  },
];

export function paymentMethodLabel(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label || id;
}
