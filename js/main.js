/**
 * main.js — Application entry point
 *
 * Responsibilities:
 *   1. Inject the shared site footer (with social links) into pages that want it.
 *      Pages that want the plain footer (contact.html) use data-footer="plain".
 *   2. Hamburger menu toggle.
 *   3. Scroll-reveal via IntersectionObserver.
 *   4. Footer year.
 */

/* ══════════════════════════════════════════════════════════════════════════
   FOOTER
   The social SVG icons are inlined so the footer has zero external deps.
   To add/remove a social link, edit the SOCIAL_LINKS array below.
══════════════════════════════════════════════════════════════════════════ */

const SOCIAL_LINKS = [
  {
    label: 'LinkedIn',
    href:  'https://www.linkedin.com/in/mohammad-amin-sadat-341552196/',
    svg:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.27c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 11.27h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.88v1.36h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59v5.61z"/></svg>'
  },
  {
    label: 'X (Twitter)',
    href:  'https://x.com/MAminSadat?t=FVcXgeNOpZY24wmbjrkiwA&s=09',
    svg:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
  },
  {
    label: 'YouTube',
    href:  'https://youtube.com/@s.m.amin-sadat?si=4GfcAH3cIqBs824N',
    svg:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 00-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 00.5 6.19C.13 8.06 0 10.04 0 12s.13 3.94.5 5.81a3.02 3.02 0 002.13 2.14c1.87.38 9.37.38 9.37.38s7.5 0 9.37-.38a3.02 3.02 0 002.13-2.14c.37-1.87.5-3.85.5-5.81s-.13-3.94-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/></svg>'
  },
  {
    label: 'GitHub',
    href:  'https://github.com/MohammadAminSadat',
    svg:   '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.78-.25.78-.55v-1.93c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.96 10.96 0 012.87-.39c.97 0 1.95.13 2.87.39 2.18-1.48 3.14-1.17 3.14-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.07.78 2.15v3.19c0 .3.2.66.79.55A11.51 11.51 0 0023.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>'
  }
];

function buildFooter(plain) {
  const year = new Date().getFullYear();

  if (plain) {
    return `
      <footer class="site-footer site-footer--plain">
        <p class="footer-copy">&copy; ${year} Mohammad Amin Sadat. All rights reserved.</p>
      </footer>`;
  }

  const links = SOCIAL_LINKS.map(s => `
    <a href="${s.href}" target="_blank" rel="noopener" class="footer-social-link">
      ${s.svg} ${s.label}
    </a>`).join('');

  return `
    <footer class="site-footer">
      <div class="footer-social">${links}</div>
      <p class="footer-copy">&copy; ${year} Mohammad Amin Sadat. All rights reserved.</p>
    </footer>`;
}

function injectFooter() {
  const placeholder = document.getElementById('site-footer');
  if (!placeholder) return;
  const plain = placeholder.dataset.footer === 'plain';
  placeholder.outerHTML = buildFooter(plain);
}

/* ── Navbar: hamburger toggle ─────────────────────────────────────────── */
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

/* ── Scroll reveal ────────────────────────────────────────────────────── */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ── Boot ─────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  injectFooter();
  initNavbar();
  initScrollReveal();
});
