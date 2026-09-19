import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import "./blog.css";
import { clearFetchJsonCache, fetchJson, resolveMediaUrl } from "../../utils/backendApi";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import BlogSidebar from "./BlogSidebar";
import {
  findPostByParam,
  formatBodyParagraphs,
  isHtmlBody,
  mapCmsBlogPost,
  sanitizeBlogHtml,
} from "./blogUtils";

const BlogDetail = () => {
  const { id: param } = useParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const brand = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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
        clearFetchJsonCache("/api/blog/posts");
        clearFetchJsonCache("/api/blog/categories");
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

  const recentPosts = useMemo(() => {
    return posts.filter((p) => !post || p.id !== post.id).slice(0, 6);
  }, [posts, post]);

  const htmlBody = useMemo(() => {
    if (!post) return "";
    if (!isHtmlBody(post.body)) return "";
    return sanitizeBlogHtml(post.body, resolveMediaUrl);
  }, [post]);

  const paragraphs = useMemo(() => {
    if (!post || htmlBody) return [];
    if (isHtmlBody(post.body)) {
      const plain = String(post.body)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return plain ? [plain] : [];
    }
    return formatBodyParagraphs(post.body || post.excerpt || "");
  }, [post, htmlBody]);

  useEffect(() => {
    if (!post) return;
    const prev = document.title;
    document.title = `${post.title} | ${brand}`;
    return () => {
      document.title = prev;
    };
  }, [post, brand]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/blog?q=${encodeURIComponent(q)}` : "/blog");
  };

  const tripadvisorName = `${brand} Tours`;
  const tripadvisorUrl =
    settings.tripadvisorUrl ||
    `https://www.tripadvisor.com/Search?q=${encodeURIComponent(brand)}`;
  const tripadvisorRank = settings.tripadvisorRank || "Featured Rwanda tour operator";

  if (loading) {
    return (
      <div className="blog-page wp-blog">
        <div className="wp-blog-shell">
          <div className="wp-blog-status">
            <Spinner animation="border" role="status" />
            <p>Loading article…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-page wp-blog">
        <div className="wp-blog-shell">
          <div className="wp-blog-status">
            <h2>Article not found</h2>
            <p>This post may have been removed or the link is incorrect.</p>
            <NavLink to="/blog" className="wp-read-more">
              Back to blog
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page wp-blog wp-blog-detail">
      <div className="wp-blog-shell">
        <div className="wp-blog-kicker-row">
          <h1 className="wp-blog-kicker">Blog</h1>
          <nav className="wp-breadcrumb" aria-label="Breadcrumb">
            <NavLink to="/">Home</NavLink>
            <span aria-hidden="true">»</span>
            <NavLink to="/blog">Blog</NavLink>
            <span aria-hidden="true">»</span>
            <span>{post.title}</span>
          </nav>
        </div>

        <div className="wp-blog-layout">
          <article className="wp-article">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="wp-article__cover"
            />
            <h1 className="wp-article__title">{post.title}</h1>
            {htmlBody ? (
              <div
                className="wp-article__body"
                dangerouslySetInnerHTML={{ __html: htmlBody }}
              />
            ) : (
              <div className="wp-article__body">
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, idx) => <p key={idx}>{para}</p>)
                ) : (
                  <p>{post.excerpt}</p>
                )}
              </div>
            )}
          </article>

          <BlogSidebar
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            recentPosts={recentPosts}
            tripadvisorName={tripadvisorName}
            tripadvisorUrl={tripadvisorUrl}
            tripadvisorRank={tripadvisorRank}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
