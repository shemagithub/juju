import React from "react";
import { Container } from "react-bootstrap";
import "./page-hero.css";

const PageHero = ({ title, subtitle, breadcrumb }) => {
  return (
    <section className="page-hero">
      <div className="page-hero-overlay"></div>
      <Container className="page-hero-content">
        {breadcrumb && <span className="page-breadcrumb">{breadcrumb}</span>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </Container>
    </section>
  );
};

export default PageHero;
