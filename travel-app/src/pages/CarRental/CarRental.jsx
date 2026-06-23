import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Form, Button, Accordion } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import "./car-rental.css";
import { apiUrl } from "../../utils/backendApi";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { companyWhatsAppHref } from "../../utils/contentValidation";
import { useCurrency } from "../../context/CurrencyContext";
import BookingFeedbackModal from "../../components/BookingFeedback/BookingFeedbackModal";
import {
  buildCategoryPillsFromFleet,
  normalizeCatalogToFleet,
  normalizeVehicleCategory,
} from "./carFleetData";

const CARDS_PER_PAGE = 6;

function toLocalYmd(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function VehicleCard({ vehicle, onBook }) {
  const { formatPrice } = useCurrency();

  return (
    <div className="cr-vehicle-card">
      <Link to={`/car-rental/${vehicle.slug}`} className="cr-vehicle-img-link">
        <div className="cr-vehicle-img-wrap">
          <img src={vehicle.imageSrc} alt={vehicle.fullTitle} loading="lazy" />
          <div className="cr-rating-badge">
            <i className="bi bi-star-fill"></i>
            <span>{vehicle.rating.toFixed(2)}</span>
            <span className="cr-review-count">({vehicle.reviewCount} reviews)</span>
          </div>
        </div>
      </Link>
      <div className="cr-vehicle-body">
        <div className="cr-vehicle-name-row">
          <h3 className="cr-vehicle-name">
            <Link to={`/car-rental/${vehicle.slug}`}>{vehicle.fullTitle}</Link>
          </h3>
          {vehicle.categoryLabel && (
            <span className="cr-vehicle-category">{vehicle.categoryLabel}</span>
          )}
        </div>
        <p className="cr-vehicle-location">
          <i className="bi bi-geo-alt"></i> {vehicle.location}
        </p>
        {vehicle.blurb && <p className="cr-vehicle-blurb">{vehicle.blurb}</p>}
        <hr className="cr-vehicle-divider" />
        <div className="cr-specs-grid">
          <div className="cr-spec-item">
            <i className="bi bi-speedometer2"></i>
            <span>{vehicle.mileage}</span>
          </div>
          <div className="cr-spec-item">
            <i className="bi bi-gear-wide-connected"></i>
            <span>{vehicle.transmission}</span>
          </div>
          <div className="cr-spec-item">
            <i className="bi bi-fuel-pump"></i>
            <span>{vehicle.fuel}</span>
          </div>
          <div className="cr-spec-item">
            <i className="bi bi-people"></i>
            <span>{vehicle.seats}</span>
          </div>
        </div>
        <div className="cr-vehicle-footer">
          <div className="cr-price">
            <span className="cr-price-label">From</span>
            <span className="cr-price-value">
              {formatPrice(vehicle.priceFrom, "USD")}
            </span>
            <span className="cr-price-period">/ day</span>
          </div>
          <div className="cr-vehicle-actions">
            <Link to={`/car-rental/${vehicle.slug}`} className="cr-view-more-btn">
              View More
            </Link>
            <button type="button" className="cr-book-btn" onClick={() => onBook(vehicle)}>
              Book Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CarRental = () => {
  const { settings } = useSiteSettings();
  const whatsappLink = companyWhatsAppHref(settings, DEFAULT_SITE_SETTINGS);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    show: false,
    variant: "success",
    title: "",
    message: "",
    reference: "",
  });
  const [fleet, setFleet] = useState([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [categoryMeta, setCategoryMeta] = useState({ total: 0, categories: [] });
  const [page, setPage] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleClass: "economy",
    pickupLocation: "",
    returnLocation: "",
    driverOption: "self-drive",
    extras: {
      childSeat: false,
      rooftopBox: false,
      additionalDriver: false,
    },
    message: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const preselect = params.get("vehicle");
    if (preselect) {
      setForm((prev) => ({ ...prev, vehicleClass: preselect }));
      if (location.hash === "#rental-booking") {
        window.setTimeout(() => {
          document.getElementById("rental-booking")?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  }, [location.search, location.hash]);

  useEffect(() => {
    const ac = new AbortController();
    Promise.all([
      fetch(apiUrl("/api/car-rental-vehicles/catalog"), { signal: ac.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
      fetch(apiUrl("/api/car-rental-vehicles/categories"), { signal: ac.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
    ])
      .then(([catalogJson, categoriesJson]) => {
        const nextFleet = normalizeCatalogToFleet(catalogJson);
        if (!nextFleet?.length) return;
        setFleet(nextFleet);
        if (categoriesJson?.categories?.length) {
          setCategoryMeta({
            total: Number(categoriesJson.total ?? nextFleet.length),
            categories: categoriesJson.categories,
          });
        } else {
          setCategoryMeta(buildCategoryPillsFromFleet(nextFleet));
        }
        setForm((prev) => {
          const ok = nextFleet.some((x) => x.slug === prev.vehicleClass);
          return ok ? prev : { ...prev, vehicleClass: nextFleet[0].slug };
        });
      })
      .catch(() => {})
      .finally(() => setFleetLoading(false));
    return () => ac.abort();
  }, []);

  const filteredFleet = useMemo(() => {
    if (activeCategory === "all") return fleet;
    return fleet.filter(
      (v) => normalizeVehicleCategory(v.category, v.slug) === activeCategory,
    );
  }, [fleet, activeCategory]);

  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  const pillCounts = useMemo(() => {
    const counts = { all: categoryMeta.total || fleet.length };
    categoryMeta.categories.forEach((c) => {
      counts[c.key] = c.count;
    });
    return counts;
  }, [categoryMeta, fleet.length]);

  const filterPills = useMemo(
    () => [
      { key: "all", label: "All vehicles" },
      ...categoryMeta.categories.map((c) => ({ key: c.key, label: c.label })),
    ],
    [categoryMeta],
  );

  const setCategoryFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === "all") next.delete("category");
    else next.set("category", key);
    setSearchParams(next, { replace: true });
  };

  const totalPages = Math.max(1, Math.ceil(filteredFleet.length / CARDS_PER_PAGE));
  const visibleFleet = useMemo(
    () => filteredFleet.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE),
    [filteredFleet, page],
  );

  const handleBook = (vehicle) => {
    setForm((prev) => ({ ...prev, vehicleClass: vehicle.slug }));
    document.getElementById("rental-booking")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  const faqs = [
    {
      q: "What documents do I need to rent?",
      a: "Valid passport or national ID, a driving licence held for at least 2 years, and a credit or debit card for the security hold.",
    },
    {
      q: "Is fuel included?",
      a: "Vehicles are supplied with a documented fuel level and should be returned at the same level unless you purchase a prepaid fuel bundle.",
    },
    {
      q: "Can I drive to national parks?",
      a: "4×4 safari vehicles are approved for park access routes. Standard economy cars are not suitable for deep gravel roads.",
    },
    {
      q: "Cancellation policy?",
      a: "Free cancellation up to 48 hours before pickup on many rates. Your quote will state the exact terms.",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pickupDate || !returnDate) {
      setFeedback({
        show: true,
        variant: "warning",
        title: "Dates required",
        message: "Please select both pickup and return dates.",
        reference: "",
      });
      return;
    }
    const pickupIso = toLocalYmd(pickupDate);
    const returnIso = toLocalYmd(returnDate);
    if (returnIso < pickupIso) {
      setFeedback({
        show: true,
        variant: "warning",
        title: "Invalid dates",
        message: "Return date cannot be before pickup date.",
        reference: "",
      });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/car-rental-requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          vehicleClass: form.vehicleClass,
          pickupDate: pickupIso,
          returnDate: returnIso,
          pickupLocation: form.pickupLocation,
          returnLocation: form.returnLocation,
          driverOption: form.driverOption,
          extras: form.extras,
          message: form.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not submit request. Try again later.");
      }
      setFeedback({
        show: true,
        variant: "success",
        title: "Rental request received",
        message:
          "Our team will confirm vehicle availability and send a secure payment link.",
        reference: data.reference || data.id?.slice(0, 8).toUpperCase() || "",
      });
      setForm({
        name: "",
        email: "",
        phone: "",
        vehicleClass: fleet[0]?.slug || "economy",
        pickupLocation: "",
        returnLocation: "",
        driverOption: "self-drive",
        extras: { childSeat: false, rooftopBox: false, additionalDriver: false },
        message: "",
      });
      setPickupDate(null);
      setReturnDate(null);
    } catch (err) {
      setFeedback({
        show: true,
        variant: "error",
        title: "Submission failed",
        message: err?.message || "Could not submit your request. Please try again.",
        reference: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("extra_")) {
      const key = name.replace("extra_", "");
      setForm((prev) => ({
        ...prev,
        extras: { ...prev.extras, [key]: checked },
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="car-rental-page">
      <section className="cr-hero">
        <div className="cr-hero-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <span className="cr-hero-label">Rwanda Fleet</span>
              <h1 className="cr-hero-title">
                <span className="cr-title-script">Car</span>
                <span className="cr-title-bold">Rental</span>
              </h1>
              <p className="cr-hero-desc">
                Self-drive or chauffeured vehicles from Kigali — economy city cars to
                4×4 safari rigs for gorilla trekking and national parks.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="cr-vehicles-section">
        <Container>
          <div className="cr-section-header">
            <div>
              <h2 className="cr-section-title">Most Searched Vehicles</h2>
              <p className="cr-section-subtitle">Rwanda&apos;s leading rental fleet</p>
            </div>
            {totalPages > 1 && (
              <div className="cr-nav-arrows">
                <button
                  type="button"
                  aria-label="Previous vehicles"
                  onClick={handlePrev}
                  disabled={page === 0}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  type="button"
                  aria-label="Next vehicles"
                  onClick={handleNext}
                  disabled={page >= totalPages - 1}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>

          <div className="cr-filter-pills">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                className={`cr-pill${activeCategory === pill.key ? " active" : ""}`}
                onClick={() => setCategoryFilter(pill.key)}
              >
                {pill.label}
                <span className="cr-pill-count">{pillCounts[pill.key] ?? 0}</span>
              </button>
            ))}
          </div>

          {fleetLoading ? (
            <div className="cr-empty-filter">
              <div className="spinner-border text-primary" role="status" aria-hidden="true" />
              <p className="mt-3 mb-0">Loading fleet…</p>
            </div>
          ) : filteredFleet.length > 0 ? (
            <Row>
              {visibleFleet.map((vehicle) => (
                <Col lg={4} md={6} className="mb-4" key={vehicle.id}>
                  <VehicleCard vehicle={vehicle} onBook={handleBook} />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="cr-empty-filter">
              <i className="bi bi-car-front"></i>
              <h4>No vehicles in this category</h4>
              <p>
                Try another filter or browse all vehicles
                {activeCategory !== "all" ? (
                  <>
                    {" "}
                    —{" "}
                    <button type="button" className="cr-empty-link" onClick={() => setCategoryFilter("all")}>
                      show all
                    </button>
                  </>
                ) : null}
                .
              </p>
            </div>
          )}
        </Container>
      </section>

      <section id="rental-booking" className="cr-booking-section">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-4">
              <h2 className="cr-section-title">Request a Quote</h2>
              <p className="cr-section-subtitle">
                We&apos;ll confirm vehicle availability and send a detailed quote.
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={8} className="mx-auto">
              <Form onSubmit={handleSubmit} className="cr-booking-form">
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Label>Full name *</Form.Label>
                    <Form.Control
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Phone / WhatsApp *</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Vehicle *</Form.Label>
                    <Form.Select
                      name="vehicleClass"
                      value={form.vehicleClass}
                      onChange={handleChange}
                      required
                    >
                      {fleet.map((v) => (
                        <option key={v.slug} value={v.slug}>
                          {v.fullTitle || v.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Pickup date *</Form.Label>
                    <DatePicker
                      selected={pickupDate}
                      onChange={setPickupDate}
                      minDate={new Date()}
                      className="form-control"
                      dateFormat="MM/dd/yyyy"
                      placeholderText="Select date"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Return date *</Form.Label>
                    <DatePicker
                      selected={returnDate}
                      onChange={setReturnDate}
                      minDate={pickupDate || new Date()}
                      className="form-control"
                      dateFormat="MM/dd/yyyy"
                      placeholderText="Select date"
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Pickup location *</Form.Label>
                    <Form.Control
                      name="pickupLocation"
                      value={form.pickupLocation}
                      onChange={handleChange}
                      placeholder="e.g. KGL airport, hotel name"
                      required
                    />
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Label>Return location</Form.Label>
                    <Form.Control
                      name="returnLocation"
                      value={form.returnLocation}
                      onChange={handleChange}
                      placeholder="Same as pickup if blank"
                    />
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label>Driving option</Form.Label>
                    <Form.Select
                      name="driverOption"
                      value={form.driverOption}
                      onChange={handleChange}
                    >
                      <option value="self-drive">Self-drive</option>
                      <option value="chauffeur">Professional driver</option>
                      <option value="both">Not sure — advise me</option>
                    </Form.Select>
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label>Extras</Form.Label>
                    <div>
                      <Form.Check
                        inline
                        type="checkbox"
                        id="extra-child"
                        name="extra_childSeat"
                        checked={form.extras.childSeat}
                        onChange={handleChange}
                        label="Child seat"
                      />
                      <Form.Check
                        inline
                        type="checkbox"
                        id="extra-roof"
                        name="extra_rooftopBox"
                        checked={form.extras.rooftopBox}
                        onChange={handleChange}
                        label="Roof box"
                      />
                      <Form.Check
                        inline
                        type="checkbox"
                        id="extra-driver"
                        name="extra_additionalDriver"
                        checked={form.extras.additionalDriver}
                        onChange={handleChange}
                        label="Additional driver"
                      />
                    </div>
                  </Col>
                  <Col md={12} className="mb-3">
                    <Form.Label>Itinerary notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Parks visited, cross-border plans, flight numbers..."
                    />
                  </Col>
                  <Col md={12} className="text-center">
                    <Button type="submit" className="primaryBtn cr-submit-btn" disabled={submitting}>
                      {submitting ? "Sending…" : "Submit rental request"}
                    </Button>
                    <p className="cr-form-note">
                      <i className="bi bi-shield-check"></i> Secure handling • Reply within one business day
                    </p>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="cr-faq-section">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-4">
              <h2 className="cr-section-title">Car Rental FAQs</h2>
            </Col>
            <Col lg={8} className="mx-auto">
              <Accordion>
                {faqs.map((item, index) => (
                  <Accordion.Item eventKey={String(index)} key={item.q}>
                    <Accordion.Header>{item.q}</Accordion.Header>
                    <Accordion.Body>{item.a}</Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="cr-cta-section">
        <div className="cr-cta-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <h2 className="cr-cta-title">Need a Full Safari Package?</h2>
              <p className="cr-cta-desc">
                Combine your vehicle with permits, lodges, and guided experiences.
              </p>
              <div className="cr-cta-buttons">
                <Link to="/packages" className="primaryBtn me-3">
                  View Tour Packages
                </Link>
                <a
                  href={whatsappLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cr-whatsapp-btn"
                  onClick={(e) => !whatsappLink && e.preventDefault()}
                >
                  <i className="bi bi-whatsapp"></i> WhatsApp Fleet Desk
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <BookingFeedbackModal
        show={feedback.show}
        onHide={() => setFeedback((prev) => ({ ...prev, show: false }))}
        variant={feedback.variant}
        title={feedback.title}
        message={feedback.message}
        reference={feedback.reference}
        showContactLink={feedback.variant === "error"}
      />
    </div>
  );
};

export default CarRental;
