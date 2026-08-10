import React, { useEffect, useState } from "react";
import { Container, Navbar, Offcanvas, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./header.css";
import { useSiteSettings } from "../../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../../config/defaultSiteSettings";
import { resolveMediaUrl } from "../../../utils/backendApi";
import { getNavLinkIcon } from "../../../utils/navIcons";
import CurrencySelector from "../CurrencySelector/CurrencySelector";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const { settings } = useSiteSettings();
  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const logoUrl = resolveMediaUrl(settings.logoUrl || "");
  const showLogo = Boolean(logoUrl) && !logoFailed;
  const navLinks = Array.isArray(settings.navLinks) && settings.navLinks.length
    ? settings.navLinks
    : DEFAULT_SITE_SETTINGS.navLinks;
  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <>
      <header className="header-section is-sticky">
        <Container>
          <Navbar expand="lg" className="header-navbar p-0">
            <Navbar.Brand className="header-brand-col">
              <NavLink to="/" className="brand-link" title={brandName}>
                <span className="brand-lockup">
                  {showLogo ? (
                    <img
                      src={logoUrl}
                      alt={brandName}
                      className="brand-logo-img site-brand-logo-img brand-logo-transparent"
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <span className="brand-icon" aria-hidden="true">
                      <i className="bi bi-globe2"></i>
                    </span>
                  )}
                  <span className="brand-title">{brandName}</span>
                </span>
              </NavLink>
            </Navbar.Brand>

            <Nav className="desktop-nav d-none d-lg-flex">
              {navLinks.map((link) => (
                <NavLink
                  key={`${link.to}-${link.label}`}
                  className="nav-link"
                  to={link.to}
                  end={link.end}
                >
                  {link.label}
                </NavLink>
              ))}
            </Nav>

            <div className="header-actions">
              <CurrencySelector className="d-none d-md-inline-flex" compact />
              <NavLink className="primaryBtn header-cta d-none d-md-inline-block" to="/gallery">
                Gallery
              </NavLink>
              <button
                className="mobile-toggle d-lg-none"
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
              >
                <i className={open ? "bi bi-x-lg" : "bi bi-list"}></i>
              </button>
            </div>

            <Navbar.Offcanvas
              show={open}
              onHide={() => setOpen(false)}
              placement="end"
              className="mobile-offcanvas d-lg-none"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title className="offcanvas-brand-title">
                  <span className="brand-lockup">
                    {showLogo ? (
                      <img
                        src={logoUrl}
                        alt=""
                        className="brand-logo-img brand-logo-img--drawer site-brand-logo-img brand-logo-transparent"
                        onError={() => setLogoFailed(true)}
                      />
                    ) : (
                      <span className="brand-icon brand-icon--drawer" aria-hidden="true">
                        <i className="bi bi-globe2"></i>
                      </span>
                    )}
                    <span className="brand-title">{brandName}</span>
                  </span>
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <CurrencySelector />
                <Nav className="flex-column">
                  <NavLink
                    className="primaryBtn mt-2 text-center"
                    to="/gallery"
                    onClick={() => setOpen(false)}
                  >
                    Gallery
                  </NavLink>
                </Nav>
              </Offcanvas.Body>
            </Navbar.Offcanvas>
          </Navbar>
        </Container>
      </header>

      <nav className="bottom-navbar d-lg-none" aria-label="Primary navigation">
        <div className="bottom-nav-links">
          {navLinks.map((link) => (
            <NavLink
              key={`bottom-${link.to}-${link.label}`}
              className="bottom-nav-link"
              to={link.to}
              end={link.end}
            >
              <i className={`bi ${getNavLinkIcon(link.to)}`} aria-hidden="true" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Header;
