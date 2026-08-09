import { observeIntersection, onReducedMotionChange, prefersReducedMotion } from "./core/motion.js";

export function init() {
  const viewport = document.getElementById("templatesViewport");
  const track = document.getElementById("templatesTrack");
  if (!viewport || !track) return;

  const cards = Array.from(track.querySelectorAll("[data-template-card]"));
  const total = cards.length;
  if (!total) return;

  const SLIDE_SPEED = 0.15;
  const HOVER_PAUSE_MS = 800;
  const MOMENTUM_FACTOR = 8.5;
  const MAX_MOMENTUM_SLIDES = 1.2;
  const MAX_FRAME_DELTA = 32;
  const DRAG_START_THRESHOLD = 8;
  const DRAG_EASE = 5;
  const CLICK_PAUSE_MS = 50;
  let step = 320;
  let rafId = 0;
  let isRunning = false;
  let isIntersecting = !("IntersectionObserver" in window);
  let lastFrameTime = 0;
  let activeIndex = -1;
  let hoveredIndex = -1;
  let hoverPauseTimer = 0;
  let clickPauseTimer = 0;
  let pendingClickPause = false;
  let hoverPauseExpired = false;
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

  function depthForDistance(value) {
    return smoothstep(clamp(Math.abs(value) / 2.65, 0, 1));
  }

  function scaleForDistance(value) {
    const scaleDepth = smoothstep(clamp(Math.abs(value) / 2.35, 0, 1));
    return 0.45 + (1 - scaleDepth) * 0.75;
  }

  function xForDistance(distance) {
    const absDistance = Math.abs(distance);
    const side = Math.sign(distance);
    if (!side) return 0;

    const innerDistance = Math.min(absDistance, 1.08);
    const outerDistance = Math.max(absDistance - innerDistance, 0);
    const squeeze = smoothstep(clamp((absDistance - 1.08) / 1.92, 0, 1));
    const innerX = innerDistance * step * 1.03;
    const outerStep = step * (0.54 - squeeze * 0.18);

    return side * (innerX + outerDistance * outerStep);
  }

  function setAutoDirection(delta) {
    if (Math.abs(delta) < 0.001) return;
    autoDirection = delta > 0 ? 1 : -1;
  }

  function clearHoverPauseTimer() {
    if (!hoverPauseTimer) return;
    window.clearTimeout(hoverPauseTimer);
    hoverPauseTimer = 0;
  }

  function clearClickPauseTimer() {
    pendingClickPause = false;
    if (!clickPauseTimer) return;
    window.clearTimeout(clickPauseTimer);
    clickPauseTimer = 0;
  }

  function scheduleClickPause() {
    if (!pendingClickPause || clickPauseTimer) return;
    pendingClickPause = false;
    clickPauseTimer = window.setTimeout(() => {
      clickPauseTimer = 0;
      state.target = state.position;
      startTick();
    }, CLICK_PAUSE_MS);
  }

  function recalc() {
    const width = viewport.clientWidth;
    step = clamp(width * 0.292, 220, 338);
    const maxCardWidth = clamp(width * 0.314, 238, 362);
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
      const depth = depthForDistance(distance);
      const focus = 0.12 + (1 - smoothstep(clamp(absDistance / 1.65, 0, 1))) * 0.88;
      const x = xForDistance(distance);
      const y = Math.pow(depth, 1.28) * 20;
      const z = 22 + Math.pow(focus, 1.32) * 228;
      const rotateY = distance * -8.6 * (0.68 + 0.24 * depth);
      const rotateX = 4.5;
      const isActive = index === nextActiveIndex;
      const isHoverColorable = absDistance < 1.72;
      const baseScale = scaleForDistance(distance);
      const scale = baseScale;
      const naturalOpacity = 0.36 + focus * 0.64;
      const opacity = isActive || absDistance < 0.78
        ? 1
        : naturalOpacity;
      const titleAlpha = 0.56 + focus * 0.36;
      const titleShadowAlpha = 0.16 + focus * 0.1;
      const stackOrder = Math.max(0, 10000 - Math.round(absDistance * 1000));

      card.classList.toggle("is-hover-colorable", isHoverColorable);
      card.style.setProperty("--template-title-color", `rgba(226, 232, 240, ${titleAlpha.toFixed(3)})`);
      card.style.setProperty("--template-title-shadow-alpha", titleShadowAlpha.toFixed(3));
      card.style.zIndex = String(stackOrder + (isActive ? 1000 : 0));
      card.style.opacity = opacity.toFixed(3);
      card.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });
  }

  function hasPendingMotion() {
    return Math.abs(state.target - state.position) > 0.001;
  }

  function canIdleAutoplay() {
    return !state.tracking &&
      !pendingClickPause &&
      !clickPauseTimer &&
      isIntersecting &&
      !hasPendingMotion() &&
      (hoveredIndex < 0 || hoverPauseExpired);
  }

  function shouldRunFrame() {
    return !document.hidden && !prefersReducedMotion() && (state.dragging || hasPendingMotion() || canIdleAutoplay());
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

  const SETTLE_RATE = 12.5;

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
    } else if (canIdleAutoplay()) {
      state.target += SLIDE_SPEED * deltaSeconds * autoDirection;
      state.position = state.target;
    } else {
      const settleFollow = 1 - Math.exp(-SETTLE_RATE * deltaSeconds);
      state.position += (state.target - state.position) * settleFollow;
      if (Math.abs(state.target - state.position) < 0.001) {
        state.position = state.target;
        scheduleClickPause();
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
    clearHoverPauseTimer();
    clearClickPauseTimer();
    hoverPauseExpired = true;
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

    const momentum = prefersReducedMotion() || !wasMoved ? 0 : clamp(-velocity * MOMENTUM_FACTOR, -MAX_MOMENTUM_SLIDES, MAX_MOMENTUM_SLIDES);
    const weightedTarget = Math.round(state.target + momentum);
    setAutoDirection(weightedTarget - state.position);
    state.target = weightedTarget;
    if (prefersReducedMotion()) renderInteractionFrame();
    else startTick();
  }

  function focusCard(index) {
    clearHoverPauseTimer();
    clearClickPauseTimer();
    hoverPauseExpired = true;
    const shift = shortestDistance(index, state.position);
    setAutoDirection(shift);
    state.target = state.position + shift;
    pendingClickPause = true;

    if (Math.abs(shift) < 0.001) {
      state.target = state.position;
      updateCardStyles();
      scheduleClickPause();
      return;
    }

    if (prefersReducedMotion()) {
      renderInteractionFrame();
      scheduleClickPause();
    } else {
      startTick();
    }
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
    clearClickPauseTimer();
    setAutoDirection(shift);
    state.target += shift;
    if (prefersReducedMotion()) renderInteractionFrame();
    else startTick();
  }

  function setHoveredIndex(index) {
    if (hoveredIndex === index) return;

    const isTargetSettling = hasPendingMotion();
    clearHoverPauseTimer();
    hoverPauseExpired = state.dragging || state.tracking || isTargetSettling;
    hoveredIndex = index;
    cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-hovered", cardIndex === index);
    });

    if (index >= 0 && !state.dragging && !state.tracking && !isTargetSettling) {
      state.target = state.position;
      updateCardStyles();
      stopTick();
      hoverPauseTimer = window.setTimeout(() => {
        hoverPauseTimer = 0;
        if (hoveredIndex !== index || state.dragging || state.tracking) return;
        hoverPauseExpired = true;
        state.target = state.position;
        if (prefersReducedMotion()) renderInteractionFrame();
        else startTick();
      }, HOVER_PAUSE_MS);
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
    clearHoverPauseTimer();
    clearClickPauseTimer();
    stopTick();
    cleanupIntersection();
  }, { passive: true });
}
