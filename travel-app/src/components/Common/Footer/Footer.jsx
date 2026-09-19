import React, { useEffect, useState } from "react";
import { Col, Container, Row, Form, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./footer.css";
import { fetchJson, resolveMediaUrl } from "../../../utils/backendApi";
import { isDisplayableName } from "../../../utils/contentValidation";
import { useSiteSettings } from "../../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../../config/defaultSiteSettings";
import { landingPathForDestination, KEYWORD_TOURS } from "../../../utils/destinationLandings";
import g1 from "../../../assets/images/gallery/g1.jpg";

const Footer = () => {
  const { settings } = useSiteSettings();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState("");
  const [footerDestinations, setFooterDestinations] = useState([]);
  const [galleryThumbs, setGalleryThumbs] = useState([]);

  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const logoUrl = resolveMediaUrl(settings.logoUrl || "");
  const navLinks = Array.isArray(settings.navLinks) && settings.navLinks.length
    ? settings.navLinks
    : DEFAULT_SITE_SETTINGS.navLinks;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dests, gallery] = await Promise.all([
          fetchJson("/api/destinations").catch(() => []),
          fetchJson("/api/gallery").catch(() => []),
        ]);
        if (cancelled) return;
        if (Array.isArray(dests) && dests.length) {
          setFooterDestinations(
            dests
              .filter((d) => isDisplayableName(d?.name))
              .slice(0, 5)
              .map((d) => ({ id: d.id, name: d.name, slug: d.slug })),
          );
        }
        if (Array.isArray(gallery) && gallery.length) {
          setGalleryThumbs(
            gallery
              .filter((g) => g.type === "image")
              .slice(0, 6)
              .map((g) => resolveMediaUrl(g.url) || g1),
          );
        }
      } catch {
        /* keep empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setSubscribeMsg("");
    try {
      await fetchJson("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "footer",
        }),
      });
      setEmail("");
      setSubscribeMsg("You're subscribed! Check your inbox for travel updates.");
    } catch {
      setSubscribeMsg("Could not subscribe. Please try again or contact us.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const instaImages = galleryThumbs.length ? galleryThumbs : [g1];

  return (
    <footer className="footer-section">
      <div className="subscribe-bar">
        <Container>
          <Row className="align-items-center">
            <Col md={5} className="mb-3 mb-md-0">
              <h3 className="subscribe-title">
                {settings.subscribeTitle || DEFAULT_SITE_SETTINGS.subscribeTitle}
              </h3>
              <p className="subscribe-text">
                {settings.subscribeText || DEFAULT_SITE_SETTINGS.subscribeText}
              </p>
            </Col>
            <Col md={7}>
              <Form onSubmit={handleSubscribe} className="subscribe-form">
                <Form.Control
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
                <Button type="submit" className="tealBtn" disabled={submitting}>
                  {submitting ? "…" : "Subscribe"}
                </Button>
              </Form>
              {subscribeMsg ? (
                <p className="subscribe-msg mt-2 mb-0 small" role="status">
                  {subscribeMsg}
                </p>
              ) : null}
            </Col>
          </Row>
        </Container>
      </div>

      <div className="footer-main pt-5 pb-4">
        <Container>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <div className="footer-brand">
                <NavLink to="/" className="footer-logo">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={brandName}
                      className="footer-logo-img site-brand-logo-img brand-logo-transparent"
                    />
                  ) : (
                    <span className="brand-icon"><i className="bi bi-compass"></i></span>
                  )}
                  {brandName}
                </NavLink>
                <p className="footer-desc">
                  {settings.companyDescription ||
                    settings.footerDescription ||
                    DEFAULT_SITE_SETTINGS.companyDescription ||
                    DEFAULT_SITE_SETTINGS.footerDescription}
                </p>
                <div className="social-links">
                  {settings.facebook && (
                    <a href={settings.facebook} target="_blank" rel="noopener noreferrer">
                      <i className="bi bi-facebook"></i>
                    </a>
                  )}
                  {settings.twitter && (
                    <a href={settings.twitter} target="_blank" rel="noopener noreferrer">
                      <i className="bi bi-twitter-x"></i>
                    </a>
                  )}
                  {settings.instagram && (
                    <a href={settings.instagram} target="_blank" rel="noopener noreferrer">
                      <i className="bi bi-instagram"></i>
                    </a>
                  )}
                  {settings.youtube && (
                    <a href={settings.youtube} target="_blank" rel="noopener noreferrer">
                      <i className="bi bi-youtube"></i>
                    </a>
                  )}
                </div>
              </div>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h5 className="footer-heading">Destinations</h5>
              <ul className="footer-links">
                {footerDestinations.length ? (
                  footerDestinations.map((d) => (
                    <li key={d.id}>
                      <NavLink to={landingPathForDestination(d)}>{d.name}</NavLink>
                    </li>
                  ))
                ) : (
                  KEYWORD_TOURS.slice(0, 5).map((t) => (
                    <li key={t.path}>
                      <NavLink to={t.path}>{t.label}</NavLink>
                    </li>
                  ))
                )}
              </ul>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h5 className="footer-heading">Explore</h5>
              <ul className="footer-links">
                {navLinks.map((link) => (
                  <li key={`footer-${link.to}`}>
                    <NavLink to={link.to}>{link.label}</NavLink>
                  </li>
                ))}
                <li><NavLink to="/gallery">Gallery</NavLink></li>
                <li><NavLink to="/book">Book Now</NavLink></li>
              </ul>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h5 className="footer-heading">Legal</h5>
              <ul className="footer-links">
                <li><NavLink to="/privacy">Privacy Policy</NavLink></li>
                <li><NavLink to="/terms">Terms & Conditions</NavLink></li>
                <li><NavLink to="/contact">Cancellation Policy</NavLink></li>
                <li><NavLink to="/privacy">Cookie Policy</NavLink></li>
              </ul>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h5 className="footer-heading">Contact</h5>
              <ul className="footer-contact">
                <li>
                  <i className="bi bi-telephone"></i>{" "}
                  {settings.contactPhone || DEFAULT_SITE_SETTINGS.contactPhone}
                </li>
                <li>
                  <i className="bi bi-envelope"></i>{" "}
                  {settings.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail}
                </li>
                <li>
                  <i className="bi bi-geo-alt"></i>{" "}
                  {settings.address || DEFAULT_SITE_SETTINGS.address}
                </li>
              </ul>
            </Col>
          </Row>

          <div className="instagram-feed mt-4">
            <h6 className="insta-heading"><i className="bi bi-instagram"></i> Instagram Feed</h6>
            <div className="insta-grid">
              {instaImages.map((img, i) => (
                <div key={i} className="insta-item">
                  <img src={img} alt={`Rwanda tour ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>

      <div className="footer-bottom">
        <Container>
          <p>© {currentYear} {brandName} Tours. All rights reserved.</p>
        </Container>
      </div>
    </footer>
  );
};

export default Footer;
