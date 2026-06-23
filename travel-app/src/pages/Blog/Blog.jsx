import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  InputGroup,
  Spinner,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import "./blog.css";
import { fetchJson, resolveMediaUrl } from "../../utils/backendApi";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { whatsappHref } from "../../utils/contentValidation";

function inferBlogCategory(slugAndName) {
  const s = String(slugAndName || "").toLowerCase();
  if (s.includes("gorilla")) return "gorilla";
  if (s.includes("safari") || s.includes("wildlife")) return "safari";
  if (s.includes("culture") || s.includes("history")) return "culture";
  if (s.includes("news")) return "news";
  if (s.includes("hotel") || s.includes("lodge") || s.includes("review")) return "reviews";
  return "guide";
}

function mapCmsBlogPost(p, catById, defaultAuthor, defaultImg) {
  const cat = catById[p.categoryId] || {};
  const slug = (cat.slug || cat.name || "").toLowerCase();
  const category = inferBlogCategory(`${slug} ${cat.name || ""}`);
  const iso = p.updatedAt ? new Date(p.updatedAt) : new Date();
  const publishedDate = Number.isFinite(iso.getTime())
    ? iso.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "";
  const img = resolveMediaUrl(p.coverImageUrl) || defaultImg;
  const textLen = (p.excerpt || p.body || "").length;
  const readingMins = Math.min(99, Math.max(3, Math.ceil(textLen / 1200) || 8));
  return {
    id: `cms-${p.id}`,
    title: p.title,
    excerpt: (p.excerpt || "").slice(0, 400) || p.title,
    author: defaultAuthor,
    category,
    tags: ["#Rwanda", "#Travel"],
    destination: "Rwanda",
    season: "Year-round",
    readingTime: `${readingMins} min`,
    publishedDate,
    featuredImage: img,
    featured: true,
    evergreen: false,
    trending: false,
    views: 100,
    likes: 10,
    package: "Ask our team",
  };
}

const Blog = () => {
  const { settings } = useSiteSettings();
  const whatsapp = settings.whatsapp || DEFAULT_SITE_SETTINGS.whatsapp;
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterDestination, setFilterDestination] = useState("");
  const [filterSeason, setFilterSeason] = useState("");
  const [filterReadingTime, setFilterReadingTime] = useState("");

  const [cmsPosts, setCmsPosts] = useState([]);
  const [apiCategories, setApiCategories] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState("");

  const categories = useMemo(() => {
    const all = {
      id: "all",
      name: "All Posts",
      icon: "📝",
      count: cmsPosts.length,
    };
    const fromApi = (apiCategories || []).map((c) => {
      const id = inferBlogCategory(`${c.slug || ""} ${c.name || ""}`);
      return {
        id,
        name: c.name || c.slug,
        icon: "📝",
        count: cmsPosts.filter((p) => p.category === id).length,
      };
    });
    return [all, ...fromApi];
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

  const allBlogPosts = cmsPosts;

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

  // Filter blog posts
  const getFilteredPosts = () => {
    let filtered = allBlogPosts;

    // Category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter((post) => post.category === activeCategory);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(term) ||
          post.excerpt.toLowerCase().includes(term) ||
          post.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Destination filter
    if (filterDestination) {
      filtered = filtered.filter(
        (post) => post.destination === filterDestination
      );
    }

    // Season filter
    if (filterSeason) {
      filtered = filtered.filter((post) => post.season === filterSeason);
    }

    // Reading time filter
    if (filterReadingTime) {
      const time = parseInt(filterReadingTime);
      filtered = filtered.filter((post) => {
        const postTime = parseInt(post.readingTime);
        return postTime <= time;
      });
    }

    // Sort
    if (sortBy === "newest") {
      filtered = filtered.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
    } else if (sortBy === "popular") {
      filtered = filtered.sort((a, b) => b.views - a.views);
    } else if (sortBy === "trending") {
      filtered = filtered.filter((post) => post.trending);
    }

    return filtered;
  };

  const filteredPosts = getFilteredPosts();
  const featuredPosts = allBlogPosts.filter((post) => post.featured);

  const handleShare = (post, platform) => {
    const url = `https://rwandagorillatrekk.com/blog/${post.id}`;
    const text = post.title;
    
    let shareUrl = "";
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const copyLink = (post) => {
    const url = `https://rwandagorillatrekk.com/blog/${post.id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="hero-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
              <span className="blog-hero-label">Rwanda Travel Stories</span>
              <h1 className="blog-hero-title">
                <span className="blog-title-script">Explore</span>
                <span className="blog-title-bold">Latest News</span>
              </h1>
              <p className="hero-description">
                Expert insights, travel tips, and stories from Rwanda. Everything you need to plan your perfect gorilla trekking and safari adventure.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {postsLoading ? (
        <section className="py-5">
          <Container className="text-center py-5">
            <Spinner animation="border" variant="primary" role="status" />
            <p className="mt-3 text-muted mb-0">Loading blog posts…</p>
          </Container>
        </section>
      ) : null}

      {/* 6. Featured & Evergreen Content */}
      {!postsLoading && featuredPosts.length > 0 && (
        <section className="featured-posts py-5 bg-light">
          <Container>
            <Row>
              <Col md="12" className="mb-4 text-center">
                <h2 className="blog-section-title">
                  <span className="blog-title-script">Featured</span>
                  <span className="blog-title-bold">Articles</span>
                </h2>
                <p className="section-subtitle">
                  Essential reads for planning your Rwanda adventure
                </p>
              </Col>
            </Row>
            <Row>
              {featuredPosts.slice(0, 3).map((post) => (
                <Col md="4" sm="6" key={post.id} className="mb-4">
                  <Card className="featured-card">
                    <div className="card-image-container">
                      <Card.Img variant="top" src={post.featuredImage} />
                      <div className="card-badges">
                        {post.featured && (
                          <Badge className="badge-featured">Featured</Badge>
                        )}
                        {post.evergreen && (
                          <Badge className="badge-evergreen">Evergreen</Badge>
                        )}
                        {post.trending && (
                          <Badge className="badge-trending">Trending</Badge>
                        )}
                      </div>
                    </div>
                    <Card.Body>
                      <div className="post-meta">
                        <span className="post-date">
                          <i className="bi bi-calendar"></i> {post.publishedDate}
                        </span>
                        <span className="reading-time">
                          <i className="bi bi-clock"></i> {post.readingTime}
                        </span>
                      </div>
                      <Card.Title className="post-title">{post.title}</Card.Title>
                      <Card.Text className="post-excerpt">{post.excerpt}</Card.Text>
                      <div className="post-tags mb-3">
                        {post.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} className="tag-badge">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        as={NavLink}
                        to={`/blog/${post.id}`}
                      >
                        Read More
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {!postsLoading && (
      <>
      {/* 1. Smart Blog Categories & Tags */}
      <section className="blog-categories py-4">
        <Container>
          <Row>
            <Col md="12">
              <div className="category-tabs">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`category-tab ${activeCategory === cat.id ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span className="category-icon">{cat.icon}</span>
                    <span className="category-name">{cat.name}</span>
                    <span className="category-count">({cat.count})</span>
                  </button>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 2. Advanced Blog Search & Filters */}
      <section className="blog-filters py-4 bg-light">
        <Container>
          <Row>
            <Col md="12">
              <div className="filter-panel">
                <Row className="align-items-end">
                  <Col md="3" sm="6" className="mb-3">
                    <Form.Label>Search Blog</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="bi bi-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </Col>
                  <Col md="2" sm="6" className="mb-3">
                    <Form.Label>Destination</Form.Label>
                    <Form.Select
                      value={filterDestination}
                      onChange={(e) => setFilterDestination(e.target.value)}
                    >
                      <option value="">All Destinations</option>
                      <option value="Volcanoes National Park">Volcanoes NP</option>
                      <option value="Akagera National Park">Akagera NP</option>
                      <option value="Kigali">Kigali</option>
                      <option value="All Destinations">All Destinations</option>
                    </Form.Select>
                  </Col>
                  <Col md="2" sm="6" className="mb-3">
                    <Form.Label>Season</Form.Label>
                    <Form.Select
                      value={filterSeason}
                      onChange={(e) => setFilterSeason(e.target.value)}
                    >
                      <option value="">All Seasons</option>
                      <option value="Year-round">Year-round</option>
                      <option value="Dry Season">Dry Season</option>
                    </Form.Select>
                  </Col>
                  <Col md="2" sm="6" className="mb-3">
                    <Form.Label>Reading Time</Form.Label>
                    <Form.Select
                      value={filterReadingTime}
                      onChange={(e) => setFilterReadingTime(e.target.value)}
                    >
                      <option value="">Any Time</option>
                      <option value="5">5 min or less</option>
                      <option value="10">10 min or less</option>
                      <option value="15">15 min or less</option>
                    </Form.Select>
                  </Col>
                  <Col md="3" sm="6" className="mb-3">
                    <Form.Label>Sort By</Form.Label>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="popular">Most Popular</option>
                      <option value="trending">Trending</option>
                    </Form.Select>
                  </Col>
                </Row>
                {(searchTerm ||
                  filterDestination ||
                  filterSeason ||
                  filterReadingTime) && (
                  <Row>
                    <Col md="12" className="text-center">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterDestination("");
                          setFilterSeason("");
                          setFilterReadingTime("");
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </Col>
                  </Row>
                )}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Blog Posts Grid */}
      <section className="blog-posts py-5">
        <Container>
          <Row>
            <Col md="12" className="mb-4">
              <h2 className="blog-section-title">
                <span className="blog-title-script">All</span>
                <span className="blog-title-bold">Articles</span>
                <span className="blog-post-count">{filteredPosts.length} posts</span>
              </h2>
            </Col>
          </Row>
          <Row>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <Col md="6" lg="4" key={post.id} className="mb-4">
                  <Card className="blog-card">
                    <div className="card-image-container">
                      <Card.Img variant="top" src={post.featuredImage} />
                      <div className="card-badges">
                        {post.evergreen && (
                          <Badge className="badge-evergreen">Evergreen</Badge>
                        )}
                        {post.trending && (
                          <Badge className="badge-trending">Trending</Badge>
                        )}
                      </div>
                      <div className="reading-progress" style={{ width: "0%" }}></div>
                    </div>
                    <Card.Body>
                      <div className="post-meta">
                        <span className="post-date">
                          <i className="bi bi-calendar"></i> {post.publishedDate}
                        </span>
                        <span className="reading-time">
                          <i className="bi bi-clock"></i> {post.readingTime}
                        </span>
                      </div>
                      <Card.Title className="post-title">{post.title}</Card.Title>
                      <Card.Text className="post-excerpt">{post.excerpt}</Card.Text>

                      {/* 9. Author Profiles & Credibility */}
                      <div className="post-author mb-3">
                        <img
                          src={post.author.photo}
                          alt={post.author.name}
                          className="author-photo"
                        />
                        <div className="author-info">
                          <div className="author-name">{post.author.name}</div>
                          <div className="author-role">
                            {post.author.role}
                            {post.author.name === "Marie Uwimana" && (
                              <Badge className="badge-expert">Local Expert</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="post-tags mb-3">
                        {post.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} className="tag-badge">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="post-stats mb-3">
                        <span>
                          <i className="bi bi-eye"></i> {post.views} views
                        </span>
                        <span>
                          <i className="bi bi-heart"></i> {post.likes} likes
                        </span>
                      </div>

                      {/* 13. Social Sharing */}
                      <div className="post-sharing mb-3">
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleShare(post, "whatsapp")}
                          className="me-2"
                        >
                          <i className="bi bi-whatsapp"></i>
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShare(post, "facebook")}
                          className="me-2"
                        >
                          <i className="bi bi-facebook"></i>
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleShare(post, "twitter")}
                          className="me-2"
                        >
                          <i className="bi bi-twitter"></i>
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => copyLink(post)}
                        >
                          <i className="bi bi-link-45deg"></i>
                        </Button>
                      </div>

                      {/* 5. Destination & Package Linking */}
                      <div className="post-cta">
                        <Button
                          className="primaryBtn w-100 mb-2"
                          as={NavLink}
                          to={`/blog/${post.id}`}
                        >
                          Read Full Article
                        </Button>
                        {post.package && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="w-100"
                            as={NavLink}
                            to="/packages"
                          >
                            <i className="bi bi-briefcase"></i> Check {post.package} Package
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col md="12">
                <div className="no-results text-center py-5">
                  <i className="bi bi-file-text" style={{ fontSize: "48px" }}></i>
                  <h4>No articles found</h4>
                  <p>Try adjusting your filters or search term</p>
                </div>
              </Col>
            )}
          </Row>
        </Container>
      </section>

      </>
      )}

      {/* 12. Newsletter & Lead Capture */}
      <section className="newsletter-section py-5 bg-light">
        <Container>
          <Row>
            <Col md="8" className="mx-auto text-center">
              <h2 className="blog-section-title">
                <span className="blog-title-script">Stay</span>
                <span className="blog-title-bold">Updated</span>
              </h2>
              <p className="section-subtitle">
                Subscribe to our newsletter for travel tips, gorilla permit updates, and exclusive Rwanda travel guides.
              </p>
              <Form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <Row>
                  <Col md="8" className="mb-3 mb-md-0">
                    <Form.Control
                      type="email"
                      placeholder="Enter your email address"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                      disabled={newsletterSubmitting}
                    />
                  </Col>
                  <Col md="4">
                    <Button className="primaryBtn w-100" type="submit" disabled={newsletterSubmitting}>
                      {newsletterSubmitting ? "…" : "Subscribe Now"}
                    </Button>
                  </Col>
                </Row>
              </Form>
              {newsletterMsg ? (
                <p className="newsletter-note mt-2 mb-0" role="status">
                  {newsletterMsg}
                </p>
              ) : null}
              <p className="newsletter-note">
                <i className="bi bi-shield-check"></i> We respect your privacy. Unsubscribe at any time.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 18. Strong Call-To-Action */}
      <section className="blog-cta py-5">
        <div className="cta-overlay"></div>
        <Container>
          <Row>
            <Col md="12" className="text-center">
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
                  className="whatsapp-btn me-3"
                >
                  <i className="bi bi-whatsapp"></i> Talk to a Safari Expert
                </a>
                <Button
                  variant="outline-light"
                  className="me-3"
                  as={NavLink}
                  to="/packages"
                >
                  View Tour Packages
                </Button>
                <Button
                  variant="outline-light"
                  as={NavLink}
                  to="/contact"
                >
                  Request Custom Tour
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Sticky CTA Button (Mobile) */}
      <div className="sticky-cta-btn">
        <Button className="primaryBtn" as={NavLink} to="/packages">
          <i className="bi bi-calendar-check"></i> Plan Your Trip
        </Button>
      </div>
    </div>
  );
};

export default Blog;
