import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./gallery.css";
import { fetchJson, resolveMediaUrl } from "../../utils/backendApi";

import g1 from "../../assets/images/gallery/g1.jpg";
import heroFeatured from "../../assets/images/slider/1.jpg";
import { sanitizeCaption } from "../../utils/contentValidation";

const CATEGORY_LABELS = {
  gorillas: "Gorillas",
  wildlife: "Wildlife",
  parks: "National Parks",
  vehicles: "Vehicles",
  hotels: "Lodges",
  city: "City",
  clients: "Travelers",
  general: "General",
};

function mapGalleryCategory(cat) {
  const c = String(cat || "general").toLowerCase();
  if (c.includes("gorilla") || c.includes("client")) return "gorillas";
  if (c.includes("wild") || c.includes("safari")) return "wildlife";
  if (c.includes("park") || c.includes("forest")) return "parks";
  if (c.includes("car") || c.includes("vehicle")) return "vehicles";
  if (c.includes("hotel") || c.includes("lodge")) return "hotels";
  if (c.includes("city")) return "city";
  if (c.includes("travel")) return "clients";
  return "parks";
}

function mapApiItem(g, index) {
  return {
    id: `api-${g.id}`,
    src: resolveMediaUrl(g.url) || g1,
    title: sanitizeCaption(g.caption),
    location: "Rwanda",
    category: mapGalleryCategory(g.category),
    tall: index % 3 === 0,
  };
}

const Gallery = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchJson("/api/gallery");
        if (cancelled) return;
        if (Array.isArray(items) && items.length) {
          setMedia(items.map(mapApiItem));
        } else {
          setMedia([]);
        }
      } catch {
        if (!cancelled) setMedia([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryPills = useMemo(() => {
    const keys = [...new Set(media.map((m) => m.category).filter(Boolean))];
    return [
      { key: "all", label: "All" },
      ...keys.map((key) => ({
        key,
        label: CATEGORY_LABELS[key] || key.replace(/-/g, " "),
      })),
    ];
  }, [media]);

  const pillCounts = useMemo(() => {
    const counts = { all: media.length };
    categoryPills.forEach((p) => {
      if (p.key !== "all") {
        counts[p.key] = media.filter((m) => m.category === p.key).length;
      }
    });
    return counts;
  }, [media, categoryPills]);

  const filteredMedia = useMemo(() => {
    if (activeCategory === "all") return media;
    return media.filter((m) => m.category === activeCategory);
  }, [media, activeCategory]);

  const heroImage = filteredMedia[0]?.src || heroFeatured;
  const lightboxItem = lightboxIndex != null ? filteredMedia[lightboxIndex] : null;

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () =>
    setLightboxIndex((i) => (i == null ? null : (i - 1 + filteredMedia.length) % filteredMedia.length));
  const goNext = () =>
    setLightboxIndex((i) => (i == null ? null : (i + 1) % filteredMedia.length));

  return (
    <div className="gallery-page">
      <section className="gal-hero-section">
        <Container>
          <Row className="gal-hero-top align-items-center">
            <Col lg={5} className="mb-5 mb-lg-0">
              <span className="gal-page-label">Memories</span>
              <h1 className="gal-section-title">
                <span className="gal-title-script">Photo</span>
                <span className="gal-title-bold">Gallery</span>
              </h1>
              <p className="gal-section-desc">
                Explore Rwanda through our lens — gorilla treks, savanna sunsets, rainforest
                canopies, and moments shared by travelers who journeyed with us.
              </p>
              <div className="gal-stats">
                <div className="gal-stat">
                  <strong>{media.length}+</strong>
                  <span>Photos</span>
                </div>
                <div className="gal-stat">
                  <strong>{Math.max(0, categoryPills.length - 1)}</strong>
                  <span>Categories</span>
                </div>
                <div className="gal-stat">
                  <strong>4K</strong>
                  <span>Quality</span>
                </div>
              </div>
            </Col>
            <Col lg={7}>
              <div className="gal-hero-image">
                <img src={heroImage} alt="Gallery featured" />
                <span className="gal-hero-badge">
                  <i className="bi bi-camera-fill"></i> RwandaQuest
                </span>
              </div>
            </Col>
          </Row>

          <div className="gal-filter-pills">
            {categoryPills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                className={`gal-pill${activeCategory === pill.key ? " active" : ""}`}
                onClick={() => setActiveCategory(pill.key)}
              >
                {pill.label}
                <span className="gal-pill-count">{pillCounts[pill.key] || 0}</span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      <section className="gal-grid-section">
        <Container>
          {loading ? (
            <div className="gal-empty text-center py-5">
              <div className="spinner-border text-primary" role="status" aria-hidden="true" />
              <p className="mt-3 mb-0">Loading gallery…</p>
            </div>
          ) : filteredMedia.length > 0 ? (
            <div className="gal-masonry">
              {filteredMedia.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`gal-card${item.tall ? " gal-card--tall" : ""}`}
                  onClick={() => openLightbox(index)}
                  aria-label={`View ${item.title}`}
                >
                  <img src={item.src} alt={item.title} loading="lazy" />
                  <div className="gal-card-overlay">
                    <span className="gal-card-category">{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>
                      <i className="bi bi-geo-alt"></i> {item.location}
                    </p>
                    <span className="gal-card-zoom">
                      <i className="bi bi-zoom-in"></i>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="gal-empty">
              <i className="bi bi-images"></i>
              <h4>No photos in this category</h4>
              <p>Try another filter or browse all images.</p>
              <button type="button" className="gal-pill active" onClick={() => setActiveCategory("all")}>
                Show all
              </button>
            </div>
          )}
        </Container>
      </section>

      <section className="gal-cta-section">
        <div className="gal-cta-overlay" />
        <Container>
          <Row>
            <Col md={12} className="text-center">
              <h2>Ready to create your own Rwanda story?</h2>
              <p>Let these moments inspire your next gorilla trek, safari, or lakeside escape.</p>
              <div className="gal-cta-buttons">
                <Link to="/packages" className="primaryBtn">
                  View Packages
                </Link>
                <Link to="/book" className="gal-cta-outline">
                  Plan Your Trip
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Modal
        show={lightboxIndex != null}
        onHide={closeLightbox}
        centered
        size="lg"
        className="gal-lightbox-modal"
        dialogClassName="gal-lightbox-dialog"
      >
        {lightboxItem && (
          <>
            <Modal.Body className="p-0">
              <div className="gal-lightbox-img-wrap">
                <img src={lightboxItem.src} alt={lightboxItem.title} />
                <button type="button" className="gal-lightbox-close" onClick={closeLightbox} aria-label="Close">
                  <i className="bi bi-x-lg"></i>
                </button>
                <button type="button" className="gal-lightbox-nav gal-lightbox-prev" onClick={goPrev} aria-label="Previous">
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button type="button" className="gal-lightbox-nav gal-lightbox-next" onClick={goNext} aria-label="Next">
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
              <div className="gal-lightbox-caption">
                <h4>{lightboxItem.title}</h4>
                <p>
                  <i className="bi bi-geo-alt"></i> {lightboxItem.location}
                </p>
              </div>
            </Modal.Body>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Gallery;
