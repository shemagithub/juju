import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import PricingSection from "../../components/PricingSection/PricingSection";
import { fetchJson } from "../../utils/backendApi";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import heroBg from "../../assets/images/slider/1.jpg";
import "./pricing.css";

const Pricing = () => {
  const { settings } = useSiteSettings();
  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const [pricing, setPricing] = useState({ section: null, plans: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchJson("/api/pricing?public=true");
        if (!cancelled && data) setPricing(data);
      } catch {
        /* fallback cards render inside PricingSection */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="pricing-page">
      <section className="pricing-page-hero">
        <Container>
          <p className="pricing-page-eyebrow">Adventure packages</p>
          <h1>Prices For Rwanda Adventures</h1>
          <p className="pricing-page-lead">
            Choose the {brandName} package that fits your Rwanda adventure — gorilla trekking,
            safaris, and curated experiences with local experts.
          </p>
        </Container>
      </section>

      {loading ? (
        <Container className="py-5 text-center text-muted">Loading packages…</Container>
      ) : (
        <PricingSection
          section={pricing.section}
          plans={pricing.plans}
          fallbackBackground={heroBg}
        />
      )}
    </main>
  );
};

export default Pricing;
