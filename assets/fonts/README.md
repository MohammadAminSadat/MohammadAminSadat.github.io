# Fonts — Download Instructions

The site currently loads Playfair Display and DM Sans from Google Fonts (CDN).
Follow these steps to make the site fully self-hosted (works offline, no Google dependency).

## Step 1 — Download the woff2 files

Go to https://gwfh.mranftl.com/fonts (Google Webfonts Helper — free, no login).

**Playfair Display** → search "Playfair Display"
- Select subsets: latin
- Select styles: regular (400), bold (700), 900
- Download the package → extract → copy the .woff2 files here

Rename them to match exactly:
  playfair-display-400.woff2
  playfair-display-700.woff2
  playfair-display-900.woff2

**DM Sans** → search "DM Sans"
- Select subsets: latin
- Select styles: 300, regular (400), 500, 600
- Download the package → extract → copy the .woff2 files here

Rename them to match exactly:
  dm-sans-300.woff2
  dm-sans-400.woff2
  dm-sans-500.woff2
  dm-sans-600.woff2

## Step 2 — Switch HTML files to self-hosted fonts

In index.html, blog.html, and contact.html, find and remove these two lines:

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?..." rel="stylesheet" />

Replace all three with:

  <link rel="stylesheet" href="assets/fonts/fonts.css" />

## Result

The folder should contain:
  fonts.css                  ← @font-face declarations (already here)
  playfair-display-400.woff2
  playfair-display-700.woff2
  playfair-display-900.woff2
  dm-sans-300.woff2
  dm-sans-400.woff2
  dm-sans-500.woff2
  dm-sans-600.woff2
