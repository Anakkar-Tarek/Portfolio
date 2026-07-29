import { onReducedMotionChange, prefersReducedMotion } from "./core/motion.js";

export function init() {
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
    canvas.style.opacity = prefersReducedMotion() ? "0.19" : "0.78";
  }

  function makeParticle() {
    const reduced = prefersReducedMotion();
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

    const count = prefersReducedMotion()
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

    const influenceRadius = advance && !prefersReducedMotion()
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
    if (!isRunning || document.hidden || prefersReducedMotion()) {
      rafId = 0;
      isRunning = false;
      return;
    }

    drawFrame(true);
    rafId = window.requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (isRunning || document.hidden || prefersReducedMotion()) return;
    isRunning = true;
    animate();
  }

  syncCanvasOpacity();
  resize();
  if (prefersReducedMotion()) renderStaticFrame();
  else startAnimation();

  window.addEventListener("resize", () => {
    resize();
    if (prefersReducedMotion()) renderStaticFrame();
    else startAnimation();
  }, { passive: true });
  window.addEventListener("pointermove", updatePointer, { passive: true });
  onReducedMotionChange(() => {
    syncCanvasOpacity();
    resize();
    if (prefersReducedMotion()) renderStaticFrame();
    else startAnimation();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else if (prefersReducedMotion()) renderStaticFrame();
    else startAnimation();
  });
  window.addEventListener("beforeunload", stopAnimation, { passive: true });
}
