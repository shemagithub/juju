import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Modal,
  Accordion,
} from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import "./destinations.css";
import { fetchJson, resolveMediaUrl } from "../../utils/backendApi";
import { isDisplayableName } from "../../utils/contentValidation";
import { landingPathForDestination } from "../../utils/destinationLandings";

import heroFeatured from "../../assets/images/tour/bangkok.png";
import fallbackImg from "../../assets/images/tour/bali-1.png";

const FEATURE_CARDS = [
  { num: 1, icon: "bi-shield-check", label: "Safety First Always" },
  { num: 2, icon: "bi-signpost-split", label: "Exclusive Trip" },
  { num: 3, icon: "bi-person-badge", label: "Professional Guide" },
  { num: 4, icon: "bi-cup-hot", label: "World-Class Dining" },
];

const FILTER_PILLS = [
  { key: "all", label: "All" },
  { key: "parks", label: "National Parks" },
  { key: "cities", label: "Cities" },
  { key: "lakes", label: "Lakes" },
];

function inferDestinationCategory(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("kigali")) return "cities";
  if (n.includes("lake") || n.includes("kivu")) return "lakes";
  return "parks";
}

const DEFAULT_FAQS = [
  {
    question: "Is this destination safe to visit?",
    answer: "Yes — all tours are led by licensed guides who prioritize your safety.",
  },
  {
    question: "How many days should I spend here?",
    answer: "We recommend 2–3 days to fully experience this destination.",
  },
];

function mapDestinationFromApi(d) {
  const name = d.name || "Destination";
  const firstImg =
    Array.isArray(d.imageUrls) && d.imageUrls.length
      ? resolveMediaUrl(d.imageUrls[0])
      : "";

  return {
    id: d.id,
    name,
    slug: d.slug || "",
    category: d.category || inferDestinationCategory(name),
    image: firstImg || fallbackImg,
    location: d.location || "Rwanda",
    description: d.description || `Explore ${name} with expert local guides.`,
    distance: d.distance || "Distance on request",
    permitRequired: !!d.permitRequired,
    permitPrice: Number(d.permitPrice) > 0 ? Number(d.permitPrice) : undefined,
    highlights: Array.isArray(d.highlights) ? d.highlights : [],
    activities: Array.isArray(d.activities) ? d.activities : [],
    bestTime: d.bestTime || "Year-round",
    weather: d.weather || "Varies by season",
    reviews: Array.isArray(d.reviews) ? d.reviews : [],
    faqs: Array.isArray(d.faqs) && d.faqs.length ? d.faqs : DEFAULT_FAQS,
  };
}

const Destinations = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [carouselPage, setCarouselPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(2);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchJson("/api/destinations");
        if (cancelled) return;
        if (Array.isArray(rows) && rows.length > 0) {
          setDestinations(
            rows
              .filter((d) => isDisplayableName(d?.name))
              .map(mapDestinationFromApi),
          );
        }
      } catch { /* empty */ }
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredDestinations = useMemo(() => {
    if (activeFilter === "all") return destinations;
    return destinations.filter((d) => d.category === activeFilter);
  }, [destinations, activeFilter]);

  const filterPills = useMemo(() => {
    const keys = [...new Set(destinations.map((d) => d.category).filter(Boolean))];
    return [
      { key: "all", label: "All" },
      ...keys.map((key) => ({
        key,
        label: FILTER_PILLS.find((p) => p.key === key)?.label || key,
      })),
    ];
  }, [destinations]);

  const pillCounts = useMemo(() => {
    const counts = { all: destinations.length };
    filterPills.forEach((p) => {
      if (p.key !== "all") {
        counts[p.key] = destinations.filter((d) => d.category === p.key).length;
      }
    });
    return counts;
  }, [destinations, filterPills]);

  const heroImage = filteredDestinations[0]?.image || heroFeatured;

  useEffect(() => {
    const update = () => setCardsPerPage(window.innerWidth < 768 ? 1 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setCarouselPage(0);
  }, [activeFilter, cardsPerPage]);

  const totalCarouselPages = Math.max(
    1,
    Math.ceil(filteredDestinations.length / cardsPerPage),
  );

  const visibleCarousel = useMemo(
    () =>
      filteredDestinations.slice(
        carouselPage * cardsPerPage,
        carouselPage * cardsPerPage + cardsPerPage,
      ),
    [filteredDestinations, carouselPage, cardsPerPage],
  );

  const handleCarouselPrev = () => setCarouselPage((p) => Math.max(0, p - 1));
  const handleCarouselNext = () =>
    setCarouselPage((p) => Math.min(totalCarouselPages - 1, p + 1));

  const handleViewDetails = (destination) => {
    const landing = landingPathForDestination(destination);
    if (landing && landing !== "/destinations") {
      navigate(landing);
      return;
    }
    setSelectedDestination(destination);
    setShowModal(true);
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <i
        key={i}
        className={`bi ${i < rating ? "bi-star-fill" : "bi-star"}`}
        style={{ color: i < rating ? "#e8b923" : "#ddd" }}
      />
    ));

  return (
    <div className="destinations-page">
      <section className="dest-trending-section">
        <Container>
          <Row className="dest-trending-top align-items-center">
            <Col lg={5} className="mb-5 mb-lg-0">
              <span className="dest-page-label">Travel Guide</span>
              <h1 className="dest-section-title">
                <span className="dest-title-script">Trending</span>
                <span className="dest-title-bold">Destination</span>
              </h1>
              <p className="dest-section-desc">
                Explore Rwanda&apos;s most breathtaking landscapes — from misty mountain
                gorillas and golden savannas to vibrant city culture and serene lakeside retreats.
              </p>
              <div className="dest-features-grid">
                {FEATURE_CARDS.map((card) => (
                  <div key={card.num} className="dest-feature-card">
                    <span className="dest-feature-num">{card.num}</span>
                    <div className="dest-feature-body">
                      <i className={`bi ${card.icon}`}></i>
                      <span>{card.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
            <Col lg={7}>
              <div className="dest-hero-image">
                <img src={heroImage} alt="Featured Rwanda destination" />
              </div>
            </Col>
          </Row>

          <div className="dest-filter-pills">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                className={`dest-pill ${activeFilter === pill.key ? "active" : ""}`}
                onClick={() => setActiveFilter(pill.key)}
              >
                {pill.label}
                <span className="dest-pill-count">{pillCounts[pill.key] || 0}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="dest-empty">
              <div className="spinner-border text-primary" role="status" aria-hidden="true" />
              <p className="mt-3 mb-0">Loading destinations…</p>
            </div>
          ) : filteredDestinations.length > 0 ? (
            <>
              <div className="dest-carousel-section">
                <div className="dest-carousel-viewport" key={`${activeFilter}-${carouselPage}`}>
                  <Row className="dest-carousel-row g-4">
                    {visibleCarousel.map((destination) => (
                      <Col md={6} key={destination.id}>
                        <div
                          className="dest-gallery-card"
                          onClick={() => handleViewDetails(destination)}
                          onKeyDown={(e) => e.key === "Enter" && handleViewDetails(destination)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="dest-gallery-img-wrap">
                            {destination.permitRequired && (
                              <span className="dest-permit-banner">Permit Required</span>
                            )}
                            <img src={destination.image} alt={destination.name} />
                          </div>
                          <div className="dest-gallery-info">
                            <h5>{destination.name}</h5>
                            <span><i className="bi bi-geo-alt"></i> {destination.location}</span>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
                <div className="dest-carousel-footer">
                  <span className="dest-carousel-counter">
                    {carouselPage + 1} / {totalCarouselPages}
                  </span>
                  <div className="dest-carousel-nav">
                    <button
                      type="button"
                      aria-label="Previous destinations"
                      onClick={handleCarouselPrev}
                      disabled={carouselPage === 0}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <button
                      type="button"
                      aria-label="Next destinations"
                      onClick={handleCarouselNext}
                      disabled={carouselPage >= totalCarouselPages - 1}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="dest-grid-section">
                <h2 className="dest-grid-title">
                  <span className="dest-title-script">All</span>
                  <span className="dest-title-bold">Destinations</span>
                </h2>
                <Row>
                  {filteredDestinations.map((destination) => (
                    <Col md={6} lg={4} key={`grid-${destination.id}`} className="mb-4">
                      <div
                        className="dest-grid-card"
                        onClick={() => handleViewDetails(destination)}
                        onKeyDown={(e) => e.key === "Enter" && handleViewDetails(destination)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="dest-grid-img">
                          <img src={destination.image} alt={destination.name} />
                        </div>
                        <div className="dest-grid-body">
                          <h5>{destination.name}</h5>
                          <p>{destination.description?.slice(0, 100)}…</p>
                          <span className="dest-grid-link">
                            View Details <i className="bi bi-arrow-right"></i>
                          </span>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </>
          ) : (
            <div className="dest-empty">
              <i className="bi bi-map"></i>
              <h4>{destinations.length ? "No destinations in this category" : "Destinations coming soon"}</h4>
              <p>
                {destinations.length
                  ? "Try selecting a different filter."
                  : "Our team is adding Rwanda travel guides. Contact us to plan your trip today."}
              </p>
              {destinations.length ? (
                <button type="button" className="dest-pill active" onClick={() => setActiveFilter("all")}>
                  Show All
                </button>
              ) : (
                <NavLink to="/contact" className="primaryBtn">Contact Us</NavLink>
              )}
            </div>
          )}
        </Container>
      </section>

      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        className="destination-details-modal"
        centered
      >
        {selectedDestination && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selectedDestination.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <img
                src={selectedDestination.image}
                alt={selectedDestination.name}
                className="w-100 mb-4 dest-modal-img"
              />
              <p className="dest-modal-desc">{selectedDestination.description}</p>

              <div className="dest-modal-meta">
                <div><i className="bi bi-geo-alt"></i> {selectedDestination.location}</div>
                <div><i className="bi bi-signpost"></i> {selectedDestination.distance}</div>
                {selectedDestination.permitRequired && (
                  <div><i className="bi bi-ticket"></i> Permit: ${selectedDestination.permitPrice}/person</div>
                )}
              </div>

              {selectedDestination.highlights?.length > 0 && (
                <div className="dest-highlights mt-4">
                  <h5>Highlights</h5>
                  <ul>
                    {selectedDestination.highlights.map((h, i) => (
                      <li key={i}><i className="bi bi-check-circle-fill"></i> {h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedDestination.activities?.length > 0 && (
                <div className="mt-4">
                  <h5>Activities</h5>
                  <Row>
                    {selectedDestination.activities.map((act, idx) => (
                      <Col sm={6} key={idx} className="mb-3">
                        <div className="activity-item">
                          <div className="activity-icon">{act.icon}</div>
                          <div className="activity-content">
                            <h6>{act.name}</h6>
                            <p>{act.description}</p>
                          </div>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              <Row className="mt-3">
                <Col md={6}>
                  <h5>Best Time to Visit</h5>
                  <p>{selectedDestination.bestTime}</p>
                  <p className="text-muted">{selectedDestination.weather}</p>
                </Col>
                {selectedDestination.reviews?.length > 0 && (
                  <Col md={6}>
                    <h5>Reviews</h5>
                    {selectedDestination.reviews.map((r, i) => (
                      <div key={i} className="review-item">
                        <div className="review-header">
                          <strong>{r.name}</strong>
                          <div>{renderStars(r.rating)}</div>
                        </div>
                        <p className="review-comment">&quot;{r.comment}&quot;</p>
                      </div>
                    ))}
                  </Col>
                )}
              </Row>

              {(selectedDestination.faqs?.length > 0) && (
                <Accordion className="mt-3 dest-modal-faqs">
                  {selectedDestination.faqs.map((faq, idx) => (
                    <Accordion.Item eventKey={String(idx)} key={faq.question}>
                      <Accordion.Header>{faq.question}</Accordion.Header>
                      <Accordion.Body>{faq.answer}</Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" className="dest-modal-close" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button className="primaryBtn" as={NavLink} to="/packages" onClick={() => setShowModal(false)}>
                View Packages
              </Button>
              <Button className="tealBtn" as={NavLink} to="/contact" onClick={() => setShowModal(false)}>
                Contact Us
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      <section className="cta-section py-5">
        <div className="cta-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <h2 className="cta-title">Ready to Explore Rwanda?</h2>
              <p className="cta-description">
                Choose your destination and let us create an unforgettable experience for you
              </p>
              <div className="cta-buttons">
                <Button className="primaryBtn me-2" as={NavLink} to="/packages">Book a Tour</Button>
                <Button variant="outline-light" as={NavLink} to="/contact">Customize Trip</Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Destinations;
