/**
 * navbar.js
 * Handles the mobile hamburger menu toggle.
 * Closes the menu when a nav link is tapped.
 */

export function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close menu when any link is clicked (smooth-scroll navigation)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });
}
