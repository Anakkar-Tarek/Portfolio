/**
 * animations.js — Fadoua Badih Portfolio
 * GSAP + ScrollTrigger + Particles + Custom Cursor
 *
 * 1.  Ambient particle canvas
 * 2.  Ambient spotlight glow
 * 3.  Preloader
 * 4.  Navbar
 * 5.  Hero GSAP reveal
 * 6.  Scroll reveals (ScrollTrigger)
 * 7.  Section title underlines
 * 8.  Services 3D tilt + spotlight
 * 9.  Before/After slider — FIXED reveal + GSAP cinematic
 * 10. Magnetic CTA button
 * 11. Testimonials carousel
 * 12. Contact form
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

/* ── helper ── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const fmt = (n, f) => f === "comma" ? Math.round(n).toLocaleString("en-US") : String(Math.round(n));

/* ============================================================
   1. AMBIENT PARTICLE CANVAS
   Cursor-reactive floating particles for a livelier hero
   ============================================================ */
(function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.3,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.3,
    velocityX: 0,
    velocityY: 0,
  };

  const PALETTES = [
    "rgba(162,123,91,",
    "rgba(192,154,120,",
    "rgba(212,165,116,",
    "rgba(224,215,200,",
    "rgba(145,186,198,",
  ];

  let particles = [];
  let rafId = 0;

  function makeParticle() {
    const col = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const driftX = (Math.random() - 0.5) * 0.3;
    const driftY = -(Math.random() * 0.42 + 0.1);

    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: driftX,
      vy: driftY,
      baseVx: driftX,
      baseVy: driftY,
      r: Math.random() * 2.4 + 0.65,
      opacity: Math.random() * 0.24 + 0.16,
      col,
      twinkle: Math.random() * Math.PI * 2,
      twinkleFreq: 0.012 + Math.random() * 0.02,
      orbit: Math.random() * Math.PI * 2,
      orbitSpeed: 0.0045 + Math.random() * 0.008,
      orbitRadius: Math.random() * 0.28 + 0.06,
    };
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = Math.max(120, Math.min(200, Math.floor(window.innerWidth / 8)));
    particles = Array.from({ length: count }, makeParticle);
  }

  function wrapParticle(p) {
    if (p.y < -16) p.y = canvas.height + 16;
    if (p.y > canvas.height + 16) p.y = -16;
    if (p.x < -16) p.x = canvas.width + 16;
    if (p.x > canvas.width + 16) p.x = -16;
  }

  function updatePointer(event) {
    pointer.velocityX = event.movementX || event.clientX - pointer.targetX;
    pointer.velocityY = event.movementY || event.clientY - pointer.targetY;
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
  }

  function drawGlow(x, y, radius, alpha, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius * 3.4, 0, Math.PI * 2);
    ctx.fillStyle = color + (alpha * 0.16).toFixed(3) + ")";
    ctx.fill();
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pointer.x += (pointer.targetX - pointer.x) * 0.11;
    pointer.y += (pointer.targetY - pointer.y) * 0.11;
    pointer.velocityX *= 0.9;
    pointer.velocityY *= 0.9;

    const influenceRadius = Math.min(300, Math.max(180, canvas.width * 0.18));

    particles.forEach((p) => {
      p.twinkle += p.twinkleFreq;
      p.orbit += p.orbitSpeed;

      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const distance = Math.hypot(dx, dy) || 1;

      if (distance < influenceRadius) {
        const force = (1 - distance / influenceRadius) * 0.08;
        const motionBoost = Math.min(1.35, (Math.abs(pointer.velocityX) + Math.abs(pointer.velocityY)) * 0.02);
        p.vx += (dx / distance) * force;
        p.vy += (dy / distance) * force;
        p.vx += pointer.velocityX * 0.0025 * motionBoost;
        p.vy += pointer.velocityY * 0.0025 * motionBoost;
      }

      const orbitX = Math.cos(p.orbit) * p.orbitRadius;
      const orbitY = Math.sin(p.orbit) * p.orbitRadius * 0.5;

      p.vx += (p.baseVx + orbitX - p.vx) * 0.035;
      p.vy += (p.baseVy + orbitY - p.vy) * 0.035;

      p.x += p.vx;
      p.y += p.vy;
      wrapParticle(p);

      const alpha = p.opacity * (0.78 + 0.5 * Math.sin(p.twinkle));
      drawGlow(p.x, p.y, p.r, alpha, p.col);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col + alpha.toFixed(3) + ")";
      ctx.fill();
    });

    rafId = window.requestAnimationFrame(animate);
  }

  resize();
  animate();

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("beforeunload", () => window.cancelAnimationFrame(rafId), { passive: true });
})();

/* ============================================================
   2. CUSTOM CURSOR
   Dot tracks exactly; ring follows with GSAP quickTo lag.
   Reacts to hover over interactive elements and slider.
   ============================================================ */
(function initCursor() {
  const dot  = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;

  /* Touch devices — hide cursor elements */
  if (!window.matchMedia("(pointer: fine)").matches) {
    dot.style.display  = "none";
    ring.style.display = "none";
    return;
  }

  /* quickTo for the lagging ring */
  const ringXTo = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
  const ringYTo = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });

  let mouseX = -100, mouseY = -100;

  document.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    /* Dot snaps instantly via transform */
    dot.style.transform  = `translate(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%))`;
    ringXTo(mouseX);
    ringYTo(mouseY);
  }, { passive: true });

  /* Hover states */
  const hoverTargets = "a, button, [role='slider'], .service-card, .reviews-arrow, .reviews-dot, .nav-cta, .btn, .contact-link, .template-card, #templatesViewport";
  const sliderTarget = "#baSlider, #baDragOverlay";

  $$("*").forEach(() => {}); // warm up querySelectorAll

  document.addEventListener("mouseover", e => {
    const el = e.target;
    if (el.closest("#baSlider") || el.closest("#baDragOverlay")) {
      ring.classList.remove("hovering");
      ring.classList.add("on-slider");
    } else if (el.closest(hoverTargets)) {
      ring.classList.remove("on-slider");
      ring.classList.add("hovering");
    }
  }, { passive: true });

  document.addEventListener("mouseout", e => {
    const to = e.relatedTarget;
    if (!to || (!to.closest(hoverTargets) && !to.closest("#baSlider"))) {
      ring.classList.remove("hovering", "on-slider");
    }
  }, { passive: true });

  document.addEventListener("mousedown", () => ring.classList.add("clicking"),   { passive: true });
  document.addEventListener("mouseup",   () => ring.classList.remove("clicking"), { passive: true });

  /* Hide when leaving window */
  document.addEventListener("mouseleave", () => {
    gsap.to([dot, ring], { opacity: 0, duration: 0.2 });
  });
  document.addEventListener("mouseenter", () => {
    gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
  });
})();

/* ============================================================
   2B. AMBIENT SPOTLIGHT
   Soft radial glow follows the pointer across the page background.
   ============================================================ */
(function initAmbientSpotlight() {
  const spotlight = document.getElementById("ambientSpotlight");
  if (!spotlight) return;

  if (!window.matchMedia("(pointer: fine)").matches) {
    spotlight.style.display = "none";
    return;
  }

  const xTo = gsap.quickTo(spotlight, "--spot-x", { duration: 0.6, ease: "power3.out" });
  const yTo = gsap.quickTo(spotlight, "--spot-y", { duration: 0.6, ease: "power3.out" });

  document.addEventListener("mousemove", (e) => {
    xTo(`${e.clientX}px`);
    yTo(`${e.clientY}px`);
  }, { passive: true });

  document.addEventListener("mouseenter", () => {
    gsap.to(spotlight, { opacity: 1, duration: 0.35, ease: "power2.out" });
  });

  document.addEventListener("mouseleave", () => {
    gsap.to(spotlight, { opacity: 0, duration: 0.25, ease: "power2.out" });
  });
})();

/* ============================================================
   3. PRELOADER
   ============================================================ */
(function initPreloader() {
  const preloader  = $("#preloader");
  const bar        = $(".preloader-bar");
  const counterEls = $$(".counter-val");
  if (!preloader) return;

  const ease = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;

  const animCounter = (el, dur) => new Promise(res => {
    const target = +el.dataset.target;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(ease(p) * target);
      p < 1 ? requestAnimationFrame(tick) : (el.textContent = target, res());
    })(t0);
  });

  const animBar = dur => new Promise(res => {
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      bar.style.width = ease(p) * 100 + "%";
      p < 1 ? requestAnimationFrame(tick) : res();
    })(t0);
  });

  async function run() {
    await new Promise(r => setTimeout(r, 500));
    await Promise.all([...counterEls.map(el => animCounter(el, 1600)), animBar(1600)]);
    await new Promise(r => setTimeout(r, 400));
    preloader.classList.add("hidden");
    setTimeout(initHeroReveal, 300);
  }
  run();
})();

/* ============================================================
   4. NAVBAR
   ============================================================ */
const navbar    = $("#navbar");
const navToggle = $("#navToggle");
const navMobile = $("#navMobile");

window.addEventListener("scroll", () => {
  navbar?.classList.toggle("scrolled", window.scrollY > 24);
}, { passive: true });

function closeMobile() {
  navMobile?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
  navMobile?.setAttribute("aria-hidden", "true");
}

navToggle?.addEventListener("click", () => {
  const open = navMobile.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
  navMobile.setAttribute("aria-hidden",   String(!open));
});
["mob-about","mob-services","mob-help","mob-reviews","mob-contact"]
  .forEach(id => $(id + ":not(#" + id + ")") || document.getElementById(id)?.addEventListener("click", closeMobile));

/* ============================================================
   5. HERO GSAP REVEAL
   ============================================================ */
function initHeroReveal() {
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .fromTo("#heroName .hero-name-first", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 })
    .fromTo("#heroName .hero-name-last",  { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, "-=0.70")
    .fromTo("#heroSubtitle",              { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, "-=0.60")
    .fromTo("#heroDesc",                  { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 },"-=0.55")
    .fromTo("#heroActions",               { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.80 },"-=0.50");
}

/* ============================================================
   6. SCROLL REVEALS — ScrollTrigger
   ============================================================ */
function batchReveal(selector, from = {}, to = {}, opts = {}) {
  ScrollTrigger.batch(selector, {
    onEnter: batch => gsap.fromTo(
      batch,
      { autoAlpha: 0, y: 28, ...from },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.82,
        ease: "expo.out",
        stagger: 0.08,
        overwrite: "auto",
        clearProps: "transform,opacity,visibility,willChange",
        ...to
      }
    ),
    once: true,
    start: "top 86%",
    ...opts,
  });
}

gsap.set("#about .section-label, #about .section-title, #about .stat-item, #about .about-body p", { willChange: "transform, opacity" });
batchReveal("#about .section-label, #about .section-title, #about .stat-item, #about .about-body p");
batchReveal("#services .section-label, #services .section-title, #services .services-intro");
batchReveal("#help .section-label, #help .section-title, #help .help-intro");
batchReveal("#reviews .section-label, #reviews .section-title");
batchReveal("#contact .section-label, #contact .section-title, #contact .contact-tagline, #contact .contact-link", { x: -24, y: 0 }, { x: 0 });
batchReveal("#transformation .section-label, #transformation .section-title");
batchReveal(".transform-body p");

gsap.fromTo(".service-card",
  { opacity: 0, y: 40, scale: 0.97 },
  { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "expo.out", stagger: 0.09,
    scrollTrigger: { trigger: "#servicesGrid", start: "top 82%", once: true } }
);

gsap.fromTo(".step",
  { opacity: 0, x: -30 },
  { opacity: 1, x: 0, duration: 0.9, ease: "expo.out", stagger: 0.15,
    scrollTrigger: { trigger: ".steps", start: "top 82%", once: true } }
);

gsap.fromTo(".contact-form-panel",
  { opacity: 0, y: 30, scale: 0.98 },
  { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: "expo.out",
    scrollTrigger: { trigger: ".contact-form-panel", start: "top 85%", once: true } }
);

/* ============================================================
   7. SECTION TITLE UNDERLINES
   ============================================================ */
$$(".section-title").forEach(el =>
  ScrollTrigger.create({
    trigger: el, start: "top 80%", once: true,
    onEnter: () => el.classList.add("underline-visible"),
  })
);

/* ============================================================
   8. SERVICES 3D TILT + SPOTLIGHT
   ============================================================ */
$$(".service-card[data-tilt]").forEach(card => {
  const xTo = gsap.quickTo(card, "rotateY", { duration: 0.5, ease: "power3" });
  const yTo = gsap.quickTo(card, "rotateX", { duration: 0.5, ease: "power3" });

  card.addEventListener("mousemove", e => {
    const r  = card.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    xTo(dx * 7); yTo(-dy * 7);
    card.style.setProperty("--mx", ((e.clientX - r.left) / r.width)  * 100 + "%");
    card.style.setProperty("--my", ((e.clientY - r.top)  / r.height) * 100 + "%");
  });
  card.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
});

/* ============================================================
   9. BEFORE / AFTER SLIDER
   Manual-only slider with responsive labels and live metric interpolation
   ============================================================ */
(function initBASlider() {
  const scene = $("#baScene");
  const slider = $("#baSlider");
  const overlay = $("#baDragOverlay");
  const handle = $("#baHandle");
  const divider = $("#baDivider");
  const labels = $("#baLabels");
  const beforeLabel = labels?.querySelector(".ba-label-before");
  const afterLabel = labels?.querySelector(".ba-label-after");
  const spotlight = $("#baSpotlight");
  const beforeImg = $("#baImgBefore");
  const afterImg = $("#baImgAfter");
  const compareBar = $("#baCompareBar");
  const compareCols = compareBar ? Array.from(compareBar.querySelectorAll(".ba-compare-col")) : [];
  const growthBadge = compareBar?.querySelector(".ba-growth-badge");
  if (!slider || !overlay || !beforeImg || !afterImg) return;

  const metricEls = compareBar ? Array.from(compareBar.querySelectorAll(".ba-c-val")) : [];
  const fallbackMetricValues = [25342, 597, 349391, 35070];
  const metrics = metricEls.map((el, index) => ({
    el,
    full: Number(
      el.dataset.full ||
      el.dataset.count ||
      el.dataset.target ||
      fallbackMetricValues[index] ||
      0
    ),
    format: el.dataset.format || "comma",
    side: index < 2 ? "before" : "after",
  }));

  const growthMax = (() => {
    const raw = growthBadge?.dataset.growthMax || growthBadge?.textContent || "13.8";
    const parsed = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 13.8;
  })();

  let currentPos = 50;
  let isDragging = false;
  let introDone = false;
  let raf = null;
  const FEATHER = 14;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function pctFromClientX(clientX) {
    const rect = slider.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function updateLabelStyles(progress) {
    if (beforeLabel) {
      const strength = 0.44 + progress * 0.56;
      beforeLabel.style.opacity = strength.toFixed(3);
      beforeLabel.style.transform = `translateY(0) scale(${(0.96 + progress * 0.08).toFixed(3)})`;
      beforeLabel.style.filter = `brightness(${(0.86 + progress * 0.22).toFixed(3)})`;
    }

    if (afterLabel) {
      const strength = 0.44 + (1 - progress) * 0.56;
      afterLabel.style.opacity = strength.toFixed(3);
      afterLabel.style.transform = `translateY(0) scale(${(0.96 + (1 - progress) * 0.08).toFixed(3)})`;
      afterLabel.style.filter = `brightness(${(0.86 + (1 - progress) * 0.22).toFixed(3)})`;
    }
  }

  function updateCompareStyles(progress) {
    const beforeStrength = 0.56 + progress * 0.44;
    const afterStrength = 0.56 + (1 - progress) * 0.44;

    if (compareCols[0]) {
      compareCols[0].style.opacity = beforeStrength.toFixed(3);
      compareCols[0].style.transform = `translateY(${((1 - progress) * 4).toFixed(2)}px) scale(${(0.985 + progress * 0.03).toFixed(3)})`;
    }

    if (compareCols[1]) {
      compareCols[1].style.opacity = afterStrength.toFixed(3);
      compareCols[1].style.transform = `translateY(${(progress * 4).toFixed(2)}px) scale(${(0.985 + (1 - progress) * 0.03).toFixed(3)})`;
    }
  }

  function renderMetrics(pct) {
    const progress = clamp((pct - 2) / 96, 0, 1);

    metrics.forEach((metric) => {
      const weight = metric.side === "before" ? progress : 1 - progress;
      const value = metric.full * weight;
      metric.el.textContent = fmt(value, metric.format);
    });

    if (growthBadge) {
      const growth = 1 + (growthMax - 1) * (1 - progress);
      growthBadge.textContent = `${growth.toFixed(1)}x growth`;
    }

    updateLabelStyles(progress);
    updateCompareStyles(progress);
  }

  function setPos(pct, instant = false) {
    const value = clamp(pct, 2, 98);
    currentPos = value;

    if (raf) cancelAnimationFrame(raf);
    const apply = () => {
      const mask =
        `linear-gradient(90deg, ` +
        `#000 0%, ` +
        `#000 calc(${value}% - ${FEATHER}px), ` +
        `rgba(0,0,0,0.35) calc(${value}% - 4px), ` +
        `transparent calc(${value}% + ${FEATHER}px), ` +
        `transparent 100%)`;

      beforeImg.style.webkitMaskImage = mask;
      beforeImg.style.maskImage = mask;
      divider.style.left = value + "%";
      overlay.setAttribute("aria-valuenow", Math.round(value));

      renderMetrics(value);
    };

    if (instant) {
      apply();
    } else {
      raf = requestAnimationFrame(apply);
    }
  }

  const tiltX = gsap.quickTo(slider, "rotateY", { duration: 0.45, ease: "power3.out" });
  const tiltY = gsap.quickTo(slider, "rotateX", { duration: 0.45, ease: "power3.out" });

  scene?.addEventListener("mousemove", (e) => {
    const rect = slider.getBoundingClientRect();

    if (!isDragging) {
      tiltX(((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 4.5);
      tiltY(-((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 4);
    }

    if (spotlight) {
      spotlight.style.setProperty("--sx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
      spotlight.style.setProperty("--sy", ((e.clientY - rect.top) / rect.height) * 100 + "%");
    }
  }, { passive: true });

  scene?.addEventListener("mouseleave", () => {
    tiltX(0);
    tiltY(0);
  });

  function finishDrag(pointerId) {
    if (!isDragging) return;
    isDragging = false;
    gsap.to(handle, { scaleX: 1, scaleY: 1, duration: 0.45, ease: "power3.out" });

    if (pointerId != null && overlay.releasePointerCapture) {
      try {
        overlay.releasePointerCapture(pointerId);
      } catch (_) {}
    }
  }

  overlay.addEventListener("pointerdown", (e) => {
    overlay.setPointerCapture?.(e.pointerId);
    isDragging = true;
    introDone = true;
    setPos(pctFromClientX(e.clientX));
    gsap.to(handle, { scaleX: 1.16, scaleY: 0.9, duration: 0.12, ease: "power2.out" });
    e.preventDefault();
  });

  overlay.addEventListener("pointermove", (e) => {
    if (!overlay.hasPointerCapture?.(e.pointerId)) return;
    setPos(pctFromClientX(e.clientX));
  });

  overlay.addEventListener("pointerup", (e) => finishDrag(e.pointerId));
  overlay.addEventListener("pointercancel", (e) => finishDrag(e.pointerId));
  overlay.addEventListener("lostpointercapture", () => finishDrag());

  overlay.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      setPos(currentPos - 3);
      e.preventDefault();
    }

    if (e.key === "ArrowRight") {
      setPos(currentPos + 3);
      e.preventDefault();
    }
  });

  setPos(50, true);

  ScrollTrigger.create({
    trigger: scene,
    start: "top 72%",
    once: true,
    onEnter: () => {
      if (introDone) return;
      introDone = true;
      compareBar?.classList.add("visible");
      labels?.classList.add("revealed");

      gsap.timeline()
        .fromTo(
          scene,
          { opacity: 0, scale: 0.94, y: 26 },
          { opacity: 1, scale: 1, y: 0, duration: 1.0, ease: "expo.out" }
        )
        .fromTo(
          [beforeLabel, afterLabel].filter(Boolean),
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, stagger: 0.08, duration: 0.55, ease: "power3.out" },
          "-=0.68"
        )
        .fromTo(
          divider,
          { scaleY: 0, transformOrigin: "top center" },
          { scaleY: 1, duration: 0.65, ease: "power3.inOut" },
          "-=0.45"
        )
        .fromTo(
          handle,
          { scale: 0.72, opacity: 0, rotate: -22 },
          { scale: 1, opacity: 1, rotate: 0, duration: 0.58, ease: "back.out(2.1)" },
          "-=0.42"
        )
        .fromTo(
          compareBar,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.65, ease: "power3.out" },
          "-=0.34"
        );
    },
  });

  window.addEventListener("resize", () => setPos(currentPos, true), { passive: true });
})();

/* ============================================================
   10. MAGNETIC CTA BUTTON
   ============================================================ */
(function initMagnetic() {
  const btn = $("#heroCtaBtn");
  if (!btn) return;
  const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
  const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
  btn.addEventListener("mousemove", e => {
    const r = btn.getBoundingClientRect();
    xTo((e.clientX - r.left - r.width  / 2) * 0.35);
    yTo((e.clientY - r.top  - r.height / 2) * 0.35);
  });
  btn.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
})();


/* ============================================================
   11. TEMPLATES SHOWCASE
   Infinite circular 3D carousel with drag focus
   ============================================================ */
(function initTemplatesShowcase() {
  const viewport = document.getElementById("templatesViewport");
  const track = document.getElementById("templatesTrack");
  if (!viewport || !track) return;

  const cards = Array.from(track.querySelectorAll("[data-template-card]"));
  const total = cards.length;
  if (!total) return;

  let step = 320;
  let rafId = 0;
  const state = {
    position: 0,
    target: 0,
    dragging: false,
    startX: 0,
    startTarget: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
  };

  function wrapIndex(value) {
    const size = total;
    return ((value % size) + size) % size;
  }

  function shortestDistance(index, value) {
    let distance = index - value;
    if (distance > total / 2) distance -= total;
    if (distance < -total / 2) distance += total;
    return distance;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function recalc() {
    const width = viewport.clientWidth;
    step = clamp(width * 0.24, 170, 290);
    const maxCardWidth = clamp(width * 0.33, 250, 380);
    viewport.style.setProperty("--template-step", `${step}px`);
    viewport.style.setProperty("--template-card-width", `${maxCardWidth}px`);
  }

  function updateCardStyles() {
    cards.forEach((card, index) => {
      const distance = shortestDistance(index, state.position);
      const absDistance = Math.abs(distance);
      const focus = clamp(1 - absDistance / 2.75, 0, 1);
      const x = distance * step;
      const y = Math.pow(absDistance, 1.16) * 18;
      const z = Math.round((focus * 170) - (absDistance * 72));
      const rotateY = distance * -18;
      const rotateX = 7;
      const scale = 0.84 + focus * 0.2;
      const blur = Math.max(0, (absDistance - 0.15) * 1.05);
      const opacity = 0.34 + focus * 0.66;
      const saturate = 0.8 + focus * 0.25;
      const brightness = 0.74 + focus * 0.34;
      const isActive = absDistance < 0.5;

      card.classList.toggle("is-active", isActive);
      card.style.zIndex = String(Math.round((focus + 0.2) * 100));
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = `blur(${blur.toFixed(2)}px) saturate(${saturate.toFixed(3)}) brightness(${brightness.toFixed(3)})`;
      card.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), ${y.toFixed(2)}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });
  }

  function tick() {
    const easing = state.dragging ? 0.24 : 0.13;
    state.position += (state.target - state.position) * easing;

    if (!state.dragging && Math.abs(state.target - state.position) < 0.001) {
      state.position = state.target;
    }

    updateCardStyles();
    rafId = window.requestAnimationFrame(tick);
  }

  function snapToNearest(extraShift = 0) {
    state.target = wrapIndex(Math.round(state.target + extraShift));
  }

  function onPointerDown(event) {
    state.dragging = true;
    state.startX = event.clientX;
    state.startTarget = state.target;
    state.lastX = event.clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    if (!state.dragging) return;

    const now = performance.now();
    const deltaX = event.clientX - state.startX;
    const deltaTime = Math.max(now - state.lastTime, 16);

    state.target = state.startTarget - (deltaX / step);
    state.velocity = (event.clientX - state.lastX) / deltaTime;
    state.lastX = event.clientX;
    state.lastTime = now;
  }

  function onPointerUp(event) {
    if (!state.dragging) return;
    state.dragging = false;
    viewport.classList.remove("is-dragging");
    viewport.releasePointerCapture?.(event.pointerId);

    const momentum = clamp(-state.velocity * 7.5, -0.35, 0.35);
    snapToNearest(momentum);
  }

  viewport.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", recalc, { passive: true });

  recalc();
  updateCardStyles();
  tick();

  window.addEventListener("beforeunload", () => window.cancelAnimationFrame(rafId), { passive: true });
})();
/* ============================================================
   12. CONTACT FORM
   ============================================================ */
(function initForm() {
  const form = $("#contactForm");
  if (!form) return;
  const btn          = $("#contactBtn");
  const successPanel = $("#formSuccess");
  const msgArea      = $("#fmsg");
  const charCountEl  = $("#charCount");
  const URL          = window.__APPS_SCRIPT_URL__ || "";

  msgArea?.addEventListener("input", () => {
    const n = msgArea.value.length;
    charCountEl.textContent = n;
    charCountEl.style.color = n > 450 ? "rgba(220,100,100,0.8)" : "";
    if (n > 500) msgArea.value = msgArea.value.slice(0, 500);
  });

  function validate(el) {
    const v = el.value.trim();
    let err = "";
    if (el.id === "fname"   && (!v || v.length < 2)) err = v ? "Min 2 characters." : "Name is required.";
    if (el.id === "femail"  && (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) err = v ? "Enter valid email." : "Email is required.";
    if (el.id === "fservice" && !el.value)  err = "Please select a service.";
    if (el.id === "fmsg"    && (!v || v.length < 10)) err = v ? "Message too short." : "Please describe your project.";
    const errEl = document.getElementById("err-" + el.name);
    if (errEl) errEl.textContent = err;
    el.classList.toggle("field-invalid", !!err);
    return !err;
  }

  ["fname","femail","fservice","fmsg"].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener("blur",  () => validate(el));
    el?.addEventListener("input", () => { if (el.classList.contains("field-invalid")) validate(el); });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("#fname"), email = $("#femail"), service = $("#fservice"), budget = $("#fbudget"), msg = $("#fmsg");
    if (![validate(name), validate(email), validate(service), validate(msg)].every(Boolean)) {
      form.querySelector(".field-invalid")?.focus(); return;
    }
    btn.classList.add("loading"); btn.disabled = true;
    try {
      await fetch(URL, { method:"POST", mode:"no-cors", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ timestamp: new Date().toISOString(), name: name.value.trim(), email: email.value.trim(),
          service: service.value, budget: budget?.value || "Not specified", message: msg.value.trim() }) });
      showSuccess();
    } catch { showSuccess(); }
    finally { btn.classList.remove("loading"); btn.disabled = false; }
  });

  function showSuccess() {
    form.classList.add("fading");
    setTimeout(() => {
      form.hidden = true; form.classList.remove("fading");
      successPanel.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        successPanel.classList.add("visible");
        successPanel.scrollIntoView({ behavior:"smooth", block:"center" });
      }));
      setTimeout(() => {
        successPanel.classList.remove("visible"); successPanel.classList.add("exiting");
        setTimeout(() => {
          successPanel.classList.remove("exiting"); successPanel.hidden = true;
          form.reset();
          $$(".field-invalid").forEach(el => el.classList.remove("field-invalid"));
          $$(".field-error").forEach(el => el.textContent = "");
          if (charCountEl) charCountEl.textContent = "0";
          form.classList.add("fading-in"); form.hidden = false;
          requestAnimationFrame(() => requestAnimationFrame(() => form.classList.remove("fading-in")));
        }, 480);
      }, 3500);
    }, 450);
  }
})();
