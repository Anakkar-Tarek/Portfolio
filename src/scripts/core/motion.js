const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
export const finePointerQuery = window.matchMedia("(pointer: fine)");
const observerGroups = new Map();

export function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

export function onReducedMotionChange(handler) {
  reducedMotionQuery.addEventListener("change", handler);
  return () => reducedMotionQuery.removeEventListener("change", handler);
}

function observerKey(options) {
  const threshold = Array.isArray(options.threshold)
    ? options.threshold.join(",")
    : String(options.threshold ?? 0);

  return [
    options.root ? "root" : "viewport",
    options.rootMargin ?? "0px",
    threshold,
  ].join("|");
}

export function observeIntersection(target, callback, options = {}) {
  if (!target || !("IntersectionObserver" in window)) {
    callback({ isIntersecting: true, target });
    return () => {};
  }

  const key = observerKey(options);
  let group = observerGroups.get(key);

  if (!group) {
    const callbacks = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        callbacks.get(entry.target)?.forEach((handler) => handler(entry));
      });
    }, options);

    group = { callbacks, observer };
    observerGroups.set(key, group);
  }

  const callbacks = group.callbacks.get(target) ?? new Set();
  callbacks.add(callback);
  group.callbacks.set(target, callbacks);
  group.observer.observe(target);

  return () => {
    const targetCallbacks = group.callbacks.get(target);
    if (!targetCallbacks) return;

    targetCallbacks.delete(callback);
    if (targetCallbacks.size) return;

    group.callbacks.delete(target);
    group.observer.unobserve(target);

    if (!group.callbacks.size) {
      group.observer.disconnect();
      observerGroups.delete(key);
    }
  };
}
