/**
 * scroll-reveal.js
 * Uses IntersectionObserver to add the `.visible` class to any element
 * marked with `.reveal` once it enters the viewport.
 * Works together with the `.reveal` / `.reveal.visible` rules in animations.css.
 */

export function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');

  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // animate once, then stop watching
        }
      });
    },
    { threshold: 0.12 }
  );

  elements.forEach(el => observer.observe(el));
}
