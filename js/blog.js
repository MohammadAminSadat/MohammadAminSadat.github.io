/**
 * blog.js — Renders blog.html using data fetched by blog-loader.js
 *
 * Three URL-driven views:
 *   blog.html                   → main:   latest post + all series cards
 *   blog.html?series=<id>       → series: all posts in one series
 *   blog.html?post=<id>         → post:   full post with prev/next navigation
 *
 * This file contains only rendering logic.
 * All data fetching and parsing lives in blog-loader.js.
 */

/* ── Shared helpers ─────────────────────────────────────────────────────── */
function formatDate(iso) {
  return new Date(iso + 'T00:00:00')
    .toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderTags(tags = []) {
  return tags.map(t => `<span class="post-tag">${t}</span>`).join('');
}

function setHero(label, title, subtitle) {
  const el = document.querySelector('.page-hero-label');
  const ht = document.querySelector('.page-hero-title');
  const hs = document.querySelector('.page-hero-subtitle');
  if (el) el.textContent = label;
  if (ht) ht.textContent = title;
  if (hs) hs.innerHTML   = subtitle;
}

function showError(container, message) {
  container.innerHTML = `<p class="blog-error">${message}</p>`;
}

const ARROW_R = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>`;
const ARROW_L = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18"/></svg>`;

/* ══════════════════════════════════════════════════════════════════════════
   VIEW 1 — Main: latest post card + series grid
══════════════════════════════════════════════════════════════════════════ */
function renderMain(container, { series, posts }) {
  const latest       = posts[0];
  const latestSeries = latest ? series.find(s => s.id === latest.seriesId) : null;

  const latestHtml = latest ? `
    <div class="latest-post reveal">
      <p class="section-label">Latest post</p>
      <article class="post-card post-card--featured">
        <div class="post-card-meta">
          <time datetime="${latest.date}">${formatDate(latest.date)}</time>
          ${latestSeries
            ? `<a href="blog.html?series=${latestSeries.id}" class="post-series-badge">${latestSeries.icon} ${latestSeries.title}</a>`
            : ''}
          <div class="post-tags">${renderTags(latest.tags)}</div>
        </div>
        <h2 class="post-card-title">
          <a href="blog.html?post=${latest.id}">${latest.title}</a>
        </h2>
        <p class="post-card-summary">${latest.summary}</p>
        <a href="blog.html?post=${latest.id}" class="post-read-more">
          Read post ${ARROW_R}
        </a>
      </article>
    </div>
    <hr class="post-divider" />` : '';

  const seriesHtml = `
    <div class="series-section reveal">
      <p class="section-label">Series</p>
      <div class="series-grid">
        ${series.map(s => {
          const count = posts.filter(p => p.seriesId === s.id).length;
          return `
            <a href="blog.html?series=${s.id}" class="series-card">
              <span class="series-icon">${s.icon}</span>
              <div class="series-card-body">
                <h3 class="series-card-title">${s.title}</h3>
                <p class="series-card-desc">${s.description}</p>
                <span class="series-post-count">${count} ${count === 1 ? 'post' : 'posts'}</span>
              </div>
            </a>`;
        }).join('')}
      </div>
    </div>`;

  container.innerHTML = latestHtml + seriesHtml;
  if (typeof initScrollReveal === 'function') initScrollReveal();
}

/* ══════════════════════════════════════════════════════════════════════════
   VIEW 2 — Series: all posts in one series, ordered by part
══════════════════════════════════════════════════════════════════════════ */
function renderSeries(container, { series, posts }, seriesId) {
  const s = series.find(s => s.id === seriesId);
  if (!s) { showError(container, 'Series not found.'); return; }

  document.title = `${s.title} — Blog — Mohammad Amin Sadat`;
  setHero(`${s.icon} Series`, s.title, s.description);

  const seriesPosts = posts
    .filter(p => p.seriesId === seriesId)
    .sort((a, b) => a.part - b.part);

  const postsHtml = seriesPosts.length
    ? seriesPosts.map((post, i) => `
        <article class="post-card reveal">
          <div class="post-card-meta">
            <span class="post-part-badge">Part ${post.part}</span>
            <time datetime="${post.date}">${formatDate(post.date)}</time>
            <div class="post-tags">${renderTags(post.tags)}</div>
          </div>
          <h2 class="post-card-title">
            <a href="blog.html?post=${post.id}">${post.title}</a>
          </h2>
          <p class="post-card-summary">${post.summary}</p>
          <a href="blog.html?post=${post.id}" class="post-read-more">
            Read post ${ARROW_R}
          </a>
        </article>
        ${i < seriesPosts.length - 1 ? '<hr class="post-divider" />' : ''}
      `).join('')
    : `<p class="blog-empty">No posts in this series yet — check back soon.</p>`;

  container.innerHTML = `
    <div class="series-breadcrumb reveal">
      <a href="blog.html" class="btn-ghost">${ARROW_L} All series</a>
    </div>
    ${postsHtml}`;

  if (typeof initScrollReveal === 'function') initScrollReveal();
}

/* ══════════════════════════════════════════════════════════════════════════
   VIEW 3 — Single post
══════════════════════════════════════════════════════════════════════════ */
function renderPost(container, { series, posts }, postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) { showError(container, 'Post not found. <a href="blog.html">Back to blog →</a>'); return; }

  const s           = series.find(s => s.id === post.seriesId);
  const seriesPosts = s
    ? posts.filter(p => p.seriesId === s.id).sort((a, b) => a.part - b.part)
    : [];
  const idx      = seriesPosts.findIndex(p => p.id === postId);
  const prevPost = idx > 0                      ? seriesPosts[idx - 1] : null;
  const nextPost = idx < seriesPosts.length - 1 ? seriesPosts[idx + 1] : null;

  document.title = `${post.title} — Mohammad Amin Sadat`;
  setHero(
    s ? `${s.icon} ${s.title} · Part ${post.part}` : 'Post',
    post.title,
    `<time datetime="${post.date}">${formatDate(post.date)}</time>
     <span class="hero-tag-list">${renderTags(post.tags)}</span>`
  );

  const prevNextHtml = (prevPost || nextPost) ? `
    <div class="post-prevnext">
      <div class="post-prevnext-inner">
        ${prevPost ? `
          <a href="blog.html?post=${prevPost.id}" class="prevnext-link prevnext-link--prev">
            ${ARROW_L}
            <span>
              <small>Previous · Part ${prevPost.part}</small>
              <strong>${prevPost.title}</strong>
            </span>
          </a>` : '<span></span>'}
        ${nextPost ? `
          <a href="blog.html?post=${nextPost.id}" class="prevnext-link prevnext-link--next">
            <span>
              <small>Next · Part ${nextPost.part}</small>
              <strong>${nextPost.title}</strong>
            </span>
            ${ARROW_R}
          </a>` : ''}
      </div>
    </div>` : '';

  container.innerHTML = `
    <nav class="post-breadcrumb" aria-label="Breadcrumb">
      <a href="blog.html" class="breadcrumb-link">Blog</a>
      <span class="breadcrumb-sep">›</span>
      ${s ? `<a href="blog.html?series=${s.id}" class="breadcrumb-link">${s.title}</a>
             <span class="breadcrumb-sep">›</span>` : ''}
      <span class="breadcrumb-current">Part ${post.part}</span>
    </nav>

    <article class="post-full">
      <div class="post-body">${post.bodyHtml}</div>
      ${prevNextHtml}
      <div class="post-footer-nav">
        <a href="${s ? `blog.html?series=${s.id}` : 'blog.html'}" class="btn-ghost">
          ${ARROW_L} ${s ? `Back to ${s.title}` : 'Back to Blog'}
        </a>
      </div>
    </article>`;
}

/* ── Loading state ──────────────────────────────────────────────────────── */
function showLoading(container) {
  container.innerHTML = `
    <div class="blog-loading">
      <span class="blog-loading-dot"></span>
      <span class="blog-loading-dot"></span>
      <span class="blog-loading-dot"></span>
    </div>`;
}

/* ── Boot ───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('blog-content');
  if (!container) return;

  const params   = new URLSearchParams(window.location.search);
  const postId   = params.get('post');
  const seriesId = params.get('series');

  showLoading(container);

  try {
    const data = await BlogLoader.loadAll();

    if (postId)        renderPost(container, data, postId);
    else if (seriesId) renderSeries(container, data, seriesId);
    else               renderMain(container, data);

  } catch (err) {
    console.error('Blog load error:', err);
    showError(container,
      'Could not load blog content. Make sure the site is served over HTTP (not file://).');
  }
});
