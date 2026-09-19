import React, { useEffect, useMemo, useState } from "react";
import { Spinner } from "react-bootstrap";
import { NavLink, useSearchParams } from "react-router-dom";
import "./blog.css";
import { clearFetchJsonCache, fetchJson } from "../../utils/backendApi";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { DEFAULT_SITE_SETTINGS } from "../../config/defaultSiteSettings";
import BlogSidebar from "./BlogSidebar";
import { mapCmsBlogPost, postPath } from "./blogUtils";

const POSTS_PER_PAGE = 6;

const Blog = () => {
  const { settings } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [cmsPosts, setCmsPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

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
        const [posts, cats] = await Promise.all([
          fetchJson("/api/blog/posts"),
          fetchJson("/api/blog/categories"),
        ]);
        if (cancelled) return;
        const catById = Object.fromEntries((cats || []).map((c) => [c.id, c]));
        const published = (posts || []).filter((p) => p.published);
        setCmsPosts(
          published.map((p) => mapCmsBlogPost(p, catById, defaultAuthor, defaultCover)),
        );
      } catch {
        setCmsPosts([]);
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPosts = useMemo(() => {
    return [...cmsPosts].sort((a, b) => {
      const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return db - da;
    });
  }, [cmsPosts]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sortedPosts;
    return sortedPosts.filter((post) =>
      `${post.title} ${post.excerpt} ${post.categoryName} ${post.body || ""}`
        .replace(/<[^>]+>/g, " ")
        .toLowerCase()
        .includes(q),
    );
  }, [sortedPosts, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE) || 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  );
  const recentPosts = sortedPosts.slice(0, 6);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = query.trim();
    if (next) setSearchParams({ q: next });
    else setSearchParams({});
  };

  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const tripadvisorName = `${brandName} Tours`;
  const tripadvisorUrl =
    settings.tripadvisorUrl ||
    `https://www.tripadvisor.com/Search?q=${encodeURIComponent(brandName)}`;
  const tripadvisorRank = settings.tripadvisorRank || "Featured Rwanda tour operator";

  return (
    <div className="blog-page wp-blog">
      <div className="wp-blog-shell">
        {postsLoading ? (
          <div className="wp-blog-status">
            <Spinner animation="border" role="status" />
            <p>Loading blog posts…</p>
          </div>
        ) : (
          <div className="wp-blog-layout">
            <div className="wp-blog-main">
              {!filteredPosts.length ? (
                <div className="wp-blog-status">
                  <h2>No articles found</h2>
                  <p>
                    {query
                      ? "Try a different search, or browse all posts."
                      : "New Rwanda travel stories will appear here soon."}
                  </p>
                  {query ? (
                    <button
                      type="button"
                      className="wp-read-more"
                      onClick={() => {
                        setQuery("");
                        setSearchParams({});
                      }}
                    >
                      Clear search
                    </button>
                  ) : (
                    <NavLink to="/packages" className="wp-read-more">
                      Browse packages
                    </NavLink>
                  )}
                </div>
              ) : (
                paginatedPosts.map((post) => (
                  <article key={post.id} className="wp-post-card">
                    <NavLink to={postPath(post)} className="wp-post-card__media">
                      <img src={post.featuredImage} alt={post.title} />
                    </NavLink>
                    <h2>
                      <NavLink to={postPath(post)}>{post.title}</NavLink>
                    </h2>
                    <p>{post.excerpt}{post.excerpt.length >= 220 ? "…" : ""}</p>
                    <NavLink to={postPath(post)} className="wp-read-more">
                      Read more
                    </NavLink>
                  </article>
                ))
              )}

              {filteredPosts.length > POSTS_PER_PAGE ? (
                <nav className="wp-pagination" aria-label="Blog pagination">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </nav>
              ) : null}
            </div>

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
        )}
      </div>
    </div>
  );
};

export default Blog;
