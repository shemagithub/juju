import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./car-rental.css";
import { apiUrl } from "../../utils/backendApi";
import { useCurrency } from "../../context/CurrencyContext";
import { normalizeCatalogVehicle } from "./carFleetData";

function SpecIcon({ icon }) {
  const cls = icon && icon.startsWith("bi-") ? icon : "bi-check-circle";
  return <i className={`bi ${cls}`}></i>;
}

const CarRentalDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [vehicle, setVehicle] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    fetch(apiUrl(`/api/car-rental-vehicles/catalog/${encodeURIComponent(slug)}`), {
      signal: ac.signal,
    })
      .then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) return Promise.reject();
        return r.json();
      })
      .then((json) => {
        if (json) {
          const normalized = normalizeCatalogVehicle(json);
          setVehicle(normalized);
          return;
        }
        fetch(apiUrl("/api/car-rental-vehicles/catalog"), { signal: ac.signal })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then((rows) => {
            const hit = Array.isArray(rows)
              ? rows.map(normalizeCatalogVehicle).find((v) => v.slug === slug)
              : null;
            setVehicle(hit || null);
          })
          .catch(() => setVehicle(null));
      })
      .catch(() => setVehicle(null))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [slug]);

  useEffect(() => {
    setActiveImage(0);
  }, [vehicle?.slug]);

  const handleBook = () => {
    navigate(`/car-rental?vehicle=${encodeURIComponent(vehicle.slug)}#rental-booking`);
  };

  if (!loading && !vehicle) {
    return (
      <div className="car-rental-page cr-detail-page">
        <Container className="py-5 text-center">
          <h1>Vehicle not found</h1>
          <p className="text-muted mb-4">This rental vehicle may no longer be available.</p>
          <Link to="/car-rental" className="primaryBtn">
            Back to fleet
          </Link>
        </Container>
      </div>
    );
  }

  const gallery = vehicle?.gallery?.length ? vehicle.gallery : [vehicle?.imageSrc];
  const mainImage = gallery[activeImage] || vehicle?.imageSrc;

  return (
    <div className="car-rental-page cr-detail-page">
      <section className="cr-detail-top">
        <Container>
          <nav className="cr-detail-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/car-rental">Car Rental</Link>
            <span>/</span>
            <span>{vehicle?.fullTitle || "Vehicle"}</span>
          </nav>
          <Link to="/car-rental" className="cr-detail-back">
            <i className="bi bi-arrow-left"></i> Back to fleet
          </Link>
        </Container>
      </section>

      <section className="cr-detail-main">
        <Container>
          <Row className="g-4">
            <Col lg={7}>
              <div className="cr-detail-gallery">
                <div className="cr-detail-main-img">
                  {loading ? (
                    <div className="cr-detail-skeleton" />
                  ) : (
                    <img src={mainImage} alt={vehicle.fullTitle} />
                  )}
                  {vehicle?.badge && (
                    <span className="cr-detail-badge">{vehicle.badge}</span>
                  )}
                </div>
                {gallery.length > 1 && (
                  <div className="cr-detail-thumbs">
                    {gallery.map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        className={`cr-detail-thumb${activeImage === idx ? " active" : ""}`}
                        onClick={() => setActiveImage(idx)}
                        aria-label={`View image ${idx + 1}`}
                      >
                        <img src={src} alt="" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Col>

            <Col lg={5}>
              <div className="cr-detail-sidebar">
                {vehicle?.badge && (
                  <span className="cr-detail-category">{vehicle.badge}</span>
                )}
                <h1 className="cr-detail-title">{vehicle?.fullTitle}</h1>
                <p className="cr-detail-location">
                  <i className="bi bi-geo-alt"></i> {vehicle?.location}
                </p>
                <div className="cr-detail-rating">
                  <i className="bi bi-star-fill"></i>
                  <strong>{vehicle?.rating?.toFixed(2)}</strong>
                  <span>({vehicle?.reviewCount} reviews)</span>
                </div>

                <div className="cr-detail-price-box">
                  <span className="cr-price-label">From</span>
                  <span className="cr-price-value">
                    {formatPrice(vehicle?.priceFrom ?? 0, "USD")}
                  </span>
                  <span className="cr-price-period">/ day</span>
                </div>

                <div className="cr-detail-quick-specs">
                  <div className="cr-spec-item">
                    <i className="bi bi-speedometer2"></i>
                    <span>{vehicle?.mileage}</span>
                  </div>
                  <div className="cr-spec-item">
                    <i className="bi bi-gear-wide-connected"></i>
                    <span>{vehicle?.transmission}</span>
                  </div>
                  <div className="cr-spec-item">
                    <i className="bi bi-fuel-pump"></i>
                    <span>{vehicle?.fuel}</span>
                  </div>
                  <div className="cr-spec-item">
                    <i className="bi bi-people"></i>
                    <span>{vehicle?.seats}</span>
                  </div>
                </div>

                <Button className="primaryBtn cr-detail-book-btn w-100" onClick={handleBook}>
                  Book this vehicle
                </Button>
                <p className="cr-detail-book-note">
                  <i className="bi bi-shield-check"></i> Free quote • No payment until confirmed
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="cr-detail-info">
        <Container>
          <Row>
            <Col lg={8}>
              <div className="cr-detail-block">
                <h2>About this vehicle</h2>
                <p className="cr-detail-lead">{vehicle?.blurb}</p>
                <p>{vehicle?.description}</p>
              </div>

              {vehicle?.specs?.length > 0 && (
                <div className="cr-detail-block">
                  <h2>Specifications</h2>
                  <div className="cr-detail-specs-list">
                    {vehicle.specs.map((spec, idx) => (
                      <div className="cr-detail-spec-row" key={`${spec.text}-${idx}`}>
                        <SpecIcon icon={spec.icon} />
                        <span>{spec.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vehicle?.features?.length > 0 && (
                <div className="cr-detail-block">
                  <h2>Features</h2>
                  <ul className="cr-detail-list">
                    {vehicle.features.map((item) => (
                      <li key={item}>
                        <i className="bi bi-check2-circle"></i> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Col>

            <Col lg={4}>
              {vehicle?.included?.length > 0 && (
                <div className="cr-detail-side-card">
                  <h3>What&apos;s included</h3>
                  <ul className="cr-detail-list compact">
                    {vehicle.included.map((item) => (
                      <li key={item}>
                        <i className="bi bi-check-lg"></i> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {vehicle?.goodToKnow?.length > 0 && (
                <div className="cr-detail-side-card muted">
                  <h3>Good to know</h3>
                  <ul className="cr-detail-list compact">
                    {vehicle.goodToKnow.map((item) => (
                      <li key={item}>
                        <i className="bi bi-info-circle"></i> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="cr-detail-side-card cta">
                <h3>Ready to reserve?</h3>
                <p>Submit a quote request and our fleet desk will confirm availability within one business day.</p>
                <Button className="primaryBtn w-100" onClick={handleBook}>
                  Request a quote
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default CarRentalDetail;
