import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./core/motion.js";
import { init as initBeforeAfter } from "./beforeAfter.js";
import { init as initContactForm } from "./contactForm.js";
import { init as initInteractions } from "./interactions.js";
import { init as initNavigation } from "./navigation.js";
import { init as initParticles } from "./particles.js";
import { init as initPreloader } from "./preloader.js";
import { init as initReveals, initHeroReveal } from "./reveals.js";
import { init as initTemplatesShowcase } from "./templatesShowcase.js";

gsap.registerPlugin(ScrollTrigger);

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function has(selector) {
  return Boolean(document.querySelector(selector));
}

function initIf(selector, init) {
  if (has(selector)) init();
}

function markReadyWithoutPreloader() {
  document.documentElement.classList.remove("is-loading");
  if (has("#heroName")) initHeroReveal();
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    ScrollTrigger.refresh();
    window.dispatchEvent(new CustomEvent("fb:preloader-ready"));
  }));
}

initIf("#particleCanvas", initParticles);
initInteractions();

if (has("#preloader")) {
  initPreloader({ onExit: initHeroReveal });
} else {
  markReadyWithoutPreloader();
}

initIf("#navbar", initNavigation);
initIf(".section-title, .section-label, .service-card, .steps, .contact-form-panel, #heroCtaBtn", initReveals);
initIf("#baScene", initBeforeAfter);
initIf("#templatesViewport", initTemplatesShowcase);
initIf("#contactForm", initContactForm);
