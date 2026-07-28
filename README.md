# Fadoua Badih — Portfolio (Astro + Tailwind + GSAP)

Migrated from vanilla HTML/CSS/JS to **Astro 5 + Tailwind CSS + GSAP 3**.

## Quick Start

```bash
npm install
npm run dev       # → http://localhost:4321
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

## Project Structure

```
fadoua-portfolio/
├── public/
│   └── images/
│       ├── IG1.webp     ← After analytics screenshot
│       └── IG2.webp     ← Before analytics screenshot
├── src/
│   ├── components/
│   │   ├── Preloader.astro
│   │   ├── Navbar.astro
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── Services.astro
│   │   ├── Process.astro
│   │   ├── Transformation.astro   ← ✨ Enhanced slider section
│   │   ├── Reviews.astro
│   │   ├── Contact.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   ├── scripts/
│   │   └── animations.js          ← All GSAP logic here
│   └── styles/
│       └── global.css             ← Design tokens + all CSS
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## What's New vs the Original

### Slider Section — The Awe Factor ✨
The Before/After slider has been completely reimagined:

| Feature | Original | New |
|---|---|---|
| Divider | Plain white line | **Glowing amber energy beam** with animated glow pulse |
| Particles | None | **Two light orbs** traveling up/down the beam continuously |
| Handle | Plain white circle | **Premium orb** with double ring glow + elastic spring on grab |
| Intro animation | Simple lerp sweep | **GSAP cinematic timeline**: scene fades in → labels reveal → beam draws → handle springs in → sweep 8%→92%→50% |
| 3D tilt | None | **GSAP quickTo** perspective tilt on mouse move |
| Cursor spotlight | None | **Radial gradient spotlight** follows cursor inside slider |
| Stats | Always visible | **Count-up animation** triggered on entry with formatted numbers |
| Hover halo | None | **Ambient glow halo** behind the entire scene |

### Animations — GSAP replaces IntersectionObserver
- Hero: staggered GSAP timeline (expo.out) after preloader
- Scroll reveals: `ScrollTrigger.batch()` for grouped staggered reveals
- Services: **GSAP quickTo** for smooth 3D tilt, CSS custom property spotlight
- Magnetic CTA: **GSAP quickTo** x/y for buttery smooth magnetic follow
- All transitions: GSAP instead of CSS-only for more control

### Architecture
- Vanilla HTML → **Astro components** (each section its own `.astro` file)
- Inline CSS → **Tailwind + CSS custom properties** in `global.css`
- One big `script.js` → **Single `animations.js`** imported as ES module

## Google Apps Script
Update the `APPS_SCRIPT_URL` in `src/components/Contact.astro`:
```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/YOUR_ID/exec";
```

## Deploy to Vercel
```bash
npm i -g vercel
vercel
```
Or connect your GitHub repo at vercel.com — zero config needed for Astro.
