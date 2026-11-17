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
})();
