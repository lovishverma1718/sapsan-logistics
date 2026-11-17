# Sapsan Logistics Inc — Website

A 5-page static site. No build step and no server code. Upload the folder as-is to any static host (Netlify, Vercel, Cloudflare Pages, cPanel, S3).

## Pages
| File | Page |
|---|---|
| `index.html` | Home: hero, who we are, 4 featured services, interactive lane map |
| `about.html` | About: story, purpose (mission / vision), why a falcon, values |
| `services.html` | 7 services, why choose us, FAQ |
| `careers.html` | Drive With Us: why join, why drive, roles, requirements, application form |
| `contact.html` | Contact details, 3-step quote form, hours, map |

## Structure
```
assets/css/style.css   all styles (colour and type tokens at the top)
assets/js/main.js      all interactions
assets/js/i18n-fr.js   French text for the EN/FR switch (English stays in the HTML)
assets/js/*.min.js     GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (bundled locally)
assets/fonts/          Archivo (variable) + JetBrains Mono (self-hosted)
assets/img/            photos (WebP), logo.png / logo-light.png, favicon, og-image
```

## Languages
The EN/FR switch in the header stores the choice in the browser and swaps in the French text from `assets/js/i18n-fr.js`. When you change English copy in the HTML, update the matching key there too, or that text stays in English. Have a native French speaker review the translation before launch.

## Before launch: check these with the client
- **Logo:** `logo-light.png` (white lettering, used on the navy header and footer) and `logo.png` (navy, for white backgrounds) were cut from the client’s `new_logo.pdf`, which only contains a picture of the logo. Swap in a vector (SVG/AI/EPS) version if the client has one. `favicon.png` / `apple-touch-icon.png` use the S and swoosh.
- **Forms:** forms currently open the visitor's email app with the details filled in (mailto). For in-browser submissions, connect Formspree, Netlify Forms or Basin.
- **Claims to confirm:** office hours (Mon–Fri 8–17), insurance, 24/7 dispatch, equipment types, driver requirements, and the lane distances (approximate).
- **Domain:** canonical URLs and the sitemap assume `https://sapsan.ca/`. Change them if the domain is different.
- **Photos:** `sapsan-fleet.webp` and `sapsan-reefer-trailer.webp` are the client's own. The rest are stock images from Unsplash (free licence) with third-party truck logos painted out; replace them with Sapsan photos as they arrive.
