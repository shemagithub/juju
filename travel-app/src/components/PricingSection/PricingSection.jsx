import React, { useMemo } from "react";
import { Container } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { resolveMediaUrl } from "../../utils/backendApi";
import { useCurrency } from "../../context/CurrencyContext";
import "../../pages/Home/home.css";

const DEFAULT_SECTION = {
  eyebrow: "Packages",
  title: "Prices For Rwanda Adventures",
  backgroundUrl: "",
  currency: "$",
  priceUnit: "/person",
  ctaLabel: "Book Now",
  ctaLink: "/book",
};

const DEFAULT_PLANS = [
  {
    id: "basic",
    name: "Basic Travel",
    priceUsd: 499,
    features: ["3 Days Tour", "5 Nights Stay", "Breakfast Included", "Tour Guide", "Transport"],
    popular: false,
  },
  {
    id: "standard",
    name: "Standard Travel",
    priceUsd: 899,
    features: [
      "5 Days Tour",
      "7 Nights Stay",
      "All Meals",
      "Expert Guide",
      "Permits Included",
      "Airport Transfer",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium Travel",
    priceUsd: 1499,
    features: [
      "7 Days Tour",
      "10 Nights Stay",
      "Luxury Lodges",
      "Private Guide",
      "All Permits",
      "VIP Transfer",
    ],
    popular: false,
  },
];

function PricingCard({ plan, cfg }) {
  const { formatPriceParts } = useCurrency();
  const priceParts = formatPriceParts(plan.priceUsd ?? plan.price ?? 0, "USD");

  return (
    <div className={`pricing-card ${plan.popular ? "popular" : ""}`}>
      {plan.popular ? <span className="popular-badge">Most Popular</span> : null}
      <h3>{plan.name}</h3>
      <div className="price-tag">
        <span className="currency">{priceParts.symbol}</span>
        <span className="amount">{priceParts.amount}</span>
        <span className="period">{cfg.priceUnit}</span>
      </div>
      <ul className="plan-features">
        {(plan.features || []).map((f) => (
          <li key={f}>
            <i className="bi bi-check-circle-fill" /> {f}
          </li>
        ))}
      </ul>
      <NavLink
        to={cfg.ctaLink || "/book"}
        className={plan.popular ? "primaryBtn w-100 text-center" : "tealBtn w-100 text-center"}
      >
        {cfg.ctaLabel}
      </NavLink>
    </div>
  );
}

function PricingSection({ section, plans, fallbackBackground }) {
  const cfg = { ...DEFAULT_SECTION, ...(section || {}) };
  const rows = Array.isArray(plans) && plans.length ? plans : DEFAULT_PLANS;
  const bg = resolveMediaUrl(cfg.backgroundUrl) || fallbackBackground || "";
  const marqueeDuration = useMemo(
    () => `${Math.max(28, rows.length * 12)}s`,
    [rows.length],
  );
  const marqueeRows = useMemo(() => [...rows, ...rows], [rows]);

  return (
    <section
      className="pricing-section section-padding"
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      <div className="pricing-overlay" />
      <Container className="position-relative">
        <div className="text-center mb-5">
          <span className="section-label light">{cfg.eyebrow}</span>
          <h2 className="section-title light">{cfg.title}</h2>
        </div>
        <div className="pricing-marquee-viewport" aria-label="Pricing plans carousel">
          <div
            className="pricing-marquee-track"
            style={{ "--pricing-marquee-duration": marqueeDuration }}
          >
            {marqueeRows.map((plan, idx) => (
              <div
                className="pricing-marquee-slide"
                key={`${plan.id || plan.name}-${idx}`}
                aria-hidden={idx >= rows.length}
              >
                <PricingCard plan={plan} cfg={cfg} />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default PricingSection;
