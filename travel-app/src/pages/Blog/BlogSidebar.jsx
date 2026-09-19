import React from "react";
import { NavLink } from "react-router-dom";
import { postPath } from "./blogUtils";

export default function BlogSidebar({
  query,
  onQueryChange,
  onSearch,
  recentPosts = [],
  tripadvisorName,
  tripadvisorUrl,
  tripadvisorRank,
}) {
  return (
    <aside className="wp-blog-aside">
      <form className="wp-search" onSubmit={onSearch} role="search">
        <input
          type="search"
          placeholder="Search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search blog posts"
        />
        <button type="submit" aria-label="Search">
          <i className="bi bi-search" />
        </button>
      </form>

      <a
        className="wp-tripadvisor"
        href={tripadvisorUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="wp-tripadvisor__brand">
          <span className="wp-tripadvisor__owl" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <circle cx="8" cy="10" r="3.2" />
              <circle cx="16" cy="10" r="3.2" />
              <circle cx="8" cy="10" r="1.1" fill="#fff" />
              <circle cx="16" cy="10" r="1.1" fill="#fff" />
              <path d="M12 13.2l2.2 3.6H9.8L12 13.2z" />
            </svg>
          </span>
          <strong>Tripadvisor</strong>
        </div>
        <h3>{tripadvisorName}</h3>
        {tripadvisorRank ? (
          <p className="wp-tripadvisor__rank">{tripadvisorRank}</p>
        ) : null}
        <p className="wp-tripadvisor__reviews">Recent traveler reviews</p>
        <p className="wp-tripadvisor__cta">
          Read reviews <span>Write a review</span>
        </p>
      </a>

      <section className="wp-recent">
        <h3>Recent Posts</h3>
        <ul>
          {recentPosts.length ? (
            recentPosts.map((post) => (
              <li key={post.id}>
                <i className="bi bi-file-earmark-text" aria-hidden="true" />
                <NavLink to={postPath(post)}>{post.title}</NavLink>
              </li>
            ))
          ) : (
            <li className="wp-recent__empty">New stories coming soon.</li>
          )}
        </ul>
      </section>
    </aside>
  );
}
