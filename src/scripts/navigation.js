import { ScrollTrigger } from "gsap/ScrollTrigger";
import { $, $$ } from "./core/dom.js";
import { prefersReducedMotion } from "./core/motion.js";

export function init() {
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

  initAnchorScroll(closeMobile, navbar);
  initTextShineTracking();
}

function initAnchorScroll(closeMobile, navbar) {
  const hashLinks = $$('a[href^="#"]');
  if (!hashLinks.length) return;
  let pendingHash = window.location.hash || "";
  let scrollToken = 0;
  let correctionTimers = [];

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

  function clearScrollCorrections() {
    correctionTimers.forEach((timer) => window.clearTimeout(timer));
    correctionTimers = [];
  }

  function cancelActiveAnchorScroll() {
    clearScrollCorrections();
    scrollToken += 1;
  }

  function applyScrollCorrection(section, token) {
    if (token !== scrollToken) return;
    const correctedY = targetYForSection(section);
    if (Math.abs(window.scrollY - correctedY) > 2) {
      window.scrollTo({
        top: correctedY,
        behavior: "auto",
      });
    }
    ScrollTrigger.update();
  }

  function correctScroll(section, token) {
    const run = () => applyScrollCorrection(section, token);
    correctionTimers = [360, 780, 1400, 2400].map((delay) => window.setTimeout(run, delay));

    if ("onscrollend" in window) {
      window.addEventListener("scrollend", () => {
        run();
        correctionTimers.push(window.setTimeout(run, 700));
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
    clearScrollCorrections();
    const token = ++scrollToken;
    const y = targetYForSection(section);

    window.scrollTo({
      top: y,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });

    if (!prefersReducedMotion()) {
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

  window.addEventListener("wheel", cancelActiveAnchorScroll, { passive: true });
  window.addEventListener("touchstart", cancelActiveAnchorScroll, { passive: true });
  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "ArrowUp", "End", "Home", "PageDown", "PageUp", " "].includes(event.key)) {
      cancelActiveAnchorScroll();
    }
  });
}

function initTextShineTracking() {
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
}
