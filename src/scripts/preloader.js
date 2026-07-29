import { ScrollTrigger } from "gsap/ScrollTrigger";
import { $, $$ } from "./core/dom.js";
import { prefersReducedMotion } from "./core/motion.js";

export function init({ onExit } = {}) {
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

  const useFastPath = prefersReducedMotion() || getVisitedFlag();
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
    onExit?.();
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
}
