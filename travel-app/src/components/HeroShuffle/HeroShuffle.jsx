import React, { useState, useEffect, useRef, useCallback } from "react";
import { NavLink } from "react-router-dom";
import heroSlide1 from "../../assets/images/slider/1.png";
import heroSlide2 from "../../assets/images/slider/2.png";
import heroSlide3 from "../../assets/images/slider/3.png";
import heroSlide4 from "../../assets/images/gallery/g5.jpg";
import "./hero-shuffle.css";

const DEFAULT_SLIDES = [
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

const ANIM_MS = 900;
const AUTO_MS = 7000;

const HeroShuffle = ({ slides }) => {
  const resolvedSlides = slides?.length ? slides : DEFAULT_SLIDES;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyer, setFlyer] = useState(null);
  const [textVisible, setTextVisible] = useState(true);

  const heroRef = useRef(null);
  const cardRefs = useRef([]);
  const animTimer = useRef(null);

  const total = resolvedSlides.length;
  const current = resolvedSlides[activeIndex] || resolvedSlides[0];

  const goToSlide = useCallback(
    (index) => {
      if (index === activeIndex || isAnimating || !resolvedSlides[index]) return;

      const cardEl = cardRefs.current[index];
      const heroEl = heroRef.current;

      if (!cardEl || !heroEl) {
        setActiveIndex(index);
        return;
      }

      const cardRect = cardEl.getBoundingClientRect();
      const heroRect = heroEl.getBoundingClientRect();

      setIsAnimating(true);
      setTextVisible(false);

      setFlyer({
        image: resolvedSlides[index].image,
        start: {
          top: cardRect.top - heroRect.top,
          left: cardRect.left - heroRect.left,
          width: cardRect.width,
          height: cardRect.height,
          borderRadius: 16,
        },
        expanded: false,
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setFlyer((f) => (f ? { ...f, expanded: true } : null));
        });
      });

      clearTimeout(animTimer.current);
      animTimer.current = setTimeout(() => {
        setActiveIndex(index);
        setFlyer(null);
        setIsAnimating(false);
        setTimeout(() => setTextVisible(true), 80);
      }, ANIM_MS);
    },
    [activeIndex, isAnimating, resolvedSlides],
  );

  const goNext = useCallback(() => {
    goToSlide((activeIndex + 1) % total);
  }, [activeIndex, goToSlide, total]);

  const goPrev = useCallback(() => {
    goToSlide((activeIndex - 1 + total) % total);
  }, [activeIndex, goToSlide, total]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isAnimating) goNext();
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [goNext, isAnimating]);

  useEffect(() => () => clearTimeout(animTimer.current), []);

  useEffect(() => {
    resolvedSlides.forEach((slide) => {
      if (!slide?.image) return;
      const img = new Image();
      img.decoding = "async";
      img.src = slide.image;
    });
  }, [resolvedSlides]);

  const progress = ((activeIndex + 1) / total) * 100;

  return (
    <section className="globe-hero" ref={heroRef}>
      <div className={`globe-hero-bg ${isAnimating ? "globe-hero-bg--dim" : ""}`}>
        {resolvedSlides.map((slide, i) => (
          <img
            key={slide.id ?? i}
            src={slide.image}
            alt=""
            aria-hidden="true"
            className={`globe-hero-bg-img ${i === activeIndex ? "globe-hero-bg-img--active" : ""}`}
            decoding="async"
            fetchPriority={i === activeIndex ? "high" : "auto"}
            draggable={false}
          />
        ))}
      </div>

      <div className="globe-hero-overlay" />

      {flyer && (
        <div
          className={`globe-shuffle-flyer ${flyer.expanded ? "globe-shuffle-flyer--expand" : ""}`}
          style={{
            top: flyer.start.top,
            left: flyer.start.left,
            width: flyer.start.width,
            height: flyer.start.height,
            borderRadius: flyer.start.borderRadius,
          }}
        >
          <img src={flyer.image} alt="" aria-hidden="true" draggable={false} />
        </div>
      )}

      <div className="globe-hero-inner">
        <div className={`globe-hero-left ${textVisible ? "globe-hero-left--visible" : ""}`}>
          <div className="globe-hero-line" />
          <span className="globe-region">{current.region}</span>
          <h1 className="globe-title">{current.title}</h1>
          <p className="globe-desc">{current.description}</p>
          <div className="globe-actions">
            <button type="button" className="globe-bookmark" aria-label="Save destination">
              <i className="bi bi-bookmark-fill"></i>
            </button>
            <NavLink to={current.link || "/destinations"} className="globe-discover-btn">
              Discover Location
            </NavLink>
          </div>
        </div>

        <div className="globe-hero-cards">
          {resolvedSlides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`globe-card ${i === activeIndex ? "globe-card--active" : ""} ${isAnimating && i !== activeIndex ? "globe-card--idle" : ""}`}
              onClick={() => goToSlide(i)}
              aria-label={`View ${slide.cardTitle}`}
              aria-current={i === activeIndex ? "true" : undefined}
            >
              <img src={slide.image} alt={slide.cardTitle} loading="eager" decoding="async" draggable={false} />
              <div className="globe-card-label">
                <strong>{slide.cardTitle}</strong>
                <span>{slide.cardSubtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="globe-hero-controls">
        <button type="button" className="globe-nav-btn" onClick={goPrev} aria-label="Previous">
          <i className="bi bi-arrow-left"></i>
        </button>
        <button type="button" className="globe-nav-btn" onClick={goNext} aria-label="Next">
          <i className="bi bi-arrow-right"></i>
        </button>
        <div className="globe-progress">
          <div className="globe-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="globe-slide-num">{String(activeIndex + 1).padStart(2, "0")}</span>
      </div>
    </section>
  );
};

export default HeroShuffle;
