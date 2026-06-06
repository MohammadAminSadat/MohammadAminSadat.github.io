/**
 * utils.js
 * Small, reusable utility functions that don't belong to a specific component.
 */

/**
 * Sets the text of #year to the current calendar year.
 * Used in the footer copyright line.
 */
export function setFooterYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}
