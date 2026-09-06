function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export const DEFAULT_CURSOR_SPOTLIGHT_RADIUS = 132;

function rectIntersectsCircle(rect, x, y, radius) {
  if (!rect.width || !rect.height) return false;

  const closestX = clamp(x, rect.left, rect.right);
  const closestY = clamp(y, rect.top, rect.bottom);
  const dx = x - closestX;
  const dy = y - closestY;

  return (dx * dx) + (dy * dy) <= radius * radius;
}

function pointInsideRect(rect, x, y) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export function setRelativePointerVars(element, event) {
  if (!element || !event) return;

  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const x = clamp(((event.clientX - rect.left) / rect.width) * 100);
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100);

  element.style.setProperty("--mx", `${x.toFixed(2)}%`);
  element.style.setProperty("--my", `${y.toFixed(2)}%`);
  element.classList.add("is-pointer-active");
}

export function clearRelativePointerVars(element) {
  if (!element) return;

  element.style.setProperty("--mx", "50%");
  element.style.setProperty("--my", "50%");
  element.classList.remove("is-pointer-active");
}

export function setCursorSpotlightVars(element, point, radius = DEFAULT_CURSOR_SPOTLIGHT_RADIUS) {
  if (!element || !point) return false;

  const rect = element.getBoundingClientRect();
  if (!rectIntersectsCircle(rect, point.x, point.y, radius)) {
    clearCursorSpotlightVars(element);
    return false;
  }

  const localX = point.x - rect.left;
  const localY = point.y - rect.top;

  element.style.setProperty("--mx", `${localX.toFixed(2)}px`);
  element.style.setProperty("--my", `${localY.toFixed(2)}px`);
  element.style.setProperty("--cursor-spotlight-radius", `${radius}px`);
  element.classList.add("is-cursor-spotlit");
  element.classList.toggle("is-pointer-active", pointInsideRect(rect, point.x, point.y));

  return true;
}

export function clearCursorSpotlightVars(element) {
  if (!element) return;

  element.style.setProperty("--mx", "50%");
  element.style.setProperty("--my", "50%");
  element.style.removeProperty("--cursor-spotlight-radius");
  element.classList.remove("is-cursor-spotlit", "is-pointer-active");
}

export function rectIntersectsCursorSpotlight(rect, point, radius = DEFAULT_CURSOR_SPOTLIGHT_RADIUS) {
  if (!point) return false;
  return rectIntersectsCircle(rect, point.x, point.y, radius);
}
