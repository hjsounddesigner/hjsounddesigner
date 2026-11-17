// Hakjun Lee portfolio — minimal vanilla JS (no build step)
(() => {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1) footer year */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* 2) hero waveform: deterministic pseudo-random bars */
  const wave = document.querySelector("[data-wave]");
  if (wave) {
    const N = 72;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < N; i++) {
      const env = Math.sin((i / (N - 1)) * Math.PI); // louder in the middle
      const h = Math.max(0.08, Math.min(1, 0.15 + env * 0.65 * (0.4 + rnd() * 0.6)));
      const s = document.createElement("span");
      s.style.setProperty("--h", h.toFixed(3));
      s.style.setProperty("--d", (1.6 + rnd() * 1.8).toFixed(2) + "s");
      s.style.setProperty("--delay", (-rnd() * 3).toFixed(2) + "s");
      wave.appendChild(s);
    }
  }

  /* 3) scroll reveal */
  const items = document.querySelectorAll(".reveal");
  if (REDUCED || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  /* 4) works filter (chips) */
  const chips = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll("[data-category]");
  chips.forEach((chip) =>
    chip.addEventListener("click", () => {
      const f = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      cards.forEach((card) => (card.hidden = f !== "all" && card.dataset.category !== f));
    })
  );

  /* 5) mobile menu */
  const html = document.documentElement;
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("site-nav");
  if (toggle && menu) {
    const set = (open) => {
      html.classList.toggle("menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      const label = toggle.querySelector(".nav__toggle-label");
      if (label) label.textContent = open ? "Close" : "Menu";
    };
    toggle.addEventListener("click", () => set(!html.classList.contains("menu-open")));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    // 데스크톱 폭으로 돌아오면 자동으로 닫기
    matchMedia("(min-width: 761px)").addEventListener("change", (m) => { if (m.matches) set(false); });
  }

  /* 6) proposal form → mailto */
  const form = document.querySelector("[data-proposal]");
  if (form) {
    const TO = "2hakjun15@naver.com";
    const note = form.querySelector("[data-form-note]");
    let type = "Game Audio";
    form.querySelectorAll("[data-type]").forEach((chip) =>
      chip.addEventListener("click", () => {
        type = chip.dataset.type;
        form.querySelectorAll("[data-type]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      })
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const name = String(f.get("name") || "").trim();
      const email = String(f.get("email") || "").trim();
      const project = String(f.get("project") || "").trim();
      const message = String(f.get("message") || "").trim();
      const bad = [];
      if (!name) bad.push("name");
      if (!/^\S+@\S+\.\S+$/.test(email)) bad.push("email");
      if (!message) bad.push("message");
      form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
      if (bad.length) {
        bad.forEach((n) => form.elements[n].classList.add("is-invalid"));
        form.elements[bad[0]].focus();
        note.textContent = "이름, 이메일, 메시지를 확인해주세요.";
        note.classList.add("is-error");
        return;
      }
      note.classList.remove("is-error");
      const subject = `[Proposal] ${type}${project ? " — " + project : ""} / ${name}`;
      const body = `Type: ${type}\nName: ${name}\nEmail: ${email}\nProject: ${project || "-"}\n\n${message}\n`;
      location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      note.textContent = "메일 앱이 열리지 않으면 " + TO + " 로 직접 보내주세요.";
    });
  }
})();
