import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import PAGE_SEO from "../../config/pageSeo.json";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { companyWhatsAppHref } from "../../utils/contentValidation";
import { KEYWORD_TOURS } from "../../utils/destinationLandings";
import "./tour-landing.css";

export default function TourLanding({ path }) {
  const page = PAGE_SEO.pages[path] || {};
  const { settings } = useSiteSettings();
  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const whatsapp = companyWhatsAppHref(settings, DEFAULT_SITE_SETTINGS);
  const heading = page.heading || page.title || brandName;
  const paragraphs = page.paragraphs || [];
  const highlights = page.highlights || [];
  const related = KEYWORD_TOURS.filter((t) => t.path !== path);

  return (
    <div className="tour-landing">
      <section className="tour-landing-hero">
        <div className="tour-landing-hero__overlay" />
        <Container>
          <span className="tour-landing-kicker">{page.kicker || "Rwanda tours"}</span>
          <h1>{heading}</h1>
          <p>{page.description}</p>
          <div className="tour-landing-hero__actions">
            <Button as={NavLink} to="/book" className="primaryBtn">
              Book this trip
            </Button>
            <Button as={NavLink} to="/packages" className="outlineBtn">
              View packages
            </Button>
          </div>
        </Container>
      </section>

      <section className="tour-landing-body py-5">
        <Container>
          <Row className="g-5 align-items-start">
            <Col lg={7}>
              {page.image ? (
                <img
                  src={page.image}
                  alt={page.imageAlt || heading}
                  className="tour-landing-photo"
                />
              ) : null}
              {paragraphs.map((text) => (
                <p key={text.slice(0, 24)}>{text}</p>
              ))}
              <div className="tour-landing-cta">
                <NavLink to="/contact" className="tealBtn">
                  Ask a question
                </NavLink>
                {whatsapp ? (
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="outlineBtn tour-landing-wa">
                    <i className="bi bi-whatsapp" /> WhatsApp
                  </a>
                ) : null}
              </div>
            </Col>
            <Col lg={5}>
              {highlights.length ? (
                <div className="tour-landing-card">
                  <h2>What is included</h2>
                  <ul>
                    {highlights.map((item) => (
                      <li key={item}>
                        <i className="bi bi-check-circle-fill" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="tour-landing-card">
                <h2>More Rwanda trips</h2>
                <ul className="tour-landing-links">
                  {related.map((item) => (
                    <li key={item.path}>
                      <NavLink to={item.path}>{item.label}</NavLink>
                    </li>
                  ))}
                  <li>
                    <NavLink to="/car-rental">Car rental</NavLink>
                  </li>
                  <li>
                    <NavLink to="/blog">Travel blog</NavLink>
                  </li>
                </ul>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
