import React, { useState, useEffect, useMemo } from "react";
import { Container, Spinner, Form, Button } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./blog.css";
import { fetchJson } from "../../utils/backendApi";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { whatsappHref } from "../../utils/contentValidation";
import {
  inferBlogCategory,
  mapCmsBlogPost,
  postPath,
} from "./blogUtils";

const POSTS_PER_PAGE = 3;

const Blog = () => {
  const { settings } = useSiteSettings();
  const whatsapp = settings.whatsapp || DEFAULT_SITE_SETTINGS.whatsapp;
  const [activeCategory, setActiveCategory] = useState("all");
  const [page, setPage] = useState(1);

  const [cmsPosts, setCmsPosts] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState("");

  const categories = useMemo(() => {
    const all = { id: "all", name: "All", count: cmsPosts.length };
    const fromApi = (apiCategories || []).map((c) => {
      const id = inferBlogCategory(`${c.slug || ""} ${c.name || ""}`);
      return {
        id,
        name: c.name || c.slug,
        count: cmsPosts.filter((p) => p.category === id).length,
      };
    });
    const seen = new Set();
    const unique = fromApi.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    return [all, ...unique];
  }, [apiCategories, cmsPosts]);

  useEffect(() => {
    let cancelled = false;
    const defaultAuthor = {
      name: "Editorial team",
      role: "Rwanda travel desk",
      photo: require("../../assets/images/about/aboutimg.png"),
      experience: "",
    };
    const defaultCover = require("../../assets/images/gallery/g1.jpg");

    (async () => {
      try {
        const [posts, cats] = await Promise.all([
          fetchJson("/api/blog/posts"),
          fetchJson("/api/blog/categories"),
        ]);
        if (cancelled) return;
        const catById = Object.fromEntries((cats || []).map((c) => [c.id, c]));
        const published = (posts || []).filter((p) => p.published);
        setApiCategories(Array.isArray(cats) ? cats : []);
        setCmsPosts(
          published.map((p) => mapCmsBlogPost(p, catById, defaultAuthor, defaultCover)),
        );
      } catch {
        setCmsPosts([]);
        setApiCategories([]);
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!trimmed) return;
    setNewsletterSubmitting(true);
    setNewsletterMsg("");
    try {
      await fetchJson("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "blog" }),
      });
      setNewsletterEmail("");
      setNewsletterMsg("Subscribed! You'll get alerts for new packages, car rentals, and blog posts.");
    } catch {
      setNewsletterMsg("Could not subscribe. Please try again.");
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  const sortedPosts = useMemo(() => {
    return [...cmsPosts].sort((a, b) => {
      const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return db - da;
    });
  }, [cmsPosts]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") return sortedPosts;
    return sortedPosts.filter((post) => post.category === activeCategory);
  }, [sortedPosts, activeCategory]);

  const featuredPost = filteredPosts[0] || null;
  const latestPosts = filteredPosts.slice(1, 5);

  const gridPosts = useMemo(() => {
    if (filteredPosts.length <= 1) return [];
    return filteredPosts.slice(1);
  }, [filteredPosts]);

  const totalPages = Math.max(1, Math.ceil(gridPosts.length / POSTS_PER_PAGE) || 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedPosts = gridPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );

  const pageNumbers = useMemo(() => {
    const maxShown = 5;
    if (totalPages <= maxShown) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, currentPage - 2);
    let end = start + maxShown - 1;
    if (end > totalPages) {
      end = totalPages;
      start = end - maxShown + 1;
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  return (
    <div className="blog-page essos-blog">
      <div className="essos-shell">
        {postsLoading ? (
          <div className="essos-loading">
            <Spinner animation="border" role="status" />
            <p>Loading blog posts…</p>
          </div>
        ) : null}

        {!postsLoading && filteredPosts.length === 0 ? (
          <div className="essos-empty">
            <h2>No articles yet</h2>
            <p>New Rwanda travel stories will appear here soon.</p>
            <Button as={NavLink} to="/packages" className="essos-btn">
              Browse packages
            </Button>
          </div>
        ) : null}

        {!postsLoading && featuredPost ? (
          <>
            <section className="essos-top">
              <NavLink to={postPath(featuredPost)} className="essos-featured">
                <img
                  src={featuredPost.featuredImage}
                  alt={featuredPost.title}
                  className="essos-featured__img"
                />
                <div className="essos-featured__glass">
                  <span className="essos-cat">
                    <i className="essos-cat__dot" aria-hidden="true" />
                    {featuredPost.categoryName || "Category"}
                  </span>
                  <h1 className="essos-featured__title">{featuredPost.title}</h1>
                  <p className="essos-meta">
                    {featuredPost.publishedShort || featuredPost.publishedDate}
                    {" • "}
                    {featuredPost.readingTime}
                  </p>
                </div>
              </NavLink>

              <aside className="essos-latest">
                <h2 className="essos-latest__heading">Latest post</h2>
                {latestPosts.length > 0 ? (
                  <ul className="essos-latest__list">
                    {latestPosts.map((post) => (
                      <li key={post.id}>
                        <NavLink to={postPath(post)} className="essos-latest__item">
                          <img
                            src={post.featuredImage}
                            alt=""
                            className="essos-latest__thumb"
                          />
                          <div className="essos-latest__body">
                            <h3>{post.title}</h3>
                            <p className="essos-meta">
                              {post.publishedShort || post.publishedDate}
                              {" • "}
                              {post.readingTime}
                            </p>
                          </div>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="essos-latest__empty">More stories coming soon.</p>
                )}
              </aside>
            </section>

            <div className="essos-cats" role="tablist" aria-label="Blog categories">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  className={`essos-cats__btn ${activeCategory === cat.id ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.name}
                  <span>({cat.count})</span>
                </button>
              ))}
            </div>

            {paginatedPosts.length > 0 ? (
              <section className="essos-corner">
                <div className="essos-corner__head">
                  <h2>Travel stories</h2>
                  <div className="essos-corner__nav">
                    <button
                      type="button"
                      className="essos-arrow"
                      aria-label="Previous stories"
                      disabled={currentPage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <i className="bi bi-arrow-left" />
                    </button>
                    <button
                      type="button"
                      className="essos-arrow"
                      aria-label="Next stories"
                      disabled={currentPage >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      <i className="bi bi-arrow-right" />
                    </button>
                  </div>
                </div>

                <div className="essos-corner__grid">
                  {paginatedPosts.map((post) => (
                    <NavLink
                      key={post.id}
                      to={postPath(post)}
                      className="essos-card"
                    >
                      <img
                        src={post.featuredImage}
                        alt=""
                        className="essos-card__img"
                      />
                      <span className="essos-cat">
                        <i className="essos-cat__dot" aria-hidden="true" />
                        {post.categoryName || "Category"}
                      </span>
                      <h3 className="essos-card__title">{post.title}</h3>
                      <p className="essos-card__excerpt">{post.excerpt}</p>
                      <p className="essos-meta">
                        {post.publishedShort || post.publishedDate}
                        {" • "}
                        {post.readingTime}
                      </p>
                    </NavLink>
                  ))}
                </div>
              </section>
            ) : null}

            {gridPosts.length > POSTS_PER_PAGE ? (
              <nav className="essos-pagination" aria-label="Blog pagination">
                <button
                  type="button"
                  className="essos-page-arrow"
                  aria-label="Previous page"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <i className="bi bi-chevron-left" />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`essos-page-num ${n === currentPage ? "is-active" : ""}`}
                    aria-current={n === currentPage ? "page" : undefined}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  className="essos-page-arrow"
                  aria-label="Next page"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </nav>
            ) : null}
          </>
        ) : null}
      </div>

      <section className="newsletter-section py-5">
        <Container>
          <div className="essos-newsletter">
            <h2>Stay updated</h2>
            <p>
              Subscribe for travel tips, gorilla permit updates, and exclusive Rwanda guides.
            </p>
            <Form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <Form.Control
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                disabled={newsletterSubmitting}
              />
              <Button className="essos-btn" type="submit" disabled={newsletterSubmitting}>
                {newsletterSubmitting ? "…" : "Subscribe"}
              </Button>
            </Form>
            {newsletterMsg ? (
              <p className="newsletter-note mt-2 mb-0" role="status">
                {newsletterMsg}
              </p>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="blog-cta py-5">
        <div className="cta-overlay" />
        <Container>
          <div className="text-center position-relative" style={{ zIndex: 2 }}>
            <h2 className="cta-title">Ready to Plan Your Rwanda Trip?</h2>
            <p className="cta-description">
              Let our expert guides help you create an unforgettable adventure
            </p>
            <div className="cta-buttons">
              <Button className="primaryBtn me-3" as={NavLink} to="/packages">
                Plan Your Rwanda Trip
              </Button>
              <a
                href={whatsappHref(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn"
              >
                <i className="bi bi-whatsapp" /> Talk to a Safari Expert
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Blog;
