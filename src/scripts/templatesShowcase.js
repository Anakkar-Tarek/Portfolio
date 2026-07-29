import { observeIntersection, onReducedMotionChange, prefersReducedMotion } from "./core/motion.js";

export function init() {
  const viewport = document.getElementById("templatesViewport");
  const track = document.getElementById("templatesTrack");
  if (!viewport || !track) return;

  const cards = Array.from(track.querySelectorAll("[data-template-card]"));
  const total = cards.length;
  if (!total) return;

  const SLIDE_SPEED = 0.33;
  const MAX_FRAME_DELTA = 32;
  const DRAG_START_THRESHOLD = 8;
  const DRAG_EASE = 0.48;
  let step = 320;
  let rafId = 0;
  let isRunning = false;
  let isIntersecting = !("IntersectionObserver" in window);
  let lastFrameTime = 0;
  let activeIndex = -1;
  let hoveredIndex = -1;
  let autoDirection = 1;
  const state = {
    position: 0,
    target: 0,
    tracking: false,
    dragging: false,
    pointerId: null,
    startX: 0,
    startY: 0,
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

  function moveToward(current, target, amount) {
    const distance = target - current;
    if (Math.abs(distance) <= amount) return target;
    return current + Math.sign(distance) * amount;
  }

  function setAutoDirection(delta) {
    if (Math.abs(delta) < 0.001) return;
    autoDirection = delta > 0 ? 1 : -1;
  }

  function recalc() {
    const width = viewport.clientWidth;
    step = clamp(width * 0.2688, 190, 325);
    const maxCardWidth = clamp(width * 0.3696, 280, 426);
    viewport.style.setProperty("--template-step", `${step}px`);
    viewport.style.setProperty("--template-card-width", `${maxCardWidth}px`);
  }

  function syncActiveState(nextActiveIndex) {
    if (activeIndex === nextActiveIndex) return;

    cards.forEach((card, index) => {
      const isActive = index === nextActiveIndex;
      card.classList.toggle("is-active", isActive);
      card.setAttribute("aria-current", isActive ? "true" : "false");
    });

    activeIndex = nextActiveIndex;
  }

  function updateCardStyles() {
    const nextActiveIndex = wrapIndex(Math.round(state.position));
    syncActiveState(nextActiveIndex);

    cards.forEach((card, index) => {
      const distance = shortestDistance(index, state.position);
      const absDistance = Math.abs(distance);
      const depth = smoothstep(clamp(absDistance / 2.85, 0, 1));
      const focus = 0.14 + (1 - smoothstep(clamp(absDistance / 1.85, 0, 1))) * 0.86;
      const x = distance * step * (0.97 - depth * 0.04);
      const y = Math.pow(depth, 1.35) * 26;
      const z = 26 + Math.pow(focus, 1.4) * 206;
      const rotateY = distance * -10.5 * (0.7 + 0.3 * depth);
      const rotateX = 4.5;
      const isHovered = index === hoveredIndex;
      const baseScale = 0.88 + focus * 0.16;
      const scale = isHovered ? baseScale * 1.045 : baseScale;
      const opacity = isHovered ? 1 : 0.42 + focus * 0.58;

      card.style.zIndex = isHovered ? "1400" : String(1000 - Math.round(absDistance * 120));
      card.style.opacity = opacity.toFixed(3);
      card.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });
  }

  function hasPendingMotion() {
    return Math.abs(state.target - state.position) > 0.001;
  }

  function shouldRunFrame() {
    return !document.hidden && !prefersReducedMotion() && (state.dragging || hasPendingMotion() || (!state.tracking && hoveredIndex < 0 && isIntersecting));
  }

  function stopTick() {
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
    isRunning = false;
  }

  function startTick() {
    if (isRunning || !shouldRunFrame()) return;
    isRunning = true;
    lastFrameTime = performance.now();
    rafId = window.requestAnimationFrame(tick);
  }

  function renderInteractionFrame() {
    state.position = state.target;
    updateCardStyles();
  }

  const SETTLE_RATE = 9; // higher = snappier settle, lower = floatier

function tick(now) {
  if (!isRunning) return;
  if (!shouldRunFrame()) {
    rafId = 0;
    isRunning = false;
    return;
  }

  const deltaSeconds = Math.min(now - lastFrameTime, MAX_FRAME_DELTA) / 1000;
  lastFrameTime = now;

  if (state.dragging) {
    const dragFollow = 1 - Math.exp(-DRAG_EASE * 60 * deltaSeconds);
    state.position += (state.target - state.position) * dragFollow;
  } else if (!state.tracking && hoveredIndex < 0 && isIntersecting && !hasPendingMotion()) {
    // pure idle glide — constant speed, no easing needed, target IS position
    state.target += SLIDE_SPEED * deltaSeconds * autoDirection;
    state.position = state.target;
  } else {
    // settling after drag/focus/hover-release — real decelerating ease
    const settleFollow = 1 - Math.exp(-SETTLE_RATE * deltaSeconds);
    state.position += (state.target - state.position) * settleFollow;
    if (Math.abs(state.target - state.position) < 0.001) {
      state.position = state.target;
    }
  }

  updateCardStyles();
  rafId = window.requestAnimationFrame(tick);
} 

  function snapToNearest(extraShift = 0) {
    state.target = Math.round(state.target + extraShift);
  }

  function beginDrag(event) {
    state.dragging = true;
    state.moved = true;
    viewport.classList.add("is-dragging");
    viewport.setPointerCapture?.(event.pointerId);
    if (prefersReducedMotion()) renderInteractionFrame();
    else startTick();
  }

  function resetPointerState() {
    state.tracking = false;
    state.dragging = false;
    state.pointerId = null;
    state.velocity = 0;
    viewport.classList.remove("is-dragging");
  }

  function onPointerDown(event) {
    if (event.button && event.button !== 0) return;
    state.target = state.position;
    state.tracking = true;
    state.dragging = false;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startTarget = state.target;
    state.lastX = event.clientX;
    state.lastTime = performance.now();
    state.velocity = 0;
    state.moved = false;
  }

  function onPointerMove(event) {
    if (!state.tracking || state.pointerId !== event.pointerId) return;

    const now = performance.now();
    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    const deltaTime = Math.max(now - state.lastTime, 16);

    if (!state.dragging) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (Math.max(absX, absY) < DRAG_START_THRESHOLD) return;
      if (absY > absX) {
        resetPointerState();
        startTick();
        return;
      }
      beginDrag(event);
    }

    const previousTarget = state.target;
    state.target = state.startTarget - (deltaX / step);
    setAutoDirection(state.target - previousTarget);
    state.velocity = (event.clientX - state.lastX) / deltaTime;
    state.lastX = event.clientX;
    state.lastTime = now;

    if (prefersReducedMotion()) renderInteractionFrame();
    else startTick();
  }

  function onPointerUp(event) {
    if (!state.tracking || state.pointerId !== event.pointerId) return;
    if (!state.dragging) {
      resetPointerState();
      startTick();
      return;
    }

    const wasMoved = state.moved;
    const velocity = state.velocity;
    viewport.releasePointerCapture?.(event.pointerId);
    resetPointerState();

    const momentum = prefersReducedMotion() || !wasMoved ? 0 : clamp(-velocity * 6.5, -0.3, 0.3);
    setAutoDirection(momentum);
    snapToNearest(momentum);
    if (prefersReducedMotion()) renderInteractionFrame();
    else startTick();
  }

  function focusCard(index) {
    const shift = shortestDistance(index, state.target);
    setAutoDirection(shift);
    state.target += shift;
    snapToNearest();
    if (prefersReducedMotion()) renderInteractionFrame();
    else startTick();
  }

  function onResize() {
    recalc();
    updateCardStyles();
    startTick();
  }

  function onMotionChange() {
    if (prefersReducedMotion()) {
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

  function onWheel(event) {
    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    if (absX <= absY) return;

    const shift = clamp(event.deltaX / Math.max(step, 1), -0.75, 0.75);
    if (!shift) return;

    event.preventDefault();
    setAutoDirection(shift);
    state.target += shift;
    if (prefersReducedMotion()) renderInteractionFrame();
    else startTick();
  }

  function setHoveredIndex(index) {
    if (hoveredIndex === index) return;

    hoveredIndex = index;
    cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-hovered", cardIndex === index);
    });

    if (index >= 0 && !state.dragging && !state.tracking) {
      state.target = state.position;
      updateCardStyles();
      stopTick();
      return;
    }

    updateCardStyles();
    startTick();
  }

  viewport.addEventListener("pointerdown", onPointerDown);
  viewport.addEventListener("wheel", onWheel, { passive: false });
  cards.forEach((card, index) => {
    card.addEventListener("pointerenter", () => setHoveredIndex(index), { passive: true });
    card.addEventListener("pointerleave", () => {
      if (hoveredIndex === index) setHoveredIndex(-1);
    }, { passive: true });

    card.addEventListener("click", (event) => {
      if (state.moved) {
        event.preventDefault();
        state.moved = false;
        return;
      }
      focusCard(index);
    });
  });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("resize", onResize, { passive: true });
  onReducedMotionChange(onMotionChange);
  document.addEventListener("visibilitychange", onVisibilityChange);

  const cleanupIntersection = observeIntersection(viewport, (entry) => {
    isIntersecting = entry?.isIntersecting || false;
    if (isIntersecting) startTick();
    else stopTick();
  }, { threshold: 0.01 });

  recalc();
  updateCardStyles();
  startTick();

  window.addEventListener("beforeunload", () => {
    stopTick();
    cleanupIntersection();
  }, { passive: true });
}
