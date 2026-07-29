export const $ = (selector, root = document) => root.querySelector(selector);

export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function fmt(number, format) {
  return format === "comma"
    ? Math.round(number).toLocaleString("en-US")
    : String(Math.round(number));
}
