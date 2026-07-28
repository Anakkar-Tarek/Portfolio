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
 * 7.  Section title underlines + section label motion
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
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(pointer: fine)");

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

/* ============================================================
   1. AMBIENT PARTICLE CANVAS
   Cursor-reactive floating particles for a livelier hero
   ============================================================ */
(function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.3,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.3,
    velocityX: 0,
    velocityY: 0,
  };

  const PALETTES = [
    "rgba(192,154,120,",
    "rgba(212,165,116,",
    "rgba(232,200,154,",
    "rgba(245,224,184,",
    "rgba(224,215,200,",
    "rgba(145,186,198,",
  ];

  let particles = [];
  let rafId = 0;
  let isRunning = false;

  function syncCanvasOpacity() {
    canvas.style.opacity = reducedMotion.matches ? "0.19" : "0.78";
  }

  function makeParticle() {
    const reduced = reducedMotion.matches;
    const col = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const driftX = (Math.random() - 0.5) * (reduced ? 0.08 : 0.3);
    const driftY = -(Math.random() * (reduced ? 0.12 : 0.42) + (reduced ? 0.03 : 0.1));

    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: driftX,
      vy: driftY,
      baseVx: driftX,
      baseVy: driftY,
      r: Math.random() * (reduced ? 1.6 : 2.4) + 0.65,
      opacity: Math.random() * (reduced ? 0.12 : 0.24) + (reduced ? 0.08 : 0.16),
      col,
      twinkle: Math.random() * Math.PI * 2,
      twinkleFreq: (reduced ? 0.004 : 0.01) + Math.random() * (reduced ? 0.006 : 0.016),
      orbit: Math.random() * Math.PI * 2,
      orbitSpeed: (reduced ? 0.0015 : 0.0035) + Math.random() * (reduced ? 0.002 : 0.006),
      orbitRadius: Math.random() * (reduced ? 0.12 : 0.24) + 0.05,
    };
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = reducedMotion.matches
      ? Math.max(18, Math.min(37, Math.floor(window.innerWidth / 38)))
      : Math.max(77, Math.min(134, Math.floor(window.innerWidth / 13)));
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

  function drawFrame(advance = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (advance) {
      pointer.x += (pointer.targetX - pointer.x) * 0.11;
      pointer.y += (pointer.targetY - pointer.y) * 0.11;
      pointer.velocityX *= 0.9;
      pointer.velocityY *= 0.9;
    }

    const influenceRadius = advance && !reducedMotion.matches
      ? Math.min(165, Math.max(96, canvas.width * 0.09))
      : 0;

    particles.forEach((p) => {
      if (advance) {
        p.twinkle += p.twinkleFreq;
        p.orbit += p.orbitSpeed;

        const dx = p.x - pointer.targetX;
        const dy = p.y - pointer.targetY;
        const distance = Math.hypot(dx, dy) || 1;

        if (distance < influenceRadius) {
          const force = (1 - distance / influenceRadius) * 0.055;
          const motionBoost = Math.min(1, (Math.abs(pointer.velocityX) + Math.abs(pointer.velocityY)) * 0.015);
          p.vx += (dx / distance) * force;
          p.vy += (dy / distance) * force;
          p.vx += pointer.velocityX * 0.0015 * motionBoost;
          p.vy += pointer.velocityY * 0.0015 * motionBoost;
        }

        const orbitX = Math.cos(p.orbit) * p.orbitRadius;
        const orbitY = Math.sin(p.orbit) * p.orbitRadius * 0.5;

        p.vx += (p.baseVx + orbitX - p.vx) * 0.035;
        p.vy += (p.baseVy + orbitY - p.vy) * 0.035;

        p.x += p.vx;
        p.y += p.vy;
        wrapParticle(p);
      }

      const alpha = p.opacity * (0.78 + 0.5 * Math.sin(p.twinkle));
      drawGlow(p.x, p.y, p.r, alpha, p.col);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col + alpha.toFixed(3) + ")";
      ctx.fill();
    });
  }

  function stopAnimation() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    isRunning = false;
  }

  function renderStaticFrame() {
    stopAnimation();
    drawFrame(false);
  }

  function animate() {
    if (!isRunning || document.hidden || reducedMotion.matches) {
      rafId = 0;
      isRunning = false;
      return;
    }

    drawFrame(true);
    rafId = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (isRunning || document.hidden || reducedMotion.matches) return;
    isRunning = true;
    animate();
  }

  syncCanvasOpacity();
  resize();
  if (reducedMotion.matches) renderStaticFrame();
  else startAnimation();

  window.addEventListener("resize", () => {
    resize();
    if (reducedMotion.matches) renderStaticFrame();
    else startAnimation();
  }, { passive: true });
  window.addEventListener("pointermove", updatePointer, { passive: true });
  reducedMotion.addEventListener("change", () => {
    syncCanvasOpacity();
    resize();
    if (reducedMotion.matches) renderStaticFrame();
    else startAnimation();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else if (reducedMotion.matches) renderStaticFrame();
    else startAnimation();
  });
  window.addEventListener("beforeunload", stopAnimation, { passive: true });
})();

/* ============================================================
   3. PRELOADER
   ============================================================ */
(function initPreloader() {
  const preloader  = $("#preloader");
  const bar        = $(".preloader-bar");
  const counterEls = $$(".counter-val");
  const PRELOADER_DURATION = 2500;
  const EXIT_DURATION = 1050;
  const FAST_PRELOADER_DURATION = 300;
  const VISITED_KEY = "fb_visited";

  function getVisitedFlag() {
    try {
      return window.sessionStorage.getItem(VISITED_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function setVisitedFlag() {
    try {
      window.sessionStorage.setItem(VISITED_KEY, "1");
    } catch (_) {}
  }

  document.documentElement.classList.add("is-loading");
  if (!preloader) {
    document.documentElement.classList.remove("is-loading");
    return;
  }

  const useFastPath = motionQuery.matches || getVisitedFlag();
  const preloaderInner = preloader.querySelector(".preloader-inner");

  if (useFastPath) {
    preloader.style.transitionDuration = `${FAST_PRELOADER_DURATION}ms`;
    if (preloaderInner) preloaderInner.style.transitionDuration = `${FAST_PRELOADER_DURATION}ms`;
  }

  const animCounter = (el, dur) => new Promise(res => {
    const target = +el.dataset.target;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(p * target);
      p < 1 ? requestAnimationFrame(tick) : (el.textContent = target, res());
    })(t0);
  });

  const animBar = dur => new Promise(res => {
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      bar.style.width = p * 100 + "%";
      p < 1 ? requestAnimationFrame(tick) : res();
    })(t0);
  });

  function setCountersToTarget() {
    counterEls.forEach(el => {
      el.textContent = el.dataset.target || el.textContent;
    });
    if (bar) bar.style.width = "100%";
  }

  function exitPreloader(duration) {
    setVisitedFlag();
    preloader.classList.add("is-exiting");
    document.documentElement.classList.remove("is-loading");
    document.documentElement.classList.add("is-scrollbar-revealing");
    initHeroReveal();
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      window.dispatchEvent(new CustomEvent("fb:preloader-ready"));
    }));
    setTimeout(() => {
      preloader.classList.add("hidden");
      document.documentElement.classList.remove("is-scrollbar-revealing");
    }, duration);
  }

  async function run() {
    if (useFastPath) {
      setCountersToTarget();
      exitPreloader(FAST_PRELOADER_DURATION);
      return;
    }

    await Promise.all([...counterEls.map(el => animCounter(el, PRELOADER_DURATION)), animBar(PRELOADER_DURATION)]);
    exitPreloader(EXIT_DURATION);
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
["mob-about","mob-services","mob-help","mob-results","mob-reviews","mob-contact"]
  .forEach(id => document.getElementById(id)?.addEventListener("click", closeMobile));

(function initAnchorScroll() {
  const hashLinks = $$('a[href^="#"]');
  if (!hashLinks.length) return;
  let pendingHash = window.location.hash || "";
  let scrollToken = 0;

  function targetForSection(section) {
    return section.classList.contains("hero")
      ? section
      : section.querySelector(".section-title") || section;
  }

  function navOffset() {
    return Math.ceil(navbar?.getBoundingClientRect().height || 0);
  }

  function anchorGap() {
    return Math.round(Math.min(56, Math.max(28, window.innerHeight * 0.045)));
  }

  function isPageLocked() {
    return document.documentElement.classList.contains("is-loading");
  }

  function targetYForSection(section) {
    const target = targetForSection(section);
    return Math.max(0, target.getBoundingClientRect().top + window.scrollY - navOffset() - anchorGap());
  }

  function applyScrollCorrection(section, token) {
    if (token !== scrollToken) return;
    const correctedY = targetYForSection(section);
    if (Math.abs(window.scrollY - correctedY) > 2) {
      window.scrollTo({
        top: correctedY,
        behavior: motionQuery.matches ? "auto" : "smooth",
      });
    }
    ScrollTrigger.update();
  }

  function correctScroll(section, token) {
    const run = () => applyScrollCorrection(section, token);
    [520, 1100, 1800, 2800, 4200].forEach((delay) => window.setTimeout(run, delay));

    if ("onscrollend" in window) {
      window.addEventListener("scrollend", () => {
        run();
        window.setTimeout(run, 900);
      }, { once: true });
    }
  }

  function scrollToHash(hash, updateUrl = true, force = false) {
    if (!hash || hash === "#") return false;
    const section = document.getElementById(hash.slice(1));
    if (!section) return false;
    if (!force && isPageLocked()) {
      pendingHash = hash;
      if (updateUrl && window.history?.pushState) {
        window.history.pushState(null, "", hash);
      }
      return true;
    }

    ScrollTrigger.refresh();
    const token = ++scrollToken;
    const y = targetYForSection(section);

    window.scrollTo({
      top: y,
      behavior: motionQuery.matches ? "auto" : "smooth",
    });

    if (!motionQuery.matches) {
      correctScroll(section, token);
    }

    if (updateUrl && window.history?.pushState) {
      window.history.pushState(null, "", hash);
    }

    return true;
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    const link = target instanceof Element ? target.closest('a[href^="#"]') : null;
    if (!link) return;

    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    if (scrollToHash(hash)) {
      event.preventDefault();
      closeMobile();
    }
  });

  window.addEventListener("fb:preloader-ready", () => {
    if (pendingHash) {
      const hash = pendingHash;
      pendingHash = "";
      window.requestAnimationFrame(() => scrollToHash(hash, false, true));
    } else if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  });

  window.addEventListener("hashchange", () => {
    scrollToHash(window.location.hash, false);
  });
})();

(function initTextShineTracking() {
  const targets = [
    ...$$(".nav-logo").map((el) => ({ el, x: "--shine-x", y: "--shine-y" })),
    ...$$(".section-title").map((el) => ({ el, x: "--title-shine-x", y: "--title-shine-y" })),
    ...$$(".section-title em").map((el) => ({ el, x: "--em-shine-x", y: "--em-shine-y", activeClass: "is-shining" })),
  ];

  targets.forEach(({ el, x, y, activeClass }) => {
    function syncShinePosition(event) {
      const rect = el.getBoundingClientRect();
      const px = ((event.clientX - rect.left) / rect.width) * 100;
      const py = ((event.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty(x, `${Math.max(0, Math.min(100, px)).toFixed(1)}%`);
      el.style.setProperty(y, `${Math.max(0, Math.min(100, py)).toFixed(1)}%`);
    }

    el.addEventListener("pointerenter", (event) => {
      syncShinePosition(event);
      if (activeClass) el.classList.add(activeClass);
    }, { passive: true });

    el.addEventListener("pointermove", syncShinePosition, { passive: true });

    el.addEventListener("pointerleave", () => {
      el.style.setProperty(x, "50%");
      el.style.setProperty(y, "50%");
      if (activeClass) el.classList.remove(activeClass);
    }, { passive: true });
  });
})();

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
  const elements = $$(selector);
  if (!elements.length) return;

  gsap.set(elements, {
    autoAlpha: 0,
    y: 24,
    willChange: "transform, opacity",
    ...from,
  });

  ScrollTrigger.batch(elements, {
    onEnter: batch => gsap.to(
      batch,
      {
        autoAlpha: 1,
        y: 0,
        x: 0,
        duration: 0.82,
        ease: "expo.out",
        stagger: 0.08,
        overwrite: "auto",
        clearProps: "transform,opacity,visibility,willChange",
        ...to
      }
    ),
    once: true,
    start: "top 94%",
    ...opts,
  });
}

function setupSectionLabelMotion() {
  const labels = $$(".section-label");
  if (!labels.length) return;

  const labelData = new WeakMap();

  function splitLabel(label) {
    if (labelData.has(label)) return labelData.get(label);

    const text = label.textContent.trim();
    const textWrap = document.createElement("span");
    textWrap.className = "section-label-text";
    textWrap.setAttribute("aria-hidden", "true");

    label.textContent = "";
    label.setAttribute("aria-label", text);

    Array.from(text).forEach(char => {
      const charEl = document.createElement("span");
      const isSpace = char === " ";
      charEl.className = isSpace ? "section-label-char section-label-space" : "section-label-char";
      charEl.textContent = isSpace ? "\u00a0" : char;
      textWrap.append(charEl);
    });

    label.append(textWrap);

    const data = {
      chars: Array.from(textWrap.querySelectorAll(".section-label-char")),
      label,
    };
    labelData.set(label, data);
    return data;
  }

  function playLoad(label) {
    const data = splitLabel(label);

    if (motionQuery.matches) {
      gsap.set(data.chars, { autoAlpha: 1, clearProps: "transform,filter" });
      return;
    }

    gsap.killTweensOf(data.chars);
    label.classList.add("is-label-live");

    gsap.timeline({
      defaults: { ease: "expo.out" },
      onComplete: () => {
        label.classList.remove("is-label-live");
        gsap.set(data.chars, { clearProps: "transform,opacity,visibility,filter,color,willChange" });
      },
    })
      .set(data.chars, {
        autoAlpha: 0,
        filter: "blur(5px)",
        rotateX: i => (i % 2 ? -74 : 74),
        rotateZ: i => (i % 2 ? 5 : -5),
        transformPerspective: 700,
        willChange: "transform, opacity, filter",
        x: i => ((i % 3) - 1) * 4,
        y: i => (i % 2 ? 14 : -12),
      })
      .to(data.chars, {
        autoAlpha: 1,
        color: "#fff0c7",
        duration: 0.72,
        filter: "blur(0px)",
        rotateX: 0,
        rotateZ: 0,
        stagger: { each: 0.024, from: "center" },
        x: 0,
        y: 0,
      }, 0)
      .to(data.chars, {
        color: "inherit",
        duration: 0.36,
        stagger: { each: 0.014, from: "edges" },
      }, 0.42);
  }

  function playHover(label) {
    const data = splitLabel(label);
    if (motionQuery.matches) return;

    gsap.killTweensOf(data.chars);
    label.classList.add("is-title-hovered");

    gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => gsap.set(data.chars, { clearProps: "transform,filter,color,willChange" }),
    })
      .to(data.chars, {
        color: "#fff3d9",
        duration: 0.18,
        filter: "brightness(1.28)",
        rotateZ: i => (i % 2 ? -7 : 7),
        stagger: { each: 0.016, from: "random" },
        willChange: "transform, filter",
        x: i => Math.sin(i * 1.7) * 3,
        y: i => (i % 2 ? 5 : -6),
      })
      .to(data.chars, {
        color: "inherit",
        duration: 0.62,
        ease: "elastic.out(1, 0.48)",
        filter: "brightness(1)",
        rotateZ: 0,
        stagger: { each: 0.012, from: "center" },
        x: 0,
        y: 0,
      });
  }

  labels.forEach(label => {
    splitLabel(label);

    ScrollTrigger.create({
      trigger: label.closest("section") || label,
      start: "top 86%",
      once: true,
      onEnter: () => gsap.delayedCall(0.12, () => playLoad(label)),
    });
  });

  $$(".section-title").forEach(title => {
    const label = title.closest("section")?.querySelector(".section-label");
    if (!label) return;

    title.addEventListener("pointerenter", () => playHover(label), { passive: true });
    title.addEventListener("pointerleave", () => label.classList.remove("is-title-hovered"), { passive: true });
    title.addEventListener("focusin", () => playHover(label));
    title.addEventListener("focusout", () => label.classList.remove("is-title-hovered"));
  });
}

setupSectionLabelMotion();

batchReveal("#about .section-label, #about .section-title, #about .stat-item, #about .about-body p");
batchReveal("#services .section-label, #services .section-title, #services .services-intro");
batchReveal("#help .section-label, #help .section-title, #help .help-intro");
batchReveal("#reviews .section-label, #reviews .section-title");
batchReveal("#contact .section-label, #contact .section-title, #contact .contact-tagline, #contact .contact-link", { x: -24, y: 0 }, { x: 0 });
batchReveal("#transformation .section-label, #transformation .section-title");
batchReveal(".transform-body p");

const serviceCards = $$(".service-card");
if (serviceCards.length) {
  gsap.set(serviceCards, { autoAlpha: 0, y: 28, scale: 0.985, willChange: "transform, opacity" });
  ScrollTrigger.create({
    trigger: "#servicesGrid",
    start: "top 92%",
    once: true,
    onEnter: () => {
      serviceCards.forEach((card, index) => {
        window.setTimeout(() => card.classList.add("is-loaded"), index * 90);
      });

      gsap.to(serviceCards, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.72,
        ease: "expo.out",
        stagger: 0.09,
        clearProps: "transform,opacity,visibility,willChange",
      });
    },
  });
}

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
   7. SECTION TITLE UNDERLINES + LABEL MOTION
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
if (finePointerQuery.matches && !motionQuery.matches) {
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
}

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
  }));

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

  function ariaValueText(value) {
    return `${Math.round(value)}% before image visible`;
  }

  function syncRevealVars(beforeShare) {
    const afterShare = 1 - beforeShare;
    const beforeValue = beforeShare.toFixed(3);
    const afterValue = afterShare.toFixed(3);

    scene?.style.setProperty("--ba-before-share", beforeValue);
    scene?.style.setProperty("--ba-after-share", afterValue);
    compareBar?.style.setProperty("--ba-before-share", beforeValue);
    compareBar?.style.setProperty("--ba-after-share", afterValue);
    compareBar?.style.setProperty("--ba-after-percent", `${(afterShare * 100).toFixed(1)}%`);
  }

  function updateLabelStyles(beforeShare) {
    const afterShare = 1 - beforeShare;

    if (beforeLabel) {
      const strength = 0.42 + beforeShare * 0.58;
      beforeLabel.style.opacity = strength.toFixed(3);
      beforeLabel.style.transform = `translateY(0) scale(${(0.97 + beforeShare * 0.06).toFixed(3)})`;
      beforeLabel.style.filter = `brightness(${(0.86 + beforeShare * 0.24).toFixed(3)})`;
    }

    if (afterLabel) {
      const strength = 0.42 + afterShare * 0.58;
      afterLabel.style.opacity = strength.toFixed(3);
      afterLabel.style.transform = `translateY(0) scale(${(0.97 + afterShare * 0.06).toFixed(3)})`;
      afterLabel.style.filter = `brightness(${(0.86 + afterShare * 0.24).toFixed(3)})`;
    }

    beforeImg.style.filter = `saturate(${(0.88 + beforeShare * 0.18).toFixed(3)}) brightness(${(0.84 + beforeShare * 0.16).toFixed(3)})`;
    afterImg.style.filter = `saturate(${(0.9 + afterShare * 0.18).toFixed(3)}) brightness(${(0.86 + afterShare * 0.16).toFixed(3)})`;
  }

  function updateCompareStyles(beforeShare) {
    const afterShare = 1 - beforeShare;
    const beforeStrength = 0.58 + beforeShare * 0.42;
    const afterStrength = 0.58 + afterShare * 0.42;

    if (compareCols[0]) {
      compareCols[0].style.opacity = beforeStrength.toFixed(3);
      compareCols[0].style.transform = `translateY(${(afterShare * 4).toFixed(2)}px) scale(${(0.985 + beforeShare * 0.025).toFixed(3)})`;
      compareCols[0].classList.toggle("is-active", beforeShare > afterShare);
    }

    if (compareCols[1]) {
      compareCols[1].style.opacity = afterStrength.toFixed(3);
      compareCols[1].style.transform = `translateY(${(beforeShare * 4).toFixed(2)}px) scale(${(0.985 + afterShare * 0.025).toFixed(3)})`;
      compareCols[1].classList.toggle("is-active", afterShare >= beforeShare);
    }
  }

  function renderMetrics(pct) {
    const beforeShare = clamp((pct - 2) / 96, 0, 1);

    metrics.forEach((metric) => {
      metric.el.textContent = fmt(metric.full, metric.format);
    });

    syncRevealVars(beforeShare);
    updateLabelStyles(beforeShare);
    updateCompareStyles(beforeShare);
  }

  function setPos(pct, instant = false) {
    const value = clamp(pct, 0, 100);
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
      overlay.setAttribute("aria-valuetext", ariaValueText(value));

      renderMetrics(value);
    };

    if (instant) {
      apply();
    } else {
      raf = requestAnimationFrame(apply);
    }
  }

  if (finePointerQuery.matches && !motionQuery.matches) {
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
  }

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
    const moves = {
      ArrowLeft: -3,
      ArrowRight: 3,
      PageDown: -10,
      PageUp: 10,
    };

    if (e.key === "Home") setPos(0);
    else if (e.key === "End") setPos(100);
    else if (e.key in moves) setPos(currentPos + moves[e.key]);
    else return;

    e.preventDefault();
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
    xTo((e.clientX - r.left - r.width  / 2) * 0.08);
    yTo((e.clientY - r.top  - r.height / 2) * 0.08);
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

  const reducedMotion = motionQuery;
  const IDLE_SPEED = 0.0062;
  const DRAG_EASE = 0.3;
  const SETTLE_EASE = 0.16;
  let step = 320;
  let rafId = 0;
  let isRunning = false;
  let isIntersecting = !("IntersectionObserver" in window);
  let isHovering = false;
  const state = {
    position: 0,
    target: 0,
    dragging: false,
    startX: 0,
    startTarget: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    moved: false,
  };

  function wrapIndex(value) {
    const size = total;
    return ((value % size) + size) % size;
  }

  function shortestDistance(index, value) {
    const center = wrapIndex(value);
    let distance = index - center;
    if (distance > total / 2) distance -= total;
    if (distance < -total / 2) distance += total;
    return distance;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(value) {
    return value * value * (3 - 2 * value);
  }

  function recalc() {
    const width = viewport.clientWidth;
    step = clamp(width * 0.24, 170, 290);
    const maxCardWidth = clamp(width * 0.33, 250, 380);
    viewport.style.setProperty("--template-step", `${step}px`);
    viewport.style.setProperty("--template-card-width", `${maxCardWidth}px`);
  }

  function updateCardStyles() {
    const activeIndex = wrapIndex(Math.round(state.position));

    cards.forEach((card, index) => {
      const distance = shortestDistance(index, state.position);
      const absDistance = Math.abs(distance);
      const layerDistance = Math.abs(shortestDistance(index, activeIndex));
      const depth = smoothstep(clamp(absDistance / 2.85, 0, 1));
      const focus = 0.14 + (1 - smoothstep(clamp(absDistance / 1.85, 0, 1))) * 0.86;
      const x = distance * step * (0.97 - depth * 0.04);
      const y = Math.pow(depth, 1.35) * 26;
      const z = 26 + Math.pow(focus, 1.4) * 206;
      const rotateY = distance * -10.5;
      const rotateX = 4.5;
      const scale = 0.88 + focus * 0.16;
      const blur = Math.max(0, (1 - focus) * 0.64);
      const opacity = 0.42 + focus * 0.58;
      const saturate = 0.82 + focus * 0.26;
      const brightness = 0.78 + focus * 0.3;
      const isActive = layerDistance === 0;

      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-current", isActive ? "true" : "false");
      card.style.setProperty("--template-focus", focus.toFixed(3));
      card.style.zIndex = String(1000 - Math.round(absDistance * 120));
      card.style.opacity = opacity.toFixed(3);
      card.style.filter = `blur(${blur.toFixed(2)}px) saturate(${saturate.toFixed(3)}) brightness(${brightness.toFixed(3)})`;
      card.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), ${y.toFixed(2)}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });
  }

  function hasPendingMotion() {
    return Math.abs(state.target - state.position) > 0.001;
  }

  function shouldRunFrame() {
    return !document.hidden && !reducedMotion.matches && (state.dragging || hasPendingMotion() || (!isHovering && isIntersecting));
  }

  function stopTick() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    isRunning = false;
  }

  function startTick() {
    if (isRunning || !shouldRunFrame()) return;
    isRunning = true;
    tick();
  }

  function renderInteractionFrame() {
    state.position = state.target;
    updateCardStyles();
  }

  function tick() {
    if (!isRunning) return;
    if (!shouldRunFrame()) {
      rafId = 0;
      isRunning = false;
      return;
    }

    if (!state.dragging && !isHovering && isIntersecting) {
      state.target += IDLE_SPEED;
    }

    const easing = state.dragging ? DRAG_EASE : SETTLE_EASE;
    state.position += (state.target - state.position) * easing;

    if (!state.dragging && Math.abs(state.target - state.position) < 0.001) {
      state.position = state.target;
    }

    updateCardStyles();
    rafId = window.requestAnimationFrame(tick);
  }

  function snapToNearest(extraShift = 0) {
    state.target = Math.round(state.target + extraShift);
  }

  function onPointerDown(event) {
    if (event.button && event.button !== 0) return;
    state.target = state.position;
    state.dragging = true;
    state.startX = event.clientX;
    state.startTarget = state.target;
    state.lastX = event.clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
    state.moved = false;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture?.(event.pointerId);
    if (reducedMotion.matches) renderInteractionFrame();
    else startTick();
  }

  function onPointerMove(event) {
    if (!state.dragging) return;

    const now = performance.now();
    const deltaX = event.clientX - state.startX;
    const deltaTime = Math.max(now - state.lastTime, 16);

    state.target = state.startTarget - (deltaX / step);
    state.moved = state.moved || Math.abs(deltaX) > 6;
    state.velocity = (event.clientX - state.lastX) / deltaTime;
    state.lastX = event.clientX;
    state.lastTime = now;

    if (reducedMotion.matches) renderInteractionFrame();
    else startTick();
  }

  function onPointerUp(event) {
    if (!state.dragging) return;
    const wasMoved = state.moved;
    state.dragging = false;
    viewport.classList.remove("is-dragging");
    viewport.releasePointerCapture?.(event.pointerId);

    const momentum = reducedMotion.matches || !wasMoved ? 0 : clamp(-state.velocity * 6.5, -0.3, 0.3);
    snapToNearest(momentum);
    if (reducedMotion.matches) renderInteractionFrame();
    else startTick();
  }

  function focusCard(index) {
    const shift = shortestDistance(index, state.target);
    state.target += shift;
    snapToNearest();
    if (reducedMotion.matches) renderInteractionFrame();
    else startTick();
  }

  function onResize() {
    recalc();
    updateCardStyles();
    startTick();
  }

  function onMotionChange() {
    if (reducedMotion.matches) {
      stopTick();
      renderInteractionFrame();
    } else {
      startTick();
    }
  }

  function onVisibilityChange() {
    if (document.hidden) stopTick();
    else startTick();
  }

  function onPointerEnter() {
    isHovering = true;
    viewport.classList.add("is-paused");
    if (!state.dragging && !hasPendingMotion()) stopTick();
  }

  function onPointerLeave() {
    isHovering = false;
    viewport.classList.remove("is-paused");
    startTick();
  }

  viewport.addEventListener("pointerenter", onPointerEnter);
  viewport.addEventListener("pointerleave", onPointerLeave);
  viewport.addEventListener("pointerdown", onPointerDown);
  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      if (state.moved) return;
      focusCard(index);
    });
  });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", onResize, { passive: true });
  reducedMotion.addEventListener("change", onMotionChange);
  document.addEventListener("visibilitychange", onVisibilityChange);

  let observer = null;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry?.isIntersecting || false;
      if (isIntersecting) startTick();
      else stopTick();
    }, { threshold: 0.01 });
    observer.observe(viewport);
  }

  recalc();
  updateCardStyles();
  startTick();

  window.addEventListener("beforeunload", () => {
    stopTick();
    observer?.disconnect();
  }, { passive: true });
})();
/* ============================================================
   12. CONTACT FORM
   ============================================================ */
(function initForm() {
  const form = $("#contactForm");
  if (!form) return;
  const btn          = $("#contactBtn");
  const successPanel = $("#formSuccess");
  const nameInput    = $("#fname");
  const phoneInput   = $("#fphone");
  const serviceInput = $("#fservice");
  const msgArea      = $("#fmsg");
  const charCountEl  = $("#charCount");
  const phoneCode    = $("#fphoneCode");
  const phoneCountry = $("#fphoneCountry");
  const phoneButton  = $("#phoneCodeButton");
  const phoneList    = $("#phoneCodeList");
  const phoneFlag    = $("#phoneCodeFlag");
  const phoneText    = $("#phoneCodeText");
  const phoneWrap    = phoneButton?.closest(".phone-code-wrap");
  const phoneOptions = $$("[data-phone-option]");
  const budgetInput  = $("#fbudget");
  const budgetError  = $("#err-budget");
  const formError    = $("#formError");
  let budgetErrorTimer;

  const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]{1,79}$/u;
  const PHONE_RE = /^[0-9+() .-]+$/;
  const PHONE_MAX_DIGITS = Number(phoneInput?.dataset.maxDigits || 15);
  const UNSAFE_TEXT_RE = /[<>]|[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

  function normalizeSpaces(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function countDigits(value) {
    return (value.match(/\d/g) || []).length;
  }

  function limitPhoneDigits(value) {
    let digitCount = 0;
    return Array.from(value).filter(char => {
      if (!/\d/.test(char)) return true;
      digitCount += 1;
      return digitCount <= PHONE_MAX_DIGITS;
    }).join("");
  }

  function cleanPhoneValue(value) {
    return limitPhoneDigits(value)
      .replace(/[^0-9+() .-]/g, "")
      .replace(/(?!^)\+/g, "")
      .replace(/\s{2,}/g, " ")
      .slice(0, 20);
  }

  msgArea?.addEventListener("input", () => {
    const n = msgArea.value.length;
    charCountEl.textContent = n;
    charCountEl.style.color = n > 450 ? "rgba(220,100,100,0.8)" : "";
    if (n > 500) msgArea.value = msgArea.value.slice(0, 500);
  });

  function syncPhonePicker(option = phoneCode?.selectedOptions?.[0]) {
    if (!option || !phoneFlag || !phoneText) return;
    const iso = option.dataset.iso;
    const name = option.dataset.name || "";
    const code = option.dataset.code || option.value;
    if (iso) {
      phoneFlag.src = `https://flagcdn.com/w40/${iso}.png`;
      phoneFlag.srcset = `https://flagcdn.com/w40/${iso}.png 1x, https://flagcdn.com/w80/${iso}.png 2x`;
    }
    phoneFlag.alt = "";
    phoneText.textContent = code;
    if (phoneCountry) phoneCountry.value = name;
    phoneOptions.forEach(btn => {
      btn.setAttribute("aria-selected", btn.dataset.iso === iso && btn.dataset.name === name ? "true" : "false");
    });
  }

  function closePhonePicker() {
    if (!phoneButton || !phoneList) return;
    phoneButton.setAttribute("aria-expanded", "false");
    phoneList.hidden = true;
    phoneWrap?.classList.remove("is-open");
  }

  function openPhonePicker() {
    if (!phoneButton || !phoneList) return;
    phoneButton.setAttribute("aria-expanded", "true");
    phoneList.hidden = false;
    phoneWrap?.classList.add("is-open");
    phoneList.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }

  function togglePhonePicker() {
    if (phoneList?.hidden) openPhonePicker();
    else closePhonePicker();
  }

  function selectPhoneOption(btn) {
    if (!phoneCode || !btn) return;
    const iso = btn.dataset.iso;
    const code = btn.dataset.code;
    const name = btn.dataset.name;
    const option = Array.from(phoneCode.options).find(item =>
      item.dataset.iso === iso && item.dataset.code === code && item.dataset.name === name
    );
    if (!option) return;
    Array.from(phoneCode.options).forEach(item => { item.selected = item === option; });
    syncPhonePicker(option);
    phoneCode.dispatchEvent(new Event("change", { bubbles: true }));
    closePhonePicker();
    phoneButton?.focus();
  }

  phoneButton?.addEventListener("click", togglePhonePicker);
  phoneButton?.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPhonePicker();
      phoneList?.querySelector('[aria-selected="true"]')?.focus();
    }
  });
  phoneOptions.forEach(btn => {
    btn.addEventListener("click", () => selectPhoneOption(btn));
    btn.addEventListener("keydown", e => {
      const current = phoneOptions.indexOf(btn);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        phoneOptions[Math.min(current + 1, phoneOptions.length - 1)]?.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        phoneOptions[Math.max(current - 1, 0)]?.focus();
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectPhoneOption(btn);
      }
      if (e.key === "Escape") {
        closePhonePicker();
        phoneButton?.focus();
      }
    });
  });
  document.addEventListener("click", e => {
    if (!phoneWrap?.contains(e.target)) closePhonePicker();
  });
  phoneCode?.addEventListener("change", () => syncPhonePicker());
  syncPhonePicker();

  function showBudgetDigitError() {
    if (!budgetError || !budgetInput) return;
    budgetError.textContent = "Use numeric digits only.";
    budgetInput.classList.add("field-invalid");
    window.clearTimeout(budgetErrorTimer);
    budgetErrorTimer = window.setTimeout(() => {
      budgetError.textContent = "";
      budgetInput.classList.remove("field-invalid");
    }, 2400);
  }

  function validateBudget() {
    if (!budgetError || !budgetInput) return true;
    const digits = budgetInput.value.replace(/\D/g, "").slice(0, 12);
    budgetInput.value = digits;

    let err = "";
    if (digits && Number(digits) <= 0) err = "Enter a realistic budget amount.";

    budgetError.textContent = err;
    budgetInput.classList.toggle("field-invalid", !!err);
    return !err;
  }

  budgetInput?.addEventListener("beforeinput", e => {
    if (e.data && /\D/.test(e.data)) {
      e.preventDefault();
      showBudgetDigitError();
    }
  });

  budgetInput?.addEventListener("paste", e => {
    const text = e.clipboardData?.getData("text") || "";
    if (!/\D/.test(text)) return;
    e.preventDefault();
    const start = budgetInput.selectionStart ?? budgetInput.value.length;
    const end = budgetInput.selectionEnd ?? start;
    const openSlots = Math.max(0, 12 - (budgetInput.value.length - (end - start)));
    const digits = text.replace(/\D/g, "").slice(0, openSlots);
    budgetInput.setRangeText(digits, start, end, "end");
    showBudgetDigitError();
    validateBudget();
  });

  budgetInput?.addEventListener("input", () => {
    const digits = budgetInput.value.replace(/\D/g, "").slice(0, 12);
    if (budgetInput.value !== digits) {
      budgetInput.value = digits;
      showBudgetDigitError();
    }
    if (budgetInput.classList.contains("field-invalid")) validateBudget();
  });

  phoneInput?.addEventListener("beforeinput", e => {
    if (!e.data || !/\d/.test(e.data)) return;
    const start = phoneInput.selectionStart ?? phoneInput.value.length;
    const end = phoneInput.selectionEnd ?? start;
    const next = phoneInput.value.slice(0, start) + e.data + phoneInput.value.slice(end);
    if (countDigits(next) > PHONE_MAX_DIGITS) e.preventDefault();
  });

  phoneInput?.addEventListener("paste", e => {
    const text = e.clipboardData?.getData("text") || "";
    const start = phoneInput.selectionStart ?? phoneInput.value.length;
    const end = phoneInput.selectionEnd ?? start;
    const next = phoneInput.value.slice(0, start) + text + phoneInput.value.slice(end);
    const clean = cleanPhoneValue(next);
    if (next === clean && countDigits(next) <= PHONE_MAX_DIGITS) return;
    e.preventDefault();
    phoneInput.value = clean;
    validate(phoneInput);
  });

  phoneInput?.addEventListener("input", () => {
    const clean = cleanPhoneValue(phoneInput.value);
    if (phoneInput.value !== clean) phoneInput.value = clean;
    if (phoneInput.classList.contains("field-invalid")) validate(phoneInput);
  });

  function hideError() {
    if (!formError) return;
    formError.hidden = true;
    formError.textContent = "";
  }

  function showError() {
    if (!formError) return;
    formError.textContent = "Something went wrong while sending your message. Please try again.";
    formError.hidden = false;
  }

  function validate(el) {
    if (!el) return false;
    const v = el.id === "fmsg" ? el.value.trim() : normalizeSpaces(el.value);
    let err = "";
    if (el.id === "fname") {
      el.value = v;
      if (!v) err = "Name is required.";
      else if (v.length < 2) err = "Min 2 characters.";
      else if (v.length > 80) err = "Name is too long.";
      else if (UNSAFE_TEXT_RE.test(v) || !NAME_RE.test(v)) err = "Use your real name without numbers or symbols.";
    }
    if (el.id === "fphone") {
      el.value = cleanPhoneValue(v);
      const phoneValue = el.value;
      const digitCount = phoneValue.replace(/\D/g, "").length;
      if (!phoneValue) err = "WhatsApp phone number is required.";
      else if (!PHONE_RE.test(phoneValue)) err = "Use numbers and phone separators only.";
      else if (digitCount < 5) err = "Enter a valid WhatsApp phone number.";
      else if (digitCount > PHONE_MAX_DIGITS) err = `Phone number can use up to ${PHONE_MAX_DIGITS} digits.`;
    }
    if (el.id === "fservice" && !el.value)  err = "Please select a service.";
    if (el.id === "fbudget") {
      return validateBudget();
    }
    if (el.id === "fmsg") {
      el.value = v;
      if (!v) err = "Please describe your project.";
      else if (v.length < 10) err = "Message too short.";
      else if (v.length > 500) err = "Message is too long.";
      else if (UNSAFE_TEXT_RE.test(v)) err = "Please remove special markup characters.";
    }
    const errEl = document.getElementById("err-" + el.name);
    if (errEl) errEl.textContent = err;
    el.classList.toggle("field-invalid", !!err);
    return !err;
  }

  ["fname","fphone","fservice","fbudget","fmsg"].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener("blur",  () => validate(el));
    el?.addEventListener("input", () => { if (el.classList.contains("field-invalid")) validate(el); });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    hideError();
    if (![validate(nameInput), validate(phoneInput), validate(serviceInput), validate(budgetInput), validate(msgArea)].every(Boolean)) {
      form.querySelector(".field-invalid")?.focus(); return;
    }
    btn.classList.add("loading"); btn.disabled = true;
    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (res.ok) showSuccess();
      else showError();
    } catch {
      showError();
    }
    finally { btn.classList.remove("loading"); btn.disabled = false; }
  });

  function showSuccess() {
    hideError();
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
          syncPhonePicker();
          closePhonePicker();
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
