import React, { useMemo } from "react";
import { Container, Spinner } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import PageHero from "../../components/Common/PageHero/PageHero";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { parseLegalContent } from "../../utils/renderLegalBlocks";
import "./legal.css";

const PAGE_CONFIG = {
  privacy: {
    titleKey: "privacyPolicyTitle",
    subtitleKey: "privacyPolicySubtitle",
    updatedKey: "privacyPolicyUpdated",
    contentKey: "privacyPolicyContent",
    breadcrumb: "Home / Legal / Privacy",
    path: "/privacy",
    sibling: { to: "/terms", label: "Terms & Conditions" },
  },
  terms: {
    titleKey: "termsConditionsTitle",
    subtitleKey: "termsConditionsSubtitle",
    updatedKey: "termsConditionsUpdated",
    contentKey: "termsConditionsContent",
    breadcrumb: "Home / Legal / Terms",
    path: "/terms",
    sibling: { to: "/privacy", label: "Privacy Policy" },
  },
};

const LegalPage = ({ kind }) => {
  const { settings, loading } = useSiteSettings();
  const cfg = PAGE_CONFIG[kind];

  const title = settings[cfg.titleKey] || DEFAULT_SITE_SETTINGS[cfg.titleKey];
  const subtitle = settings[cfg.subtitleKey] || DEFAULT_SITE_SETTINGS[cfg.subtitleKey];
  const updated = settings[cfg.updatedKey] || DEFAULT_SITE_SETTINGS[cfg.updatedKey];
  const content = settings[cfg.contentKey] || DEFAULT_SITE_SETTINGS[cfg.contentKey];

  const blocks = useMemo(() => parseLegalContent(content), [content]);

  return (
    <div className="legal-page">
      <PageHero title={title} subtitle={subtitle} breadcrumb={cfg.breadcrumb} />

      <section className="legal-body py-5">
        <Container>
          <div className="legal-layout">
            <aside className="legal-sidebar">
              <div className="legal-sidebar-card">
                <h6>Legal</h6>
                <ul>
                  <li>
                    <NavLink
                      to="/privacy"
                      className={({ isActive }) => (isActive ? "active" : undefined)}
                    >
                      Privacy Policy
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/terms"
                      className={({ isActive }) => (isActive ? "active" : undefined)}
                    >
                      Terms & Conditions
                    </NavLink>
                  </li>
                </ul>
                {updated ? (
                  <p className="legal-updated">
                    <i className="bi bi-clock-history" /> Last updated: {updated}
                  </p>
                ) : null}
                <NavLink to="/contact" className="legal-contact-link">
                  Questions? Contact us
                </NavLink>
              </div>
            </aside>

            <article className="legal-article">
              {loading ? (
                <div className="legal-loading text-center py-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <div className="legal-content">
                  {blocks.map((block, idx) =>
                    block.type === "heading" ? (
                      <h2 key={`h-${idx}`}>{block.text}</h2>
                    ) : (
                      <p key={`p-${idx}`}>{block.text}</p>
                    )
                  )}
                </div>
              )}
            </article>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default LegalPage;
