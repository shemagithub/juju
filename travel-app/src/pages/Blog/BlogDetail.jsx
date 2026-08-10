import React, { useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "react-bootstrap";
import { NavLink, useParams } from "react-router-dom";
import "./blog.css";
import { fetchJson } from "../../utils/backendApi";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import { whatsappHref } from "../../utils/contentValidation";
import {
  findPostByParam,
  formatBodyParagraphs,
  mapCmsBlogPost,
  postPath,
} from "./blogUtils";

const BlogDetail = () => {
  const { id: param } = useParams();
  const { settings } = useSiteSettings();
  const whatsapp = settings.whatsapp || DEFAULT_SITE_SETTINGS.whatsapp;
  const brand = settings.brandName || DEFAULT_SITE_SETTINGS.brandName || "Rwanda Gorilla Trekk";

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const [rawPosts, cats] = await Promise.all([
          fetchJson("/api/blog/posts"),
          fetchJson("/api/blog/categories"),
        ]);
        if (cancelled) return;
        const catById = Object.fromEntries((cats || []).map((c) => [c.id, c]));
        const published = (rawPosts || []).filter((p) => p.published);
        setPosts(
          published.map((p) => mapCmsBlogPost(p, catById, defaultAuthor, defaultCover)),
        );
      } catch {
        setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const post = useMemo(() => findPostByParam(posts, param), [posts, param]);

  const related = useMemo(() => {
    if (!post) return [];
    return posts
      .filter((p) => p.id !== post.id)
      .filter((p) => p.category === post.category)
      .slice(0, 4);
  }, [posts, post]);

  const relatedFallback = useMemo(() => {
    if (!post) return [];
    if (related.length >= 3) return related;
    const extra = posts.filter(
      (p) => p.id !== post.id && !related.some((r) => r.id === p.id),
    );
    return [...related, ...extra].slice(0, 4);
  }, [posts, post, related]);

  const paragraphs = useMemo(
    () => formatBodyParagraphs(post?.body || post?.excerpt || ""),
    [post],
  );

  useEffect(() => {
    if (!post) return;
    const prev = document.title;
    document.title = `${post.title} | ${brand}`;
    return () => {
      document.title = prev;
    };
  }, [post, brand]);

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://rwandagorillatrekk.com/blog/${param}`;

  const handleShare = (platform) => {
    if (!post) return;
    const text = post.title;
    let shareLink = "";
    if (platform === "whatsapp") {
      shareLink = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
    } else if (platform === "facebook") {
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === "twitter") {
      shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    }
    if (shareLink) window.open(shareLink, "_blank", "width=600,height=400");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="blog-page essos-blog">
        <div className="essos-shell">
          <div className="essos-loading">
            <Spinner animation="border" role="status" />
            <p>Loading article…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-page essos-blog">
        <div className="essos-shell">
          <div className="essos-empty">
            <h2>Article not found</h2>
            <p>This post may have been removed or the link is incorrect.</p>
            <Button as={NavLink} to="/blog" className="essos-btn">
              Back to blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page essos-blog blog-detail-page">
      <div className="essos-shell essos-detail-shell">
        <nav className="essos-breadcrumb" aria-label="Breadcrumb">
          <NavLink to="/blog">Blog</NavLink>
          <span aria-hidden="true">/</span>
          <span className="essos-breadcrumb__current">{post.categoryName}</span>
        </nav>

        <div className="essos-detail-layout">
          <article className="essos-article">
            <div className="essos-article__hero">
              <img src={post.featuredImage} alt="" className="essos-article__cover" />
              <div className="essos-article__hero-glass">
                <span className="essos-cat">
                  <i className="essos-cat__dot" aria-hidden="true" />
                  {post.categoryName || "Category"}
                </span>
                <h1 className="essos-article__title">{post.title}</h1>
                <p className="essos-meta">
                  {post.publishedShort || post.publishedDate}
                  {" • "}
                  {post.readingTime}
                </p>
              </div>
            </div>

            <div className="essos-article__toolbar">
              <div className="essos-author">
                <img src={post.author.photo} alt="" className="essos-author__photo" />
                <div>
                  <div className="essos-author__name">{post.author.name}</div>
                  <div className="essos-author__role">{post.author.role}</div>
                </div>
              </div>
              <div className="essos-share">
                <button type="button" onClick={() => handleShare("whatsapp")} aria-label="Share on WhatsApp">
                  <i className="bi bi-whatsapp" />
                </button>
                <button type="button" onClick={() => handleShare("facebook")} aria-label="Share on Facebook">
                  <i className="bi bi-facebook" />
                </button>
                <button type="button" onClick={() => handleShare("twitter")} aria-label="Share on X">
                  <i className="bi bi-twitter-x" />
                </button>
                <button type="button" onClick={copyLink} aria-label="Copy link">
                  <i className="bi bi-link-45deg" />
                </button>
              </div>
            </div>

            {post.excerpt ? (
              <p className="essos-article__lead">{post.excerpt}</p>
            ) : null}

            <div className="essos-article__body">
              {paragraphs.length > 0 ? (
                paragraphs.map((para, idx) => <p key={idx}>{para}</p>)
              ) : (
                <p>Full article content will appear here once published.</p>
              )}
            </div>

            <div className="essos-article__cta">
              <div>
                <h3>Plan this trip with us</h3>
                <p>Turn this story into your next Rwanda adventure.</p>
              </div>
              <div className="essos-article__cta-actions">
                <Button as={NavLink} to="/packages" className="essos-btn">
                  View packages
                </Button>
                <a
                  href={whatsappHref(whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="essos-btn essos-btn--ghost"
                >
                  <i className="bi bi-whatsapp" /> WhatsApp
                </a>
              </div>
            </div>
          </article>

          <aside className="essos-detail-aside">
            <h2 className="essos-latest__heading">Latest post</h2>
            <ul className="essos-latest__list">
              {relatedFallback.map((item) => (
                <li key={item.id}>
                  <NavLink to={postPath(item)} className="essos-latest__item">
                    <img src={item.featuredImage} alt="" className="essos-latest__thumb" />
                    <div className="essos-latest__body">
                      <h3>{item.title}</h3>
                      <p className="essos-meta">
                        {item.publishedShort || item.publishedDate}
                        {" • "}
                        {item.readingTime}
                      </p>
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>

            <NavLink to="/blog" className="essos-aside-link">
              View all articles <i className="bi bi-arrow-right" />
            </NavLink>
          </aside>
        </div>

        {relatedFallback.length > 0 ? (
          <section className="essos-corner essos-related">
            <div className="essos-corner__head">
              <h2>More stories</h2>
            </div>
            <div className="essos-corner__grid">
              {relatedFallback.slice(0, 3).map((item) => (
                <NavLink key={item.id} to={postPath(item)} className="essos-card">
                  <img src={item.featuredImage} alt="" className="essos-card__img" />
                  <span className="essos-cat">
                    <i className="essos-cat__dot" aria-hidden="true" />
                    {item.categoryName || "Category"}
                  </span>
                  <h3 className="essos-card__title">{item.title}</h3>
                  <p className="essos-card__excerpt">{item.excerpt}</p>
                  <p className="essos-meta">
                    {item.publishedShort || item.publishedDate}
                    {" • "}
                    {item.readingTime}
                  </p>
                </NavLink>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default BlogDetail;
