import { $, $$ } from "./core/dom.js";

export function init() {
  const form = $("#contactForm");
  if (!form) return;
  const btn          = $("#contactBtn");
  const successPanel = $("#formSuccess");
  const nameInput    = $("#fname");
  const phoneInput   = $("#fphone");
  const serviceInput = $("#fservice");
  const msgArea      = $("#fmsg");
  const charCountEl  = $("#charCount");
  const phoneCode    = $("#fphoneCode");
  const phoneCountry = $("#fphoneCountry");
  const phoneButton  = $("#phoneCodeButton");
  const phoneList    = $("#phoneCodeList");
  const phoneFlag    = $("#phoneCodeFlag");
  const phoneText    = $("#phoneCodeText");
  const phoneWrap    = phoneButton?.closest(".phone-code-wrap");
  const phoneOptions = $$("[data-phone-option]");
  const currencySelect  = $("#fcurrency");
  const currencyButton  = $("#currencyButton");
  const currencyList    = $("#currencyList");
  const currencyFlag    = $("#currencyFlag");
  const currencyText    = $("#currencyText");
  const currencyWrap    = currencyButton?.closest(".currency-wrap");
  const currencyOptions = $$("[data-currency-option]");
  const budgetInput  = $("#fbudget");
  const budgetError  = $("#err-budget");
  const formError    = $("#formError");
  let budgetErrorTimer;

  const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}' .-]{1,79}$/u;
  const PHONE_RE = /^[0-9+() .-]+$/;
  const PHONE_MAX_DIGITS = Number(phoneInput?.dataset.maxDigits || 15);
  const UNSAFE_TEXT_RE = /[<>]|[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

  function normalizeSpaces(value) {
    return value.trim().replace(/\s+/g, " ");
  }

  function countDigits(value) {
    return (value.match(/\d/g) || []).length;
  }

  function limitPhoneDigits(value) {
    let digitCount = 0;
    return Array.from(value).filter(char => {
      if (!/\d/.test(char)) return true;
      digitCount += 1;
      return digitCount <= PHONE_MAX_DIGITS;
    }).join("");
  }

  function cleanPhoneValue(value) {
    return limitPhoneDigits(value)
      .replace(/[^0-9+() .-]/g, "")
      .replace(/(?!^)\+/g, "")
      .replace(/\s{2,}/g, " ")
      .slice(0, 20);
  }

  msgArea?.addEventListener("input", () => {
    const n = msgArea.value.length;
    charCountEl.textContent = n;
    charCountEl.style.color = n > 450 ? "rgba(220,100,100,0.8)" : "";
    if (n > 500) msgArea.value = msgArea.value.slice(0, 500);
  });

  function syncPhonePicker(option = phoneCode?.selectedOptions?.[0]) {
    if (!option || !phoneFlag || !phoneText) return;
    const iso = option.dataset.iso;
    const name = option.dataset.name || "";
    const code = option.dataset.code || option.value;
    if (iso) {
      phoneFlag.src = `https://flagcdn.com/w40/${iso}.png`;
      phoneFlag.srcset = `https://flagcdn.com/w40/${iso}.png 1x, https://flagcdn.com/w80/${iso}.png 2x`;
    }
    phoneFlag.alt = "";
    phoneText.textContent = code;
    if (phoneCountry) phoneCountry.value = name;
    phoneOptions.forEach(btn => {
      btn.setAttribute("aria-selected", btn.dataset.iso === iso && btn.dataset.name === name ? "true" : "false");
    });
  }

  function closePhonePicker() {
    if (!phoneButton || !phoneList) return;
    phoneButton.setAttribute("aria-expanded", "false");
    phoneList.hidden = true;
    phoneWrap?.classList.remove("is-open");
  }

  function openPhonePicker() {
    if (!phoneButton || !phoneList) return;
    phoneButton.setAttribute("aria-expanded", "true");
    phoneList.hidden = false;
    phoneWrap?.classList.add("is-open");
    phoneList.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }

  function togglePhonePicker() {
    if (phoneList?.hidden) openPhonePicker();
    else closePhonePicker();
  }

  function selectPhoneOption(btn) {
    if (!phoneCode || !btn) return;
    const iso = btn.dataset.iso;
    const code = btn.dataset.code;
    const name = btn.dataset.name;
    const option = Array.from(phoneCode.options).find(item =>
      item.dataset.iso === iso && item.dataset.code === code && item.dataset.name === name
    );
    if (!option) return;
    Array.from(phoneCode.options).forEach(item => { item.selected = item === option; });
    syncPhonePicker(option);
    phoneCode.dispatchEvent(new Event("change", { bubbles: true }));
    closePhonePicker();
    phoneButton?.focus();
  }

  phoneButton?.addEventListener("click", togglePhonePicker);
  phoneButton?.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPhonePicker();
      phoneList?.querySelector('[aria-selected="true"]')?.focus();
    }
  });
  phoneOptions.forEach(btn => {
    btn.addEventListener("click", () => selectPhoneOption(btn));
    btn.addEventListener("keydown", e => {
      const current = phoneOptions.indexOf(btn);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        phoneOptions[Math.min(current + 1, phoneOptions.length - 1)]?.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        phoneOptions[Math.max(current - 1, 0)]?.focus();
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectPhoneOption(btn);
      }
      if (e.key === "Escape") {
        closePhonePicker();
        phoneButton?.focus();
      }
    });
  });
  document.addEventListener("click", e => {
    if (!phoneWrap?.contains(e.target)) closePhonePicker();
  });
  phoneCode?.addEventListener("change", () => syncPhonePicker());
  syncPhonePicker();

  function syncCurrencyPicker(option = currencySelect?.selectedOptions?.[0]) {
    if (!option || !currencyFlag || !currencyText) return;
    const iso = option.dataset.iso;
    const label = option.dataset.label || option.value;
    const code = option.dataset.code || option.value;
    if (iso) {
      currencyFlag.src = `https://flagcdn.com/w40/${iso}.png`;
      currencyFlag.srcset = `https://flagcdn.com/w40/${iso}.png 1x, https://flagcdn.com/w80/${iso}.png 2x`;
    }
    currencyFlag.alt = "";
    currencyText.textContent = label;
    currencyOptions.forEach(btn => {
      btn.setAttribute("aria-selected", btn.dataset.code === code ? "true" : "false");
    });
  }

  function closeCurrencyPicker() {
    if (!currencyButton || !currencyList) return;
    currencyButton.setAttribute("aria-expanded", "false");
    currencyList.hidden = true;
    currencyWrap?.classList.remove("is-open");
  }

  function openCurrencyPicker() {
    if (!currencyButton || !currencyList) return;
    currencyButton.setAttribute("aria-expanded", "true");
    currencyList.hidden = false;
    currencyWrap?.classList.add("is-open");
    currencyList.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }

  function toggleCurrencyPicker() {
    if (currencyList?.hidden) openCurrencyPicker();
    else closeCurrencyPicker();
  }

  function selectCurrencyOption(btn) {
    if (!currencySelect || !btn) return;
    const code = btn.dataset.code;
    const option = Array.from(currencySelect.options).find(item => item.dataset.code === code);
    if (!option) return;
    Array.from(currencySelect.options).forEach(item => { item.selected = item === option; });
    syncCurrencyPicker(option);
    currencySelect.dispatchEvent(new Event("change", { bubbles: true }));
    closeCurrencyPicker();
    currencyButton?.focus();
  }

  currencyButton?.addEventListener("click", toggleCurrencyPicker);
  currencyButton?.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCurrencyPicker();
      currencyList?.querySelector('[aria-selected="true"]')?.focus();
    }
  });
  currencyOptions.forEach(btn => {
    btn.addEventListener("click", () => selectCurrencyOption(btn));
    btn.addEventListener("keydown", e => {
      const current = currencyOptions.indexOf(btn);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        currencyOptions[Math.min(current + 1, currencyOptions.length - 1)]?.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        currencyOptions[Math.max(current - 1, 0)]?.focus();
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectCurrencyOption(btn);
      }
      if (e.key === "Escape") {
        closeCurrencyPicker();
        currencyButton?.focus();
      }
    });
  });
  document.addEventListener("click", e => {
    if (!currencyWrap?.contains(e.target)) closeCurrencyPicker();
  });
  currencySelect?.addEventListener("change", () => syncCurrencyPicker());
  syncCurrencyPicker();

  function showBudgetDigitError() {
    if (!budgetError || !budgetInput) return;
    budgetError.textContent = "Use numeric digits only.";
    budgetInput.classList.add("field-invalid");
    window.clearTimeout(budgetErrorTimer);
    budgetErrorTimer = window.setTimeout(() => {
      budgetError.textContent = "";
      budgetInput.classList.remove("field-invalid");
    }, 2400);
  }

  function validateBudget() {
    if (!budgetError || !budgetInput) return true;
    const digits = budgetInput.value.replace(/\D/g, "").slice(0, 12);
    budgetInput.value = digits;

    let err = "";
    if (digits && Number(digits) <= 0) err = "Enter a realistic budget amount.";

    budgetError.textContent = err;
    budgetInput.classList.toggle("field-invalid", !!err);
    return !err;
  }

  budgetInput?.addEventListener("beforeinput", e => {
    if (e.data && /\D/.test(e.data)) {
      e.preventDefault();
      showBudgetDigitError();
    }
  });

  budgetInput?.addEventListener("paste", e => {
    const text = e.clipboardData?.getData("text") || "";
    if (!/\D/.test(text)) return;
    e.preventDefault();
    const start = budgetInput.selectionStart ?? budgetInput.value.length;
    const end = budgetInput.selectionEnd ?? start;
    const openSlots = Math.max(0, 12 - (budgetInput.value.length - (end - start)));
    const digits = text.replace(/\D/g, "").slice(0, openSlots);
    budgetInput.setRangeText(digits, start, end, "end");
    showBudgetDigitError();
    validateBudget();
  });

  budgetInput?.addEventListener("input", () => {
    const digits = budgetInput.value.replace(/\D/g, "").slice(0, 12);
    if (budgetInput.value !== digits) {
      budgetInput.value = digits;
      showBudgetDigitError();
    }
    if (budgetInput.classList.contains("field-invalid")) validateBudget();
  });

  phoneInput?.addEventListener("beforeinput", e => {
    if (!e.data || !/\d/.test(e.data)) return;
    const start = phoneInput.selectionStart ?? phoneInput.value.length;
    const end = phoneInput.selectionEnd ?? start;
    const next = phoneInput.value.slice(0, start) + e.data + phoneInput.value.slice(end);
    if (countDigits(next) > PHONE_MAX_DIGITS) e.preventDefault();
  });

  phoneInput?.addEventListener("paste", e => {
    const text = e.clipboardData?.getData("text") || "";
    const start = phoneInput.selectionStart ?? phoneInput.value.length;
    const end = phoneInput.selectionEnd ?? start;
    const next = phoneInput.value.slice(0, start) + text + phoneInput.value.slice(end);
    const clean = cleanPhoneValue(next);
    if (next === clean && countDigits(next) <= PHONE_MAX_DIGITS) return;
    e.preventDefault();
    phoneInput.value = clean;
    validate(phoneInput);
  });

  phoneInput?.addEventListener("input", () => {
    const clean = cleanPhoneValue(phoneInput.value);
    if (phoneInput.value !== clean) phoneInput.value = clean;
    if (phoneInput.classList.contains("field-invalid")) validate(phoneInput);
  });

  function hideError() {
    if (!formError) return;
    formError.hidden = true;
    formError.textContent = "";
  }

  function showError() {
    if (!formError) return;
    formError.textContent = "Something went wrong while sending your message. Please try again.";
    formError.hidden = false;
  }

  function validate(el) {
    if (!el) return false;
    const v = el.id === "fmsg" ? el.value.trim() : normalizeSpaces(el.value);
    let err = "";
    if (el.id === "fname") {
      el.value = v;
      if (!v) err = "Name is required.";
      else if (v.length < 2) err = "Min 2 characters.";
      else if (v.length > 80) err = "Name is too long.";
      else if (UNSAFE_TEXT_RE.test(v) || !NAME_RE.test(v)) err = "Use your real name without numbers or symbols.";
    }
    if (el.id === "fphone") {
      el.value = cleanPhoneValue(v);
      const phoneValue = el.value;
      const digitCount = phoneValue.replace(/\D/g, "").length;
      if (!phoneValue) err = "WhatsApp phone number is required.";
      else if (!PHONE_RE.test(phoneValue)) err = "Use numbers and phone separators only.";
      else if (digitCount < 5) err = "Enter a valid WhatsApp phone number.";
      else if (digitCount > PHONE_MAX_DIGITS) err = `Phone number can use up to ${PHONE_MAX_DIGITS} digits.`;
    }
    if (el.id === "fservice" && !el.value)  err = "Please select a service.";
    if (el.id === "fbudget") {
      return validateBudget();
    }
    if (el.id === "fmsg") {
      el.value = v;
      if (!v) err = "Please describe your project.";
      else if (v.length < 10) err = "Message too short.";
      else if (v.length > 500) err = "Message is too long.";
      else if (UNSAFE_TEXT_RE.test(v)) err = "Please remove special markup characters.";
    }
    const errEl = document.getElementById("err-" + el.name);
    if (errEl) errEl.textContent = err;
    el.classList.toggle("field-invalid", !!err);
    return !err;
  }

  ["fname","fphone","fservice","fbudget","fmsg"].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener("blur",  () => validate(el));
    el?.addEventListener("input", () => { if (el.classList.contains("field-invalid")) validate(el); });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    hideError();
    if (![validate(nameInput), validate(phoneInput), validate(serviceInput), validate(budgetInput), validate(msgArea)].every(Boolean)) {
      form.querySelector(".field-invalid")?.focus(); return;
    }
    btn.classList.add("loading"); btn.disabled = true;
    try {
      const body = new URLSearchParams(new FormData(form)).toString();
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (res.ok) showSuccess();
      else showError();
    } catch {
      showError();
    }
    finally { btn.classList.remove("loading"); btn.disabled = false; }
  });

  function showSuccess() {
    hideError();
    form.classList.add("fading");
    setTimeout(() => {
      form.hidden = true; form.classList.remove("fading");
      successPanel.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        successPanel.classList.add("visible");
        successPanel.scrollIntoView({ behavior:"smooth", block:"center" });
      }));
      setTimeout(() => {
        successPanel.classList.remove("visible"); successPanel.classList.add("exiting");
        setTimeout(() => {
          successPanel.classList.remove("exiting"); successPanel.hidden = true;
          form.reset();
          syncPhonePicker();
          closePhonePicker();
          syncCurrencyPicker();
          closeCurrencyPicker();
          $$(".field-invalid").forEach(el => el.classList.remove("field-invalid"));
          $$(".field-error").forEach(el => el.textContent = "");
          if (charCountEl) charCountEl.textContent = "0";
          form.classList.add("fading-in"); form.hidden = false;
          requestAnimationFrame(() => requestAnimationFrame(() => form.classList.remove("fading-in")));
        }, 480);
      }, 3500);
    }, 450);
  }
}
