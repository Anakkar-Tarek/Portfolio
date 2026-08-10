import { finePointerQuery, onReducedMotionChange, prefersReducedMotion } from "./core/motion.js";

const CLEANUP_KEY = "__fbParticlesCleanup";
const CURSOR_TRAIL_COUNT = 14;
const CURSOR_TRAIL_RADIUS = 9;
const TRAIL_PARTICLE_INFLUENCE = 200;
const TRAIL_PARTICLE_FORCE = 0.036;
const CURSOR_TRAIL_SUPPRESS_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "summary",
  "form",
  "fieldset",
  "[role='button']",
  "[role='link']",
  "[role='slider']",
  "[role='option']",
  "[role='listbox']",
  "[tabindex]:not([tabindex='-1'])",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "li",
  "blockquote",
  ".nav-logo",
  ".nav-links",
  ".nav-cta",
  ".nav-toggle",
  ".nav-mobile",
  ".btn",
  ".section-label",
  ".section-title",
  ".service-card",
  ".service-tag",
  ".service-icon",
  ".service-arrow",
  ".stat-item",
  ".step",
  ".ba-c-badge",
  ".ba-c-metric",
  ".ba-peek-controls",
  ".ba-slider",
  ".ba-drag-overlay",
  ".templates-showcase",
  ".templates-viewport",
  ".template-card",
  ".contact-link",
  ".contact-form-panel",
  "#contactForm",
  ".form-field",
  ".field-combo",
  ".select-wrap",
  ".phone-code-list",
  ".footer-logo",
  ".footer-links",
  ".footer-tagline",
  ".footer-copy",
].join(",");

export function init() {
  window[CLEANUP_KEY]?.();

  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return () => {};

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};

  const pointer = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.3,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.3,
    velocityX: 0,
    velocityY: 0,
  };

  const coords = {
    x: pointer.targetX,
    y: pointer.targetY,
    active: false,
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
  let cursorCircles = [];
  let rafId = 0;
  let isRunning = false;
  let reducedMotion = prefersReducedMotion();
  let trailEnergy = 0;
  const cleanups = [];

  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  }

  function syncCanvasOpacity() {
    canvas.style.opacity = reducedMotion ? "0.19" : "0.78";
  }

  function cursorTrailEnabled() {
    return !reducedMotion && finePointerQuery.matches;
  }

  function targetSuppressesCursorTrail(target) {
    return !(target instanceof Element) || Boolean(target.closest(CURSOR_TRAIL_SUPPRESS_SELECTOR));
  }

  function createCursorTrail() {
    destroyCursorTrail();
    if (!cursorTrailEnabled()) return;

    const fragment = document.createDocumentFragment();

    for (let index = 0; index < CURSOR_TRAIL_COUNT; index += 1) {
      const circle = document.createElement("span");
      circle.className = "cursor-trail-circle";
      circle.setAttribute("aria-hidden", "true");
      circle.x = coords.x;
      circle.y = coords.y;
      fragment.append(circle);
      cursorCircles.push(circle);
    }

    document.body.append(fragment);
  }

  function destroyCursorTrail() {
    cursorCircles.forEach((circle) => circle.remove());
    cursorCircles = [];
  }

  function hideCursorTrail() {
    coords.active = false;
    trailEnergy = 0;
    cursorCircles.forEach((circle) => circle.classList.remove("is-visible"));
  }

  function makeParticle() {
    const col = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    const driftX = (Math.random() - 0.5) * (reducedMotion ? 0.08 : 0.3);
    const driftY = -(Math.random() * (reducedMotion ? 0.12 : 0.42) + (reducedMotion ? 0.03 : 0.1));

    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: driftX,
      vy: driftY,
      baseVx: driftX,
      baseVy: driftY,
      r: Math.random() * (reducedMotion ? 1.6 : 2.4) + 0.65,
      opacity: Math.random() * (reducedMotion ? 0.12 : 0.24) + (reducedMotion ? 0.08 : 0.16),
      col,
      twinkle: Math.random() * Math.PI * 2,
      twinkleFreq: (reducedMotion ? 0.004 : 0.01) + Math.random() * (reducedMotion ? 0.006 : 0.016),
      orbit: Math.random() * Math.PI * 2,
      orbitSpeed: (reducedMotion ? 0.0015 : 0.0035) + Math.random() * (reducedMotion ? 0.002 : 0.006),
      orbitRadius: Math.random() * (reducedMotion ? 0.12 : 0.24) + 0.05,
      trailHeat: 0,
    };
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = reducedMotion
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

  function setPointerPosition(x, y, movementX = 0, movementY = 0, target = null) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    pointer.velocityX = movementX || x - pointer.targetX;
    pointer.velocityY = movementY || y - pointer.targetY;
    pointer.targetX = x;
    pointer.targetY = y;
    coords.x = x;
    coords.y = y;

    if (!cursorTrailEnabled() || targetSuppressesCursorTrail(target)) {
      hideCursorTrail();
      return;
    }

    coords.active = true;
  }

  function updatePointer(event) {
    if (event.pointerType === "touch") {
      hideCursorTrail();
      return;
    }

    setPointerPosition(event.clientX, event.clientY, event.movementX, event.movementY, event.target);
  }

  function drawGlow(x, y, radius, alpha, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius * 3.4, 0, Math.PI * 2);
    ctx.fillStyle = color + (alpha * 0.16).toFixed(3) + ")";
    ctx.fill();
  }

  function activeTrailNodes() {
    return coords.active && cursorTrailEnabled()
      ? cursorCircles.filter((circle) => circle.classList.contains("is-visible"))
      : [];
  }

  function applyTrailInfluence(particle, trailNodes) {
    if (!trailNodes.length) return 0;

    let heat = 0;

    trailNodes.forEach((node, index) => {
      const dx = particle.x - node.x;
      const dy = particle.y - node.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > TRAIL_PARTICLE_INFLUENCE) return;

      const nodeWeight = 1 - index / Math.max(1, trailNodes.length);
      const falloff = 1 - distance / TRAIL_PARTICLE_INFLUENCE;
      const force = falloff * falloff * TRAIL_PARTICLE_FORCE * nodeWeight;

      particle.vx += (dx / distance) * force;
      particle.vy += (dy / distance) * force - force * 0.18;
      heat += falloff * nodeWeight;
    });

    return Math.min(1, heat * 0.35);
  }

  function drawParticles(advance = true) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const trailNodes = advance ? activeTrailNodes() : [];
    let nextTrailEnergy = 0;

    if (advance) {
      pointer.x += (pointer.targetX - pointer.x) * 0.11;
      pointer.y += (pointer.targetY - pointer.y) * 0.11;
      pointer.velocityX *= 0.9;
      pointer.velocityY *= 0.9;
    }

    const influenceRadius = advance && !reducedMotion
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

        const trailHeat = applyTrailInfluence(p, trailNodes);
        p.trailHeat += (trailHeat - p.trailHeat) * 0.16;
        nextTrailEnergy += p.trailHeat;

        const orbitX = Math.cos(p.orbit) * p.orbitRadius;
        const orbitY = Math.sin(p.orbit) * p.orbitRadius * 0.5;

        p.vx += (p.baseVx + orbitX - p.vx) * 0.035;
        p.vy += (p.baseVy + orbitY - p.vy) * 0.035;

        p.x += p.vx;
        p.y += p.vy;
        wrapParticle(p);
      }

      const alpha = p.opacity * (0.78 + 0.5 * Math.sin(p.twinkle)) * (1 + p.trailHeat * 0.42);
      drawGlow(p.x, p.y, p.r, alpha, p.col);

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + p.trailHeat * 0.38), 0, Math.PI * 2);
      ctx.fillStyle = p.col + alpha.toFixed(3) + ")";
      ctx.fill();
    });

    if (advance) {
      const normalizedEnergy = trailNodes.length
        ? Math.min(1, nextTrailEnergy / Math.max(1, particles.length * 0.14))
        : 0;
      trailEnergy += (normalizedEnergy - trailEnergy) * 0.12;
    }
  }

  function animateCursorTrail() {
    if (!cursorTrailEnabled() || !coords.active || !cursorCircles.length) return;

    let x = coords.x;
    let y = coords.y;
    const total = cursorCircles.length;

    cursorCircles.forEach((circle, index) => {
      const scale = (total - index) / total;
      const energyLift = trailEnergy * (1 - index / total);
      const opacity = Math.max(0.08, scale * (0.54 + energyLift * 0.18));
      const reactiveScale = scale * (1 + energyLift * 0.12);

      circle.classList.add("is-visible");
      circle.style.setProperty("--trail-opacity", opacity.toFixed(3));
      circle.style.setProperty("--trail-energy", energyLift.toFixed(3));
      circle.style.transform = `translate3d(${(x - CURSOR_TRAIL_RADIUS).toFixed(2)}px, ${(y - CURSOR_TRAIL_RADIUS).toFixed(2)}px, 0) scale(${reactiveScale.toFixed(3)})`;

      circle.x = x;
      circle.y = y;

      const nextCircle = cursorCircles[index + 1] || cursorCircles[0];
      x += (nextCircle.x - x) * 0.3;
      y += (nextCircle.y - y) * 0.3;
    });
  }

  function drawFrame(advance = true) {
    if (advance) animateCursorTrail();
    drawParticles(advance);
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
    if (!isRunning || document.hidden || reducedMotion) {
      rafId = 0;
      isRunning = false;
      return;
    }

    drawFrame(true);
    rafId = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (isRunning || document.hidden || reducedMotion) return;
    isRunning = true;
    animate();
  }

  function handleResize() {
    resize();
    if (reducedMotion) renderStaticFrame();
    else startAnimation();
  }

  function handleReducedMotionChange() {
    reducedMotion = prefersReducedMotion();
    syncCanvasOpacity();
    resize();

    if (!cursorTrailEnabled()) {
      destroyCursorTrail();
      renderStaticFrame();
    } else {
      createCursorTrail();
      startAnimation();
    }
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      hideCursorTrail();
      stopAnimation();
    } else if (reducedMotion) renderStaticFrame();
    else startAnimation();
  }

  function handlePointerCapabilityChange() {
    if (cursorTrailEnabled()) createCursorTrail();
    else destroyCursorTrail();
  }

  const unobserveReducedMotion = onReducedMotionChange(handleReducedMotionChange);
  finePointerQuery.addEventListener("change", handlePointerCapabilityChange);

  function destroy() {
    stopAnimation();
    unobserveReducedMotion();
    finePointerQuery.removeEventListener("change", handlePointerCapabilityChange);
    cleanups.splice(0).forEach((cleanup) => cleanup());
    destroyCursorTrail();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (window[CLEANUP_KEY] === destroy) {
      delete window[CLEANUP_KEY];
    }
  }

  syncCanvasOpacity();
  resize();
  createCursorTrail();
  if (reducedMotion) renderStaticFrame();
  else startAnimation();

  listen(window, "resize", handleResize, { passive: true });
  listen(window, "pointermove", updatePointer, { passive: true });
  listen(window, "pointerleave", hideCursorTrail, { passive: true });
  listen(window, "blur", hideCursorTrail);
  listen(document, "visibilitychange", handleVisibilityChange);
  listen(window, "beforeunload", destroy, { passive: true });

  window[CLEANUP_KEY] = destroy;
  return destroy;
}
