import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { $, fmt } from "./core/dom.js";
import { finePointerQuery, prefersReducedMotion } from "./core/motion.js";

export function init() {
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
  const peekButtons = scene ? Array.from(scene.querySelectorAll("[data-ba-peek]")) : [];
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
  const EDGE_INSET_PX = 8;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function pctFromClientX(clientX) {
    const rect = slider.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function edgeInsetPct() {
    const rect = slider.getBoundingClientRect();
    if (!rect.width) return 1.5;
    return Math.min(5, (EDGE_INSET_PX / rect.width) * 100);
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

  function updatePeekControls(value) {
    const activeSide = value >= 65 ? "before" : value <= 35 ? "after" : "";

    peekButtons.forEach((button) => {
      const target = Number(button.dataset.position || 50);
      const side = target > 50 ? "before" : "after";
      button.setAttribute("aria-pressed", String(side === activeSide));
    });
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
    const inset = edgeInsetPct();
    const value = clamp(pct, inset, 100 - inset);
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
      updatePeekControls(value);
    };

    if (instant) {
      apply();
    } else {
      raf = requestAnimationFrame(apply);
    }
  }

  if (finePointerQuery.matches && !prefersReducedMotion()) {
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

  peekButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = Number(button.dataset.position);
      if (!Number.isFinite(target)) return;

      introDone = true;
      setPos(target);
      gsap.fromTo(
        handle,
        { scaleX: 1.12, scaleY: 0.92 },
        { scaleX: 1, scaleY: 1, duration: 0.42, ease: "power3.out" }
      );
    });
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
}
