import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Modal,
  Tabs,
  Tab,
  Accordion,
  Badge,
} from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { NavLink } from "react-router-dom";
import "./packages.css";
import {
  fetchJson,
  resolveMediaUrl,
} from "../../utils/backendApi";
import { companyWhatsAppHref, formatCategoryLabel } from "../../utils/contentValidation";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import BookingFeedbackModal from "../../components/BookingFeedback/BookingFeedbackModal";

const PACKAGES_FALLBACK = [
    {
      id: 1,
      name: "3-Day Gorilla Trekking Adventure",
      category: "gorilla",
      duration: "3 Days / 2 Nights",
      price: 1500,
      image: require("../../assets/images/tour/bali-1.png"),
      destination: "Volcanoes National Park",
      badge: "Best Seller",
      difficulty: "Moderate",
      permitIncluded: true,
      description:
        "Experience the magic of mountain gorillas in their natural habitat. This package includes gorilla permits, accommodation, and expert guides.",
      highlights: [
        "Gorilla trekking permit included",
        "2 nights luxury lodge accommodation",
        "Professional guide",
        "All meals included",
      ],
    },
    {
      id: 2,
      name: "5-Day Wildlife Safari Package",
      category: "safari",
      duration: "5 Days / 4 Nights",
      price: 2500,
      image: require("../../assets/images/tour/bangkok.png"),
      destination: "Akagera National Park",
      badge: "Popular",
      difficulty: "Easy",
      permitIncluded: false,
      description:
        "Explore Rwanda's diverse wildlife including elephants, lions, zebras, and more. Complete safari experience with game drives.",
      highlights: [
        "Multiple game drives",
        "Luxury tented camp",
        "Boat safari included",
        "All park fees covered",
      ],
    },
    {
      id: 3,
      name: "2-Day Kigali City Tour",
      category: "city",
      duration: "2 Days / 1 Night",
      price: 450,
      image: require("../../assets/images/tour/cancun.png"),
      destination: "Kigali",
      badge: "Budget",
      difficulty: "Easy",
      permitIncluded: false,
      description:
        "Discover Rwanda's capital city with cultural visits, genocide memorial, and local markets.",
      highlights: [
        "City tour guide",
        "Hotel accommodation",
        "Breakfast included",
        "Museum visits",
      ],
    },
    {
      id: 4,
      name: "7-Day Luxury Rwanda Experience",
      category: "luxury",
      duration: "7 Days / 6 Nights",
      price: 5500,
      image: require("../../assets/images/tour/malaysia.png"),
      destination: "Multiple Locations",
      badge: "Luxury",
      difficulty: "Easy",
      permitIncluded: true,
      description:
        "Ultimate luxury experience combining gorilla trekking, wildlife safari, and cultural immersion in premium accommodations.",
      highlights: [
        "Premium lodge stays",
        "Private vehicle & guide",
        "All activities included",
        "Champagne welcome",
      ],
    },
    {
      id: 5,
      name: "4-Day Budget Gorilla Trekking",
      category: "budget",
      duration: "4 Days / 3 Nights",
      price: 1200,
      image: require("../../assets/images/tour/paris.png"),
      destination: "Volcanoes National Park",
      badge: "Limited Slots",
      difficulty: "Moderate",
      permitIncluded: true,
      description:
        "Affordable gorilla trekking experience with comfortable accommodation and all essentials included.",
      highlights: [
        "Gorilla permit included",
        "Budget-friendly lodge",
        "All meals",
        "Transportation",
      ],
    },
    {
      id: 6,
      name: "6-Day Rwanda Discovery Tour",
      category: "safari",
      duration: "6 Days / 5 Nights",
      price: 3200,
      image: require("../../assets/images/tour/phuket.png"),
      destination: "Multiple Parks",
      badge: "Popular",
      difficulty: "Moderate",
      permitIncluded: true,
      description:
        "Complete Rwanda experience covering gorilla trekking, wildlife safari, and cultural sites.",
      highlights: [
        "Gorilla trekking",
        "Wildlife safari",
        "Cultural village visit",
        "All meals & accommodation",
      ],
    },
];

function mapTourPackageFromApi(p, catById, destById, defaultImage) {
  const cat = catById[p.categoryId || ""] || {};
  const slug = cat.slug || "other";
  const destNames = (p.destinationIds || [])
    .map((id) => destById[id]?.name)
    .filter(Boolean);
  const imgs = Array.isArray(p.imageUrls) ? p.imageUrls : [];
  const cover = imgs[0] ? resolveMediaUrl(imgs[0]) : "";
  const days = Number(p.durationDays) || 0;
  const nights = Math.max(0, days - 1);
  const itineraryHighlights = (p.itinerary || [])
    .slice(0, 8)
    .map((it) =>
      [it.title, it.description].filter(Boolean).join(": ").trim() || "",
    )
    .filter(Boolean);
  const rawText = `${p.title || ""} ${p.description || ""}`;
  const permitIncluded =
    /\bgorilla\b|gorilla trekking|trek permit|permit included/i.test(rawText);

  return {
    id: p.id,
    name: p.title,
    category: slug,
    duration:
      days > 0 ? `${days} Days / ${nights} Nights` : "Duration on request",
    image: cover || defaultImage,
    destination: destNames.join(", ") || "Rwanda",
    badge: cat.name
      ? cat.name.slice(0, 20)
      : slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    difficulty: "Moderate",
    permitIncluded,
    description:
      p.description ||
      "Ask us for a day-by-day plan — we tailor every departure.",
    highlights:
      itineraryHighlights.length > 0
        ? itineraryHighlights
        : [
            "Lodges matched to your budget",
            "Private or small-group pacing",
            "Support from our Kigali team",
          ],
  };
}

const Packages = () => {
  const { settings } = useSiteSettings();
  const whatsappLink = companyWhatsAppHref(settings, DEFAULT_SITE_SETTINGS);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [categoriesFromApi, setCategoriesFromApi] = useState(null);

  const [filters, setFilters] = useState({
    duration: "",
    location: "",
    people: "",
    tourType: "",
    difficulty: "",
  });

  const [bookingForm, setBookingForm] = useState({
    packageId: "",
    travelers: 1,
    date: null,
    name: "",
    email: "",
    phone: "",
    message: "",
    agreeToTerms: false,
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState({
    show: false,
    variant: "success",
    title: "",
    message: "",
    reference: "",
    packageName: "",
    paymentMethod: "",
  });

  useEffect(() => {
    let cancelled = false;
    const defaultPkgImage =
      PACKAGES_FALLBACK[0]?.image ||
      require("../../assets/images/tour/bali-1.png");

    (async () => {
      try {
        const [pkgsRaw, catsRaw, destsRaw] = await Promise.all([
          fetchJson("/api/tour-packages"),
          fetchJson("/api/package-categories"),
          fetchJson("/api/destinations"),
        ]);
        if (cancelled) return;

        const destById = Object.fromEntries((destsRaw || []).map((d) => [d.id, d]));
        const catById = Object.fromEntries(
          (catsRaw || []).map((c) => [
            c.id,
            {
              id: c.id,
              name: c.name,
              slug:
                (c.slug || "")
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, "-") || "other",
            },
          ]),
        );

        const list = Array.isArray(pkgsRaw) ? pkgsRaw : [];
        const activePkgs = list.filter(
          (p) => !(p.status && String(p.status).toLowerCase() === "archived"),
        );

        const mapped =
          activePkgs.length > 0
            ? activePkgs.map((p) =>
                mapTourPackageFromApi(p, catById, destById, defaultPkgImage),
              )
            : null;

        if (mapped?.length) {
          setPackages(mapped);
          setCategoriesFromApi(
            Array.isArray(catsRaw) && catsRaw.length ? catsRaw : null,
          );
          setActiveTab("all");
        } else {
          setPackages([]);
        }
      } catch {
        setPackages([]);
      } finally {
        if (!cancelled) setPackagesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryRows = useMemo(() => {
    if (categoriesFromApi?.length) {
      return categoriesFromApi.map((c) => {
        const slug =
          (c.slug || "")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-") ||
          String(c.name || "tour")
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");
        const count = packages.filter((p) => p.category === slug).length;
        return {
          key: slug,
          label: formatCategoryLabel(c.name || slug),
          count,
        };
      });
    }
    const slugs = [...new Set(packages.map((p) => p.category).filter(Boolean))];
    return slugs.map((slug) => ({
      key: slug,
      label: formatCategoryLabel(slug),
      count: packages.filter((p) => p.category === slug).length,
    }));
  }, [categoriesFromApi, packages]);

  const visibleCategoryRows = useMemo(
    () => categoryRows.filter((row) => row.count > 0),
    [categoryRows],
  );

  const filteredPackages = packages.filter((pkg) => {
    if (activeTab !== "all" && pkg.category !== activeTab) return false;
    if (filters.duration && pkg.duration !== filters.duration) return false;
    return true;
  });

  const handleViewDetails = (pkg) => {
    setSelectedPackage(pkg);
    setShowModal(true);
  };

  const handleBookNow = (pkg) => {
    setSelectedPackage(pkg);
    setBookingForm({ ...bookingForm, packageId: pkg.id });
    setShowBookingModal(true);
  };

  const resetBookingForm = () => {
    setBookingForm({
      packageId: "",
      travelers: 1,
      date: null,
      name: "",
      email: "",
      phone: "",
      message: "",
      agreeToTerms: false,
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return;
    if (!bookingForm.name.trim() || !bookingForm.email.trim()) {
      setBookingFeedback({
        show: true,
        variant: "error",
        title: "Contact details required",
        message: "Please enter your name and email so we can confirm your booking.",
        reference: "",
        packageName: selectedPackage.name,
        paymentMethod: "",
      });
      return;
    }
    if (!bookingForm.agreeToTerms) {
      setBookingFeedback({
        show: true,
        variant: "warning",
        title: "Terms required",
        message: "Please accept the terms and conditions to complete your booking request.",
        reference: "",
        packageName: selectedPackage.name,
        paymentMethod: "",
      });
      return;
    }

    const reference = `PKG-${Date.now().toString().slice(-8).toUpperCase()}`;
    setBookingSubmitting(true);
    try {
      await fetchJson("/api/tour-booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          packageId: selectedPackage.id,
          name: bookingForm.name.trim(),
          email: bookingForm.email.trim(),
          phone: bookingForm.phone.trim(),
          serviceType: "package",
          travelDate: bookingForm.date
            ? bookingForm.date.toISOString().slice(0, 10)
            : null,
          adults: Number(bookingForm.travelers) || 1,
          children: 0,
          details: {
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            message: bookingForm.message,
            travelers: Number(bookingForm.travelers) || 1,
          },
        }),
      });
      setShowBookingModal(false);
      resetBookingForm();
      setBookingFeedback({
        show: true,
        variant: "success",
        title: "Booking request submitted!",
        message: "We received your package inquiry. Our team will confirm availability and send a custom quote.",
        reference,
        packageName: selectedPackage.name,
        paymentMethod: "",
      });
    } catch (err) {
      setBookingFeedback({
        show: true,
        variant: "error",
        title: "Could not submit booking",
        message: err.message || "Please try again or contact us for assistance.",
        reference: "",
        packageName: selectedPackage?.name || "",
        paymentMethod: "",
      });
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="packages-page">
      {/* 1. Packages Overview Section */}
      <section className="packages-hero">
        <div className="hero-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <h1 className="hero-title">Rwanda Tour Packages</h1>
              <p className="hero-description">
                Explore Rwanda with our carefully designed safari, gorilla trekking,
                city, and wildlife packages. From budget-friendly options to luxury
                experiences, find your perfect Rwanda adventure.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 2. Package Categories & Filters */}
      <section className="packages-filters py-4 bg-light">
        <Container>
          <Row>
            <Col md="12">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="category-tabs mb-4"
              >
                <Tab
                  eventKey="all"
                  title={
                    <span>
                      All Packages{" "}
                      <span className="tab-count">({packages.length})</span>
                    </span>
                  }
                />
                {visibleCategoryRows.map((row) => (
                  <Tab
                    key={row.key}
                    eventKey={row.key}
                    title={
                      <span>
                        {row.label}{" "}
                        <span className="tab-count">({row.count})</span>
                      </span>
                    }
                  />
                ))}
              </Tabs>
            </Col>
          </Row>

          {/* 3. Package Search & Filters */}
          <Row className="filter-section">
            <Col md="12">
              <div className="filter-panel">
                <Row>
                  <Col md="2" sm="6" className="mb-3">
                    <Form.Label>Duration</Form.Label>
                    <Form.Select
                      value={filters.duration}
                      onChange={(e) =>
                        setFilters({ ...filters, duration: e.target.value })
                      }
                    >
                      <option value="">All Durations</option>
                      <option value="1 Day">1 Day</option>
                      <option value="2 Days">2-3 Days</option>
                      <option value="4+ Days">4+ Days</option>
                    </Form.Select>
                  </Col>
                  <Col md="2" sm="6" className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Select
                      value={filters.location}
                      onChange={(e) =>
                        setFilters({ ...filters, location: e.target.value })
                      }
                    >
                      <option value="">All Locations</option>
                      <option value="Volcanoes">Volcanoes National Park</option>
                      <option value="Akagera">Akagera National Park</option>
                      <option value="Kigali">Kigali</option>
                    </Form.Select>
                  </Col>
                  <Col md="2" sm="6" className="mb-3">
                    <Form.Label>People</Form.Label>
                    <Form.Select
                      value={filters.people}
                      onChange={(e) =>
                        setFilters({ ...filters, people: e.target.value })
                      }
                    >
                      <option value="">Any</option>
                      <option value="1">1 Person</option>
                      <option value="2">2 People</option>
                      <option value="4">4+ People</option>
                    </Form.Select>
                  </Col>
                  <Col md="2" sm="6" className="mb-3">
                    <Form.Label>Tour Type</Form.Label>
                    <Form.Select
                      value={filters.tourType}
                      onChange={(e) =>
                        setFilters({ ...filters, tourType: e.target.value })
                      }
                    >
                      <option value="">All Types</option>
                      <option value="private">Private</option>
                      <option value="group">Group</option>
                    </Form.Select>
                  </Col>
                  <Col md="2" sm="6" className="mb-3">
                    <Button
                      variant="outline-secondary"
                      onClick={() =>
                        setFilters({
                          duration: "",
                          location: "",
                          people: "",
                          tourType: "",
                          difficulty: "",
                        })
                      }
                      className="w-100 mt-4"
                    >
                      Reset Filters
                    </Button>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 4. Package Cards */}
      <section className="packages-list py-5">
        <Container>
          <Row>
            <Col md="12" className="mb-4">
              <h3>
                {packagesLoading
                  ? "Loading packages…"
                  : `${filteredPackages.length} Package${filteredPackages.length !== 1 ? "s" : ""} Found`}
              </h3>
            </Col>
          </Row>
          {packagesLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status" aria-hidden="true" />
            </div>
          ) : filteredPackages.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted mb-3">No packages match your filters yet.</p>
              <NavLink to="/contact" className="primaryBtn">Request a Custom Quote</NavLink>
            </div>
          ) : (
          <Row>
            {filteredPackages.map((pkg) => (
              <Col md="4" sm="6" key={pkg.id} className="mb-4">
                <Card className="package-card">
                  <div className="package-image-container">
                    <Card.Img variant="top" src={pkg.image} />
                    {pkg.badge && (
                      <Badge className={`badge-${pkg.badge.toLowerCase().replace(" ", "")}`}>
                        {pkg.badge}
                      </Badge>
                    )}
                    {pkg.permitIncluded && (
                      <Badge className="badge-permit">
                        🦍 Permit Included
                      </Badge>
                    )}
                  </div>
                  <Card.Body>
                    <h5 className="package-name">{pkg.name}</h5>
                    <div className="package-meta">
                      <span>
                        <i className="bi bi-clock"></i> {pkg.duration}
                      </span>
                      <span>
                        <i className="bi bi-geo-alt"></i> {pkg.destination}
                      </span>
                    </div>
                    <p className="package-description">{pkg.description}</p>
                    <div className="package-highlights">
                      <h6>Highlights:</h6>
                      <ul>
                        {pkg.highlights.slice(0, 3).map((highlight, idx) => (
                          <li key={idx}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="package-footer">
                      <div className="package-price">
                        <span className="price-label">Price on request</span>
                      </div>
                      <div className="package-actions">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleViewDetails(pkg)}
                          className="me-2"
                        >
                          View Details
                        </Button>
                        <Button
                          className="primaryBtn"
                          size="sm"
                          onClick={() => handleBookNow(pkg)}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          )}
        </Container>
      </section>

      {/* 5. Package Details Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        className="package-details-modal"
      >
        {selectedPackage && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selectedPackage.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
                <Col md="12">
                  <img
                    src={selectedPackage.image}
                    alt={selectedPackage.name}
                    className="w-100 mb-3 rounded"
                  />
                </Col>
                <Col md="6">
                  <h5>Package Overview</h5>
                  <p className="package-description-full">{selectedPackage.description}</p>
                  <div className="package-info">
                    <p>
                      <strong>Duration:</strong> {selectedPackage.duration}
                    </p>
                    <p>
                      <strong>Destination:</strong> {selectedPackage.destination}
                    </p>
                    <p>
                      <strong>Difficulty:</strong> {selectedPackage.difficulty}
                    </p>
                    <p>
                      <strong>Gorilla Permit:</strong>{" "}
                      {selectedPackage.permitIncluded ? "Included" : "Not Included"}
                    </p>
                  </div>
                </Col>
                <Col md="6">
                  <div className="package-pricing-box">
                    <h4>Get a quote</h4>
                    <p className="text-muted mb-3">
                      Every departure is tailored to your group size, season, and lodge preferences.
                      Contact us for a personalized quote.
                    </p>
                    <Button
                      className="primaryBtn w-100 mb-2"
                      onClick={() => {
                        setShowModal(false);
                        handleBookNow(selectedPackage);
                      }}
                    >
                      Book This Package
                    </Button>
                    <Button
                      variant="outline-primary"
                      className="w-100 mb-2"
                      as={NavLink}
                      to="/contact"
                    >
                      Request Custom Quote
                    </Button>
                  </div>
                </Col>

                {/* Itinerary */}
                <Col md="12" className="mt-4">
                  <h5>🗺️ Itinerary</h5>
                  <div className="itinerary-timeline">
                    <div className="timeline-item">
                      <h6>Day 1: Arrival & Briefing</h6>
                      <p>
                        Arrive in Rwanda, meet your guide, and attend a comprehensive
                        briefing session. Transfer to accommodation.
                      </p>
                    </div>
                    <div className="timeline-item">
                      <h6>Day 2: Main Activity</h6>
                      <p>
                        {selectedPackage.category === "gorilla"
                          ? "Early morning gorilla trekking experience in Volcanoes National Park. Spend one hour with mountain gorillas."
                          : selectedPackage.category === "safari"
                          ? "Full day wildlife safari with multiple game drives. Spot elephants, lions, zebras, and more."
                          : "Explore the city with cultural visits, museums, and local markets."}
                      </p>
                    </div>
                    <div className="timeline-item">
                      <h6>Day 3: Departure</h6>
                      <p>Breakfast and transfer to airport or hotel extension.</p>
                    </div>
                  </div>
                </Col>

                {/* Inclusions & Exclusions */}
                <Col md="6" className="mt-4">
                  <h5>✅ Included</h5>
                  <ul className="inclusions-list">
                    <li>
                      {selectedPackage.permitIncluded && "Gorilla trekking permit"}
                      {!selectedPackage.permitIncluded && "All park entrance fees"}
                    </li>
                    <li>Transportation in 4x4 safari vehicle</li>
                    <li>Accommodation as specified</li>
                    <li>All meals (Breakfast, Lunch, Dinner)</li>
                    <li>Professional English-speaking guide</li>
                    <li>Bottled water</li>
                  </ul>
                </Col>
                <Col md="6" className="mt-4">
                  <h5>❌ Excluded</h5>
                  <ul className="exclusions-list">
                    <li>International flights</li>
                    <li>Visa fees</li>
                    <li>Travel insurance</li>
                    <li>Tips and gratuities</li>
                    <li>Personal expenses</li>
                    <li>Optional activities</li>
                  </ul>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Close
              </Button>
              <Button
                className="primaryBtn"
                onClick={() => {
                  setShowModal(false);
                  handleBookNow(selectedPackage);
                }}
              >
                Book Now
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* 10. Booking Modal */}
      <Modal
        show={showBookingModal}
        onHide={() => !bookingSubmitting && setShowBookingModal(false)}
        size="lg"
        className="package-booking-modal"
        contentClassName="package-booking-modal__content"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Book: {selectedPackage?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleBookingSubmit}>
            <Row>
              <Col md="6" className="mb-3">
                <Form.Label>Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  required
                  value={bookingForm.name}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, name: e.target.value })
                  }
                />
              </Col>
              <Col md="6" className="mb-3">
                <Form.Label>Email Address *</Form.Label>
                <Form.Control
                  type="email"
                  required
                  value={bookingForm.email}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, email: e.target.value })
                  }
                />
              </Col>
              <Col md="6" className="mb-3">
                <Form.Label>Phone Number *</Form.Label>
                <Form.Control
                  type="tel"
                  required
                  value={bookingForm.phone}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, phone: e.target.value })
                  }
                />
              </Col>
              <Col md="6" className="mb-3">
                <Form.Label>Travel Date *</Form.Label>
                <DatePicker
                  selected={bookingForm.date}
                  onChange={(date) =>
                    setBookingForm({ ...bookingForm, date })
                  }
                  minDate={new Date()}
                  className="form-control"
                  dateFormat="MM/dd/yyyy"
                  placeholderText="Select date"
                  required
                />
              </Col>
              <Col md="6" className="mb-3">
                <Form.Label>Number of Travelers *</Form.Label>
                <Form.Select
                  value={bookingForm.travelers}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      travelers: e.target.value,
                    })
                  }
                  required
                >
                  {[...Array(20)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? "Person" : "People"}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md="6" className="mb-3">
                <Form.Label>Tour Type</Form.Label>
                <Form.Select>
                  <option>Private Tour</option>
                  <option>Group Tour</option>
                </Form.Select>
              </Col>
              <Col md="12" className="mb-3">
                <Form.Label>Additional Message</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={bookingForm.message}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, message: e.target.value })
                  }
                  placeholder="Any special requirements..."
                />
              </Col>
              {selectedPackage?.permitIncluded && (
                <Col md="12" className="mb-3">
                  <div className="permit-notice">
                    <i className="bi bi-info-circle"></i>
                    <strong>Gorilla Permit Note:</strong> Please ensure all travelers
                    have valid passports. Permit booking requires passport details.
                  </div>
                </Col>
              )}
              <Col md="12" className="mt-3">
                <Form.Check
                  type="checkbox"
                  id="package-booking-terms"
                  label={
                    <span>
                      I agree to the{" "}
                      <NavLink to="/terms" target="_blank" rel="noopener noreferrer">
                        Terms & Conditions
                      </NavLink>
                    </span>
                  }
                  checked={bookingForm.agreeToTerms}
                  onChange={(e) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      agreeToTerms: e.target.checked,
                    }))
                  }
                  required
                />
              </Col>
            </Row>
            <div className="mt-4">
              <Button
                type="submit"
                className="primaryBtn w-100"
                disabled={bookingSubmitting || !bookingForm.agreeToTerms}
              >
                {bookingSubmitting ? "Submitting…" : "Request Booking"}
              </Button>
              <p className="text-center mt-2 text-muted">
                <i className="bi bi-shield-check"></i> We will reply with availability and a custom quote
              </p>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* 13. FAQ Section */}
      <section className="faq-section py-5 bg-light">
        <Container>
          <Row>
            <Col md="12" className="text-center mb-4">
              <h2 className="section-title">Package FAQs</h2>
            </Col>
            <Col md="10" className="mx-auto">
              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    What should I pack for gorilla trekking?
                  </Accordion.Header>
                  <Accordion.Body>
                    Pack waterproof hiking boots, long pants, long-sleeved shirt,
                    gloves, rain jacket, daypack, camera, and insect repellent. The
                    terrain can be muddy and challenging.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>
                    Is gorilla trekking physically difficult?
                  </Accordion.Header>
                  <Accordion.Body>
                    Gorilla trekking can be physically demanding as it involves hiking
                    through steep, muddy terrain at high altitude. A moderate fitness
                    level is recommended. The trek can last 1-8 hours depending on
                    gorilla location.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>
                    What is the age restriction for gorilla trekking?
                  </Accordion.Header>
                  <Accordion.Body>
                    Children must be 15 years or older to participate in gorilla
                    trekking. This is a government regulation to protect both gorillas
                    and visitors.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3">
                  <Accordion.Header>What is your cancellation policy?</Accordion.Header>
                  <Accordion.Body>
                    Cancellations made 30+ days before travel: Full refund minus 10%
                    admin fee. 15-30 days: 50% refund. Less than 15 days: No refund.
                    Gorilla permits are non-refundable once issued.
                  </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="4">
                  <Accordion.Header>
                    Can I customize a package?
                  </Accordion.Header>
                  <Accordion.Body>
                    Yes! We offer fully customizable tours. Contact us to discuss your
                    preferences and we'll create a tailor-made itinerary that fits your
                    schedule, budget, and interests.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 15. CTA Section */}
      <section className="cta-section py-5">
        <div className="cta-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <h2 className="cta-title">Need Help Choosing a Package?</h2>
              <p className="cta-description">
                Our travel experts are here to help you find the perfect Rwanda
                adventure
              </p>
              <div className="cta-buttons">
                <a
                  href={whatsappLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn me-3"
                  onClick={(e) => !whatsappLink && e.preventDefault()}
                >
                  <i className="bi bi-whatsapp"></i> Talk to an Expert
                </a>
                <NavLink to="/contact" className="secondary_btn">
                  Request Custom Tour
                </NavLink>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <BookingFeedbackModal
        show={bookingFeedback.show}
        onHide={() => setBookingFeedback((prev) => ({ ...prev, show: false }))}
        variant={bookingFeedback.variant}
        title={bookingFeedback.title}
        message={bookingFeedback.message}
        reference={bookingFeedback.reference}
        packageName={bookingFeedback.packageName}
        paymentMethod={bookingFeedback.paymentMethod}
        showContactLink={bookingFeedback.variant === "error"}
        primaryLabel={bookingFeedback.variant === "success" ? "Great, thanks!" : "OK"}
      />
    </div>
  );
};

export default Packages;
