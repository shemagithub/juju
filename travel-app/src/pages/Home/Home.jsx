import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./home.css";
import HeroShuffle from "../../components/HeroShuffle/HeroShuffle";
import { fetchJson, resolveMediaUrl } from "../../utils/backendApi";
import {
  isDisplayableName,
  phoneHref,
} from "../../utils/contentValidation";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";

import heroBg from "../../assets/images/slider/1.png";
import heroSlide1 from "../../assets/images/slider/1.png";
import heroSlide2 from "../../assets/images/slider/2.png";
import heroSlide3 from "../../assets/images/slider/3.png";
import heroSlide4 from "../../assets/images/gallery/g5.jpg";
import blogImgA from "../../assets/images/tour/paris.png";
import blogImgB from "../../assets/images/tour/phuket.png";
import blogImgC from "../../assets/images/tour/bali-1.png";
import rwandaFallbackShot from "../../assets/images/slider/1.jpg";
import dest1 from "../../assets/images/tour/bali-1.png";
import dest2 from "../../assets/images/tour/bangkok.png";
import dest3 from "../../assets/images/tour/cancun.png";
import dest4 from "../../assets/images/tour/malaysia.png";

const BOOKING_STEPS = [
  { num: 1, icon: "bi-geo-alt", title: "Choose Your Destination", text: "Browse our curated Rwanda tours — from gorilla trekking to Big Five safaris." },
  { num: 2, icon: "bi-credit-card", title: "Make Your Payment", text: "Secure online booking with flexible payment options and instant confirmation." },
  { num: 3, icon: "bi-airplane", title: "Enjoy Your Trip", text: "Experience life-changing adventures with expert local guides by your side." },
];

const TRENDING_FEATURES = [
  { icon: "bi-headset", text: "24/7 Customer Support" },
  { icon: "bi-person-badge", text: "Professional Tour Guides" },
  { icon: "bi-shield-check", text: "Best Price Guarantee" },
  { icon: "bi-star", text: "Top Rated Experiences" },
  { icon: "bi-globe", text: "Rwanda Destinations" },
];

const WHY_CHOOSE = [
  { icon: "bi-award", title: "Best Travel Agency", text: "Award-winning Rwanda tour operator" },
  { icon: "bi-cash-stack", title: "Competitive Pricing", text: "Best value for unforgettable experiences" },
  { icon: "bi-shield-check", title: "Safety First", text: "Licensed guides and secure bookings" },
  { icon: "bi-heart", title: "Customer Satisfaction", text: "4.9/5 rating from 1,000+ travelers" },
];

const GALLERY_DESTINATIONS = [
  { name: "Volcanoes NP", image: heroSlide1, tours: "12 Tours" },
  { name: "Akagera Safari", image: heroSlide2, tours: "8 Tours" },
  { name: "Nyungwe Forest", image: heroSlide3, tours: "6 Tours" },
  { name: "Lake Kivu", image: heroSlide4, tours: "5 Tours" },
];

const HERO_SLIDES_FALLBACK = [
  {
    id: 1,
    region: "Northern Province",
    title: "VOLCANOES NATIONAL PARK",
    description:
      "Trek through misty bamboo forests to meet mountain gorillas in their natural habitat — one of Africa's most profound wildlife encounters.",
    image: heroSlide1,
    cardTitle: "VOLCANOES NP",
    cardSubtitle: "Rwanda — Gorillas",
    link: "/destinations",
  },
  {
    id: 2,
    region: "Eastern Province",
    title: "AKAGERA NATIONAL PARK",
    description:
      "Experience Big Five safaris across rolling savannas, boat cruises on Lake Ihema, and unforgettable sunsets over the African plains.",
    image: heroSlide2,
    cardTitle: "AKAGERA SAFARI",
    cardSubtitle: "Rwanda — Wildlife",
    link: "/destinations",
  },
  {
    id: 3,
    region: "Southwestern Rwanda",
    title: "NYUNGWE FOREST",
    description:
      "Walk Africa's longest canopy bridge, track chimpanzees through ancient rainforest, and discover waterfalls hidden in the mist.",
    image: heroSlide3,
    cardTitle: "NYUNGWE FOREST",
    cardSubtitle: "Rwanda — Canopy",
    link: "/destinations",
  },
  {
    id: 4,
    region: "Western Rwanda",
    title: "LAKE KIVU",
    description:
      "Relax on serene lakeside shores, explore coffee plantations, and unwind between mountain adventures in Rwanda's largest lake.",
    image: heroSlide4,
    cardTitle: "LAKE KIVU",
    cardSubtitle: "Rwanda — Lakeside",
    link: "/destinations",
  },
];

function mapHeroSlideFromApi(slide, i) {
  const fallbackImg = [heroSlide1, heroSlide2, heroSlide3, heroSlide4][i % 4];
  const img = resolveMediaUrl(slide.imageUrl) || fallbackImg;
  return {
    id: slide.id || i,
    region: slide.region || "Rwanda",
    title: slide.title || "",
    description: slide.description || "",
    image: img,
    cardTitle: slide.cardTitle || slide.title || "",
    cardSubtitle: slide.cardSubtitle || "Rwanda — Adventure",
    link: slide.link || "/destinations",
  };
}

function mapDestinationsSlider(destinations) {
  return destinations
    .filter((d) => isDisplayableName(d?.name))
    .map((d) => {
    const first = Array.isArray(d.imageUrls) && d.imageUrls.length ? resolveMediaUrl(d.imageUrls[0]) : "";
    const nPkgs = Array.isArray(d.linkedPackageIds) ? d.linkedPackageIds.length : 0;
    return { id: d.id, name: d.name, tours: `${nPkgs} package${nPkgs === 1 ? "" : "s"}`, image: first || dest1 };
  });
}

const Home = () => {
  const { settings } = useSiteSettings();
  const contactPhone = settings.contactPhone || DEFAULT_SITE_SETTINGS.contactPhone;
  const workingHours = settings.workingHours || DEFAULT_SITE_SETTINGS.workingHours;
  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const logoUrl = resolveMediaUrl(settings.logoUrl || "");

  const [sliderDestinations, setSliderDestinations] = useState([]);
  const [heroSlides, setHeroSlides] = useState(HERO_SLIDES_FALLBACK);
  const [testimonials, setTestimonials] = useState([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [rwandaShots, setRwandaShots] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [dests, posts, reviews, heroRows, galleryRows] = await Promise.all([
          fetchJson("/api/destinations"),
          fetchJson("/api/blog/posts"),
          fetchJson("/api/reviews?public=true"),
          fetchJson("/api/hero-slides?public=true").catch(() => []),
          fetchJson("/api/gallery").catch(() => []),
        ]);
        if (cancelled) return;

        const shots = (Array.isArray(galleryRows) ? galleryRows : [])
          .filter((g) => (g.type || "image") === "image")
          .map((g) => resolveMediaUrl(g.url))
          .filter(Boolean);
        setRwandaShots(shots);
        if (Array.isArray(heroRows) && heroRows.length > 0) {
          setHeroSlides(heroRows.map(mapHeroSlideFromApi));
        } else {
          setHeroSlides(HERO_SLIDES_FALLBACK);
        }
        if (Array.isArray(dests) && dests.length > 0) {
          setSliderDestinations(mapDestinationsSlider(dests).slice(0, 4));
        }
        if (Array.isArray(posts) && posts.length > 0) {
          const published = posts
            .filter((p) => p && p.published !== false && isDisplayableName(p.title, 4))
            .slice(0, 3);
          setBlogPosts(published.map((p, idx) => ({
            id: p.id,
            slug: (p.slug || "").trim() || `cms-${p.id}`,
            title: p.title,
            date: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recent",
            image: resolveMediaUrl(p.coverImageUrl) || [blogImgA, blogImgB, blogImgC][idx % 3],
          })));
        }
        if (Array.isArray(reviews) && reviews.length > 0) {
          const ok = reviews.slice(0, 6);
          setTestimonials(ok.map((r, i) => ({
            id: r.id,
            name: r.authorName || "Verified Traveler",
            role: r.authorCountry || `${r.rating || 5}-Star Review`,
            text: (r.comment || "").slice(0, 200),
            image:
              resolveMediaUrl(r.photoUrl) ||
              shots[i % shots.length] ||
              rwandaFallbackShot,
            rating: r.rating || 5,
          })));
        }
      } catch { /* empty sections */ }
      finally {
        if (!cancelled) setContentLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const socialProofShots = useMemo(() => {
    const picks = rwandaShots.slice(0, 3);
    while (picks.length < 3) picks.push(rwandaFallbackShot);
    return picks;
  }, [rwandaShots]);

  const trendingMarqueeItems = useMemo(() => {
    const list = sliderDestinations.length ? sliderDestinations : GALLERY_DESTINATIONS;
    return [...list, ...list];
  }, [sliderDestinations]);
  const trendingMarqueeDuration = useMemo(() => {
    const count = sliderDestinations.length || GALLERY_DESTINATIONS.length;
    return `${Math.max(24, count * 10)}s`;
  }, [sliderDestinations.length]);

  const handleContact = async (e) => {
    e.preventDefault();
    try {
      await fetchJson("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "home-contact",
          name: contactForm.name,
          email: contactForm.email,
          subject: "Home Page Inquiry",
          body: [
            contactForm.phone && `Phone: ${contactForm.phone}`,
            "",
            contactForm.message,
          ].filter(Boolean).join("\n"),
        }),
      });
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      /* keep form data on error */
    }
  };

  const current = testimonials.length
    ? testimonials[activeTestimonial] ?? testimonials[0]
    : null;

  return (
    <div className="home-page">
      <HeroShuffle slides={heroSlides} />

      {/* Easy Steps */}
      <section className="booking-steps section-padding">
        <Container>
          <div className="text-center mb-5">
            <span className="section-label">How It Works</span>
            <h2 className="section-title">Easy Steps For Bookings</h2>
          </div>
          <Row>
            {BOOKING_STEPS.map((step) => (
              <Col md={4} key={step.num} className="mb-4">
                <div className="step-card">
                  <div className="step-icon-wrap">
                    <span className="step-num">{step.num}</span>
                    <i className={`bi ${step.icon}`}></i>
                  </div>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
        <div className="tours-banner">
          <Container>
            <Row className="align-items-center">
              <Col md={8}>
                <h3>Curated Rwanda Tours &amp; Safari Packages</h3>
              </Col>
              <Col md={4} className="text-md-end mt-3 mt-md-0">
                <NavLink to="/packages" className="tealBtn">Discover More</NavLink>
              </Col>
            </Row>
          </Container>
        </div>
      </section>

      {/* Trending Destination */}
      <section className="trending-section section-padding bg-light">
        <Container>
          <Row className="align-items-center mb-5">
            <Col lg={5}>
              <span className="section-label">Popular</span>
              <h2 className="section-title">Trending Destination</h2>
              <ul className="trending-features">
                {TRENDING_FEATURES.map((f, i) => (
                  <li key={i}><i className={`bi ${f.icon}`}></i> {f.text}</li>
                ))}
              </ul>
              <NavLink to="/destinations" className="primaryBtn mt-3">Explore All</NavLink>
            </Col>
            <Col lg={7}>
              <div className="section-logo-panel trending-logo-panel torn-paper">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="section-logo-img site-brand-logo-img brand-logo-transparent"
                  />
                ) : (
                  <span className="section-logo-fallback">{brandName}</span>
                )}
              </div>
            </Col>
          </Row>
          {contentLoading ? (
            <p className="text-center text-muted py-4">Loading destinations…</p>
          ) : (
            <div className="dest-marquee-viewport" aria-label="Trending destinations carousel">
              <div
                className="dest-marquee-track"
                style={{ "--dest-marquee-duration": trendingMarqueeDuration }}
              >
                {trendingMarqueeItems.map((dest, idx) => (
                  <div
                    key={`${dest.id || dest.name}-${idx}`}
                    className="dest-marquee-slide"
                    aria-hidden={
                      idx >= (sliderDestinations.length || GALLERY_DESTINATIONS.length)
                    }
                  >
                    <div className="dest-thumb">
                      <img src={dest.image || dest1} alt={dest.name} />
                      <div className="dest-thumb-info">
                        <h5>{dest.name}</h5>
                        <span>{dest.tours || "Multiple tours"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Recommend Destinations */}
      <section className="recommend-section section-padding">
        <Container>
          <Row className="align-items-center">
            <Col lg={7}>
              <div className="section-logo-panel recommend-logo-panel torn-paper">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="section-logo-img site-brand-logo-img brand-logo-transparent"
                  />
                ) : (
                  <span className="section-logo-fallback">{brandName}</span>
                )}
              </div>
            </Col>
            <Col lg={5} className="mt-5 mt-lg-0">
              <span className="section-label">Recommendations</span>
              <h2 className="section-title">We Recommend Beautiful Destinations</h2>
              <p className="recommend-text">
                With 25 years of experience, we craft personalized journeys through Rwanda's most breathtaking landscapes — from misty mountain gorillas to golden savannas.
              </p>
              <div className="experience-badge">
                <span className="exp-num">25</span>
                <span className="exp-text">Years of<br />Experience</span>
              </div>
              <NavLink to="/destinations" className="primaryBtn mt-4">Discover More</NavLink>
              <div className="social-proof mt-4">
                <div className="avatar-stack">
                  {socialProofShots.map((img, i) => (
                    <img key={i} src={img} alt="Rwanda tour highlight" />
                  ))}
                </div>
                <span>1,000+ happy travelers</span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Second Steps Section */}
      <section className="steps-section section-padding bg-light">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <span className="section-label">Book Your Trip</span>
              <h2 className="section-title">3 Easy Steps for Book Your Next Trip</h2>
              <div className="steps-list">
                {BOOKING_STEPS.map((step) => (
                  <div key={step.num} className="step-item">
                    <span className="step-badge">{step.num}</span>
                    <div>
                      <h5>{step.title}</h5>
                      <p>{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
            <Col lg={6} className="position-relative">
              <div className="section-logo-panel steps-logo-panel torn-paper">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="section-logo-img site-brand-logo-img brand-logo-transparent"
                  />
                ) : (
                  <span className="section-logo-fallback">{brandName}</span>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Choose Us + Call Us */}
      <section className="why-section">
        <div className="why-wave-top"></div>
        <Container className="why-content">
          <Row>
            <Col lg={7}>
              <h2 className="section-title light mb-5">Why Choose Us</h2>
              <Row>
                {WHY_CHOOSE.map((item) => (
                  <Col sm={6} key={item.title} className="mb-4">
                    <div className="why-item">
                      <div className="why-icon"><i className={`bi ${item.icon}`}></i></div>
                      <h5>{item.title}</h5>
                      <p>{item.text}</p>
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
            <Col lg={5} className="d-flex align-items-center justify-content-center">
              <div className="call-us-box">
                <span className="call-label">CALL US</span>
                <a href={phoneHref(contactPhone)} className="call-number">{contactPhone}</a>
                <p>{workingHours}</p>
                <NavLink to="/contact" className="primaryBtn">Contact Us</NavLink>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {current && (
        <section className="testimonial-section section-padding">
          <Container>
            <h2 className="testimonial-heading">TESTIMONIAL</h2>
            <Row className="align-items-center">
              <Col lg={8}>
                <div className="testimonial-card">
                  <Row>
                    <Col md={5}>
                      <img src={current.image} alt={current.name} className="testimonial-photo" />
                    </Col>
                    <Col md={7} className="d-flex flex-column justify-content-center">
                      <div className="stars">
                        {[...Array(current.rating || 5)].map((_, i) => (
                          <i key={i} className="bi bi-star-fill"></i>
                        ))}
                      </div>
                      <p className="testimonial-quote">"{current.text}"</p>
                      <h5 className="testimonial-name">{current.name}</h5>
                      <span className="testimonial-role">{current.role}</span>
                    </Col>
                  </Row>
                </div>
              </Col>
              <Col lg={4} className="mt-4 mt-lg-0">
                <div className="testimonial-avatars">
                  {testimonials.map((t, i) => (
                    <button
                      key={t.id}
                      className={`avatar-btn ${i === activeTestimonial ? "active" : ""}`}
                      onClick={() => setActiveTestimonial(i)}
                    >
                      <img src={t.image} alt={t.name} />
                    </button>
                  ))}
                </div>
              </Col>
            </Row>
          </Container>
        </section>
      )}

      {/* Contact — company logo + message form */}
      <section className="contact-section section-padding bg-light">
        <Container>
          <Row className="align-items-stretch">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="section-logo-panel contact-logo-panel torn-paper">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brandName}
                    className="section-logo-img site-brand-logo-img brand-logo-transparent"
                  />
                ) : (
                  <span className="section-logo-fallback">{brandName}</span>
                )}
                <div className="contact-greeting">
                  <h3>Hi there!</h3>
                  <p>What can I do for you today?</p>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="contact-form-wrap">
                <span className="section-label">Get In Touch</span>
                <h2 className="section-title">Send Us a Message</h2>
                <Form onSubmit={handleContact}>
                  <Row>
                    <Col sm={6} className="mb-3">
                      <Form.Control placeholder="Your Name" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} required />
                    </Col>
                    <Col sm={6} className="mb-3">
                      <Form.Control type="email" placeholder="Email Address" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} required />
                    </Col>
                    <Col sm={12} className="mb-3">
                      <Form.Control placeholder="Phone Number" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
                    </Col>
                    <Col sm={12} className="mb-3">
                      <Form.Control as="textarea" rows={4} placeholder="Your Message" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} required />
                    </Col>
                    <Col sm={12}>
                      <Button type="submit" className="primaryBtn">Send Message</Button>
                    </Col>
                  </Row>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Blog */}
      {blogPosts.length > 0 && (
      <section className="blog-section section-padding">
        <Container>
          <div className="text-center mb-5">
            <span className="section-label">Latest News</span>
            <h2 className="section-title">Explore Latest News</h2>
          </div>
          <Row className={blogPosts.length < 3 ? "justify-content-center" : ""}>
            {blogPosts.map((post) => (
              <Col md={4} key={post.id} className="mb-4">
                <div className="blog-card">
                  <div className="blog-image">
                    <img src={post.image} alt={post.title} />
                    <span className="blog-date">{post.date}</span>
                  </div>
                  <div className="blog-body">
                    <h4>{post.title}</h4>
                    <NavLink to={`/blog/${encodeURIComponent(post.slug || `cms-${post.id}`)}`} className="read-more">Read More <i className="bi bi-arrow-right"></i></NavLink>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      )}

    </div>
  );
};

export default Home;
