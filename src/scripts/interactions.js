import { $$ } from "./core/dom.js";
import {
  DEFAULT_CURSOR_SPOTLIGHT_RADIUS,
  clearCursorSpotlightVars,
  rectIntersectsCursorSpotlight,
  setCursorSpotlightVars,
} from "./core/pointerEffects.js";
import { finePointerQuery, onReducedMotionChange, prefersReducedMotion } from "./core/motion.js";

const CLEANUP_KEY = "__fbInteractionCleanup";
const PERSISTENT_HOVER_MS = 980;
const HOVER_ACTIVE_CLASS = "is-hovering";
const HOVER_ANIMATION_CLASS = "is-hover-animating";

const PERSISTENT_HOVER_SELECTOR = [
  "button",
  "[role='button']",
  "input[type='button']",
  "input[type='submit']",
  "input[type='reset']",
  ".btn",
  ".nav-cta",
  ".contact-link",
  ".ba-peek-btn",
  ".phone-code-button",
  ".currency-button",
  ".phone-code-option",
  ".currency-option",
].join(",");

const CURSOR_SPOTLIGHT_RADIUS = DEFAULT_CURSOR_SPOTLIGHT_RADIUS;
const BADGE_CURSOR_SPOTLIGHT_RADIUS = DEFAULT_CURSOR_SPOTLIGHT_RADIUS * 0.7;

const CURSOR_SPOTLIGHT_SURFACE_SELECTOR = [
  ".service-card",
  ".service-tag",
  ".stat-item",
  ".step",
  ".step-index",
].join(",");

const CURSOR_SPOTLIGHT_TEXT_SELECTOR = [
  ".service-tag",
  ".service-title",
  ".service-card p",
  ".stat-num",
  ".stat-label",
  ".about-body p",
].join(",");

const graphemeSegmenter = typeof Intl !== "undefined" && Intl.Segmenter
  ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
  : null;

function getCursorSpotlightRadius(element) {
  return element.matches(".service-tag, .step-index")
    ? BADGE_CURSOR_SPOTLIGHT_RADIUS
    : CURSOR_SPOTLIGHT_RADIUS;
}

function splitGraphemes(text) {
  return graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment)
    : Array.from(text);
}

function prepareCursorText(element) {
  if (element.dataset.cursorSpotlightReady === "true") {
    return $$(".cursor-char", element);
  }

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(".cursor-char")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    const fragment = document.createDocumentFragment();

    splitGraphemes(node.nodeValue).forEach((char) => {
      const span = document.createElement("span");
      span.className = "cursor-char";
      span.textContent = char;
      fragment.append(span);
    });

    node.replaceWith(fragment);
  });

  element.dataset.cursorSpotlightReady = "true";
  return $$(".cursor-char", element);
}

function collectCursorTextTargets() {
  return $$(CURSOR_SPOTLIGHT_TEXT_SELECTOR)
    .map(element => ({ element, chars: prepareCursorText(element) }))
    .filter(({ chars }) => chars.length);
}

function clearCursorTextTarget(target) {
  target.element.classList.remove("is-cursor-text-active");
  target.chars.forEach(char => char.classList.remove("is-cursor-lit"));
}

function syncCursorTextTarget(target, point) {
  const rect = target.element.getBoundingClientRect();
  if (!rectIntersectsCursorSpotlight(rect, point, CURSOR_SPOTLIGHT_RADIUS)) {
    clearCursorTextTarget(target);
    return;
  }

  let hasLitChars = false;

  target.chars.forEach((char) => {
    const lit = rectIntersectsCursorSpotlight(
      char.getBoundingClientRect(),
      point,
      Math.max(1, CURSOR_SPOTLIGHT_RADIUS - 4)
    );

    char.classList.toggle("is-cursor-lit", lit);
    hasLitChars ||= lit;
  });

  target.element.classList.toggle("is-cursor-text-active", hasLitChars);
}

export function init() {
  window[CLEANUP_KEY]?.();

  const cleanups = [];
  const hoverTargets = $$(PERSISTENT_HOVER_SELECTOR);
  const spotlightSurfaces = $$(CURSOR_SPOTLIGHT_SURFACE_SELECTOR);
  const spotlightTextTargets = collectCursorTextTargets();
  let spotlightRafId = 0;
  let lastSpotlightPoint = null;

  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  }

  function supportsPersistentHover(event) {
    return finePointerQuery.matches && event.pointerType !== "touch";
  }

  function pointerGlowEnabled(event) {
    return finePointerQuery.matches && !prefersReducedMotion() && event.pointerType !== "touch";
  }

  function clearHoverTarget(target) {
    target.classList.remove(HOVER_ACTIVE_CLASS, HOVER_ANIMATION_CLASS);
  }

  hoverTargets.forEach((target) => {
    let pointerInside = false;
    let focused = false;
    let activatedAt = 0;
    let timer = 0;

    function clearTimer() {
      if (!timer) return;
      window.clearTimeout(timer);
      timer = 0;
    }

    function activate() {
      clearTimer();
      activatedAt = performance.now();
      target.classList.add(HOVER_ACTIVE_CLASS);
      target.classList.remove(HOVER_ANIMATION_CLASS);
      void target.offsetWidth;
      target.classList.add(HOVER_ANIMATION_CLASS);
    }

    function deactivate(hold = true) {
      clearTimer();
      if (pointerInside || focused) return;

      const elapsed = performance.now() - activatedAt;
      const remaining = hold ? Math.max(0, PERSISTENT_HOVER_MS - elapsed) : 0;

      timer = window.setTimeout(() => {
        timer = 0;
        if (!pointerInside && !focused) clearHoverTarget(target);
      }, remaining);
    }

    listen(target, "pointerenter", (event) => {
      if (!supportsPersistentHover(event)) return;
      pointerInside = true;
      activate();
    }, { passive: true });

    listen(target, "pointerleave", (event) => {
      if (!supportsPersistentHover(event)) return;
      pointerInside = false;
      deactivate(true);
    }, { passive: true });

    listen(target, "pointercancel", () => {
      pointerInside = false;
      deactivate(false);
    }, { passive: true });

    listen(target, "focusin", () => {
      focused = true;
      activate();
    });

    listen(target, "focusout", () => {
      focused = false;
      deactivate(false);
    });

    cleanups.push(() => {
      clearTimer();
      clearHoverTarget(target);
    });
  });

  function syncCursorSpotlight() {
    spotlightRafId = 0;
    if (!lastSpotlightPoint) return;

    spotlightSurfaces.forEach(target => {
      setCursorSpotlightVars(target, lastSpotlightPoint, getCursorSpotlightRadius(target));
    });

    spotlightTextTargets.forEach(target => {
      syncCursorTextTarget(target, lastSpotlightPoint);
    });
  }

  function scheduleCursorSpotlight(point = lastSpotlightPoint) {
    if (!point) return;
    lastSpotlightPoint = point;

    if (!spotlightRafId) {
      spotlightRafId = window.requestAnimationFrame(syncCursorSpotlight);
    }
  }

  function clearCursorSpotlight() {
    if (spotlightRafId) {
      window.cancelAnimationFrame(spotlightRafId);
      spotlightRafId = 0;
    }

    lastSpotlightPoint = null;
    spotlightSurfaces.forEach(clearCursorSpotlightVars);
    spotlightTextTargets.forEach(clearCursorTextTarget);
  }

  listen(window, "pointermove", (event) => {
    if (!pointerGlowEnabled(event)) {
      clearCursorSpotlight();
      return;
    }

    scheduleCursorSpotlight({ x: event.clientX, y: event.clientY });
  }, { passive: true });

  listen(window, "scroll", () => {
    scheduleCursorSpotlight();
  }, { passive: true });

  listen(window, "resize", () => {
    scheduleCursorSpotlight();
  }, { passive: true });

  function clearTransientState() {
    hoverTargets.forEach(clearHoverTarget);
    clearCursorSpotlight();
  }

  function handleCapabilityChange() {
    if (!finePointerQuery.matches || prefersReducedMotion()) {
      clearTransientState();
    }
  }

  const unobserveReducedMotion = onReducedMotionChange(handleCapabilityChange);
  finePointerQuery.addEventListener("change", handleCapabilityChange);

  listen(window, "blur", clearTransientState);
  listen(document, "visibilitychange", () => {
    if (document.hidden) clearTransientState();
  });

  function destroy() {
    unobserveReducedMotion();
    finePointerQuery.removeEventListener("change", handleCapabilityChange);
    cleanups.splice(0).forEach((cleanup) => cleanup());

    if (window[CLEANUP_KEY] === destroy) {
      delete window[CLEANUP_KEY];
    }
  }

  window[CLEANUP_KEY] = destroy;
  return destroy;
}
