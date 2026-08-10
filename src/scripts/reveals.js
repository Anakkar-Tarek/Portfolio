import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { $$ } from "./core/dom.js";
import { finePointerQuery, prefersReducedMotion } from "./core/motion.js";

export function initHeroReveal() {
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .fromTo("#heroName .hero-name-first", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 })
    .fromTo("#heroName .hero-name-last",  { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0 }, "-=0.70")
    .fromTo("#heroSubtitle",              { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, "-=0.60")
    .fromTo("#heroDesc",                  { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 },"-=0.55")
    .fromTo("#heroActions",               { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.80 },"-=0.50");
}

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

function setupSectionSubtitleMotion() {
  const labels = $$(".section-label");
  if (!labels.length) return;

  // Keeps scroll jitter from replaying the subtitle glow too aggressively.
  const SUBTITLE_GLOW_COOLDOWN_MS = 1400;
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
      activeTimeline: null,
      chars: Array.from(textWrap.querySelectorAll(".section-label-char")),
      label,
      lastGlowAt: 0,
    };
    labelData.set(label, data);
    return data;
  }

  function stopSubtitleAnimation(data) {
    if (!data.activeTimeline) return;
    data.activeTimeline.kill();
    data.activeTimeline = null;
  }

  function playViewportGlow(label) {
    const data = splitLabel(label);
    const now = performance.now();

    if (now - data.lastGlowAt < SUBTITLE_GLOW_COOLDOWN_MS) return;
    data.lastGlowAt = now;

    if (prefersReducedMotion()) {
      label.classList.remove("is-label-live");
      gsap.set(data.chars, { autoAlpha: 1, clearProps: "transform,filter" });
      return;
    }

    stopSubtitleAnimation(data);
    label.classList.add("is-label-live");

    data.activeTimeline = gsap.timeline({
      defaults: { ease: "expo.out" },
      onComplete: () => {
        label.classList.remove("is-label-live");
        gsap.set(data.chars, { clearProps: "transform,opacity,visibility,filter,color,willChange" });
        data.activeTimeline = null;
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
    if (prefersReducedMotion()) return;

    stopSubtitleAnimation(data);
    label.classList.remove("is-label-live");
    label.classList.add("is-title-hovered");

    data.activeTimeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        gsap.set(data.chars, { clearProps: "transform,filter,color,willChange" });
        data.activeTimeline = null;
      },
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

  function setupSubtitleViewportAnimation(label) {
    splitLabel(label);

    function playWhenVisible() {
      const rect = label.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      if (rect.bottom <= 0 || rect.top >= viewportHeight) return;
      playViewportGlow(label);
    }

    ScrollTrigger.create({
      trigger: label,
      start: "top 86%",
      end: "bottom top",
      onEnter: () => gsap.delayedCall(0.12, playWhenVisible),
      onEnterBack: () => gsap.delayedCall(0.12, playWhenVisible),
    });
  }

  function setupSubtitleHoverAnimation(label) {
    label.addEventListener("pointerenter", () => playHover(label), { passive: true });
    label.addEventListener("pointerleave", () => label.classList.remove("is-title-hovered"), { passive: true });
  }

  labels.forEach(label => {
    setupSubtitleViewportAnimation(label);
    setupSubtitleHoverAnimation(label);
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

function setupSectionTitleUnderlineLoadEffects() {
  $$(".section-title").forEach(el =>
    ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => el.classList.add("underline-visible"),
    })
  );
}

function initServiceCards() {
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

  if (finePointerQuery.matches && !prefersReducedMotion()) {
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
}

function initMagnetic() {
  const btn = document.querySelector("#heroCtaBtn");
  if (!btn) return;
  const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
  const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
  btn.addEventListener("mousemove", e => {
    const r = btn.getBoundingClientRect();
    xTo((e.clientX - r.left - r.width  / 2) * 0.08);
    yTo((e.clientY - r.top  - r.height / 2) * 0.08);
  });
  btn.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
}

export function init() {
  setupSectionSubtitleMotion();

  batchReveal("#about .section-label, #about .section-title, #about .stat-item, #about .about-body p");
  batchReveal("#services .section-label, #services .section-title, #services .services-intro");
  batchReveal("#help .section-label, #help .section-title, #help .help-intro");
  batchReveal("#reviews .section-label, #reviews .section-title");
  batchReveal("#contact .section-label, #contact .section-title, #contact .contact-tagline, #contact .contact-link", { x: -24, y: 0 }, { x: 0 });
  batchReveal("#transformation .section-label, #transformation .section-title");
  batchReveal(".transform-body p");

  initServiceCards();

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

  setupSectionTitleUnderlineLoadEffects();

  initMagnetic();
}
