/**
 * blog-loader.js — Fetches and parses all blog content from the /blog/ folder.
 *
 * File layout expected:
 *   blog/index.json              — master list of series and their post filenames
 *   blog/<seriesId>/series.json  — series metadata
 *   blog/<seriesId>/<post>.md    — post with YAML frontmatter + markdown body
 *
 * Public API (all functions return Promises):
 *   BlogLoader.loadAll()         → { series: [...], posts: [...] }
 *   BlogLoader.loadPost(seriesId, filename) → post object
 *
 * Adding a new post:
 *   1. Write blog/<series>/my-post.md with frontmatter
 *   2. Add "my-post.md" to that series's posts array in blog/index.json
 *   Done. No JS changes needed.
 */

const BlogLoader = (() => {

  const BASE = 'blog';  // relative to site root

  /* ── YAML frontmatter parser ─────────────────────────────────────────────
     Parses the --- block at the top of a markdown file.
     Supports: string, number, array ([a, b, c] syntax), boolean values.
  ───────────────────────────────────────────────────────────────────────── */
  function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };

    const meta = {};
    const lines = match[1].split('\n');

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const key   = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();

      if (!key) continue;

      // Array:  [a, b, c]
      if (value.startsWith('[') && value.endsWith(']')) {
        meta[key] = value.slice(1, -1)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      // Number
      } else if (!isNaN(value) && value !== '') {
        meta[key] = Number(value);
      // Boolean
      } else if (value === 'true') {
        meta[key] = true;
      } else if (value === 'false') {
        meta[key] = false;
      // String (strip optional surrounding quotes)
      } else {
        meta[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }

    return { meta, body: match[2] };
  }

  /* ── Markdown → HTML renderer ────────────────────────────────────────────
     Supports:
       # H1   ## H2   ### H3
       **bold**   *italic*   `inline code`   [text](url)
       ```lang\ncode block\n```
       - unordered list items
       Blank-line-separated paragraphs
       Horizontal rule: ---
  ───────────────────────────────────────────────────────────────────────── */
  function parseMarkdown(md) {
    const lines  = md.replace(/\r\n/g, '\n').split('\n');
    const html   = [];
    let i        = 0;

    function escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function inline(s) {
      return s
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g,     '<em>$1</em>')
        .replace(/`([^`]+)`/g,     '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }

    while (i < lines.length) {
      const line = lines[i];

      // Code block
      if (line.startsWith('```')) {
        const lang  = line.slice(3).trim();
        const block = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          block.push(escHtml(lines[i]));
          i++;
        }
        html.push(
          `<pre class="post-code" ${lang ? `data-lang="${lang}"` : ''}><code>${block.join('\n')}</code></pre>`
        );
        i++; // skip closing ```
        continue;
      }

      // Headings
      if (line.startsWith('### ')) { html.push(`<h4 class="post-subheading post-subheading--sm">${inline(line.slice(4))}</h4>`); i++; continue; }
      if (line.startsWith('## '))  { html.push(`<h3 class="post-subheading">${inline(line.slice(3))}</h3>`); i++; continue; }
      if (line.startsWith('# '))   { html.push(`<h2 class="post-heading">${inline(line.slice(2))}</h2>`); i++; continue; }

      // Horizontal rule
      if (/^---+$/.test(line.trim())) { html.push('<hr class="post-hr" />'); i++; continue; }

      // Unordered list — collect consecutive list items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const items = [];
        while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
          items.push(`<li>${inline(lines[i].slice(2))}</li>`);
          i++;
        }
        html.push(`<ul class="post-list">${items.join('')}</ul>`);
        continue;
      }

      // Ordered list
      if (/^\d+\. /.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          items.push(`<li>${inline(lines[i].replace(/^\d+\. /, ''))}</li>`);
          i++;
        }
        html.push(`<ol class="post-list post-list--ordered">${items.join('')}</ol>`);
        continue;
      }

      // Blank line — skip
      if (line.trim() === '') { i++; continue; }

      // Paragraph — collect until blank line
      const para = [];
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('- ') && !lines[i].startsWith('* ') && !/^\d+\. /.test(lines[i])) {
        para.push(inline(lines[i]));
        i++;
      }
      if (para.length) html.push(`<p>${para.join(' ')}</p>`);
    }

    return html.join('\n');
  }

  /* ── Fetch helpers ───────────────────────────────────────────────────── */
  async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return res.json();
  }

  async function fetchText(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
    return res.text();
  }

  /* ── Load a single post file ─────────────────────────────────────────── */
  async function loadPost(seriesId, filename) {
    const raw = await fetchText(`${BASE}/${seriesId}/${filename}`);
    const { meta, body } = parseFrontmatter(raw);
    return {
      ...meta,
      seriesId,
      filename,
      bodyHtml: parseMarkdown(body)
    };
  }

  /* ── Load everything ─────────────────────────────────────────────────── */
  async function loadAll() {
    // 1. Fetch master index
    const index = await fetchJSON(`${BASE}/index.json`);

    // 2. Fetch all series metadata in parallel
    const seriesList = await Promise.all(
      index.series.map(entry => fetchJSON(`${BASE}/${entry.id}/series.json`))
    );

    // 3. Fetch all posts in parallel (flatten across all series)
    const postPromises = index.series.flatMap(entry =>
      entry.posts.map(filename => loadPost(entry.id, filename))
    );
    const posts = await Promise.all(postPromises);

    // Sort posts: newest first (by date), then by part within each series
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { series: seriesList, posts };
  }

  // Public API
  return { loadAll, loadPost };

})();
