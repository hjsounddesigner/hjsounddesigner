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
  let revealIO = null;
  const items = document.querySelectorAll(".reveal");
  if (REDUCED || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
  } else {
    revealIO = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); revealIO.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    items.forEach((el) => revealIO.observe(el));
  }

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

  /* 6) 페이지 제목: 글자마다 올라오며 등장 → 이후 물결 */
  document.querySelectorAll("[data-wave-title]").forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.innerHTML = [...text]
      .map((ch, i) => `<span class="ch" aria-hidden="true"><span style="--i:${i}">${ch === " " ? "&nbsp;" : ch}</span></span>`)
      .join("");
    requestAnimationFrame(() => setTimeout(() => el.classList.add("is-in"), 80));
    if (!REDUCED) setTimeout(() => el.classList.add("is-live"), 1000 + text.length * 65);
  });

  /* 7) Works: 유튜브 썸네일 (videos.js 의 주소 목록) */
  const list = document.querySelector("[data-videos]");
  if (list) {
    const idOf = (url) => {
      try {
        const u = new URL(url, location.href);
        if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0];
        if (u.searchParams.get("v")) return u.searchParams.get("v");
        const m = u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]{6,})/);
        return m ? m[1] : "";
      } catch { return ""; }
    };
    const urls = (window.VIDEOS || []).filter(Boolean);
    if (!urls.length) {
      list.innerHTML = Array.from({ length: 6 }, () =>
        '<li><div class="video video--empty" aria-hidden="true"><span class="video__play"></span><span class="video__label">Video slot</span></div></li>').join("");
    } else {
      urls.forEach((url, i) => {
        const id = idOf(url);
        if (!id) return;
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "video reveal";
        a.href = `https://www.youtube.com/watch?v=${id}`;
        a.target = "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", `영상 ${i + 1} 유튜브에서 보기`);
        const img = new Image();
        img.alt = "";
        img.loading = i < 3 ? "eager" : "lazy";
        img.decoding = "async";
        img.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
        // maxres 가 없는 영상은 120px 짜리 회색 이미지가 오므로 hq 로 교체
        img.addEventListener("load", () => { if (img.naturalWidth <= 120) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; });
        img.addEventListener("error", () => { if (!img.src.includes("hqdefault")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; });
        a.append(img, Object.assign(document.createElement("span"), { className: "video__play", ariaHidden: "true" }));
        li.append(a);
        list.append(li);
      });
      list.querySelectorAll(".reveal").forEach((el) => { if (REDUCED || !("IntersectionObserver" in window)) el.classList.add("is-in"); else if (revealIO) revealIO.observe(el); else el.classList.add("is-in"); });
    }
  }

  /* 8) 클릭하면 복사 */
  const copyBtns = document.querySelectorAll("[data-copy]");
  if (copyBtns.length) {
    const toast = Object.assign(document.createElement("div"), { className: "toast", role: "status" });
    document.body.appendChild(toast);
    let tt = 0;
    const show = (msg) => { toast.textContent = msg; toast.classList.add("is-on"); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove("is-on"), 1800); };
    const legacy = (text) => {
      const ta = Object.assign(document.createElement("textarea"), { value: text });
      ta.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch {}
      ta.remove(); return ok;
    };
    copyBtns.forEach((btn) =>
      btn.addEventListener("click", async () => {
        const text = btn.dataset.copy;
        let ok = false;
        try { await navigator.clipboard.writeText(text); ok = true; } catch { ok = legacy(text); }
        const hint = btn.querySelector(".copy__hint");
        if (ok) {
          btn.classList.add("is-copied");
          if (hint) hint.textContent = "Copied ✓";
          show(`복사했어요: ${text}`);
          setTimeout(() => { btn.classList.remove("is-copied"); if (hint) hint.textContent = "Copy"; }, 1800);
        } else {
          show("복사하지 못했어요. 직접 선택해서 복사해주세요.");
        }
      })
    );
  }

  /* 9) 링크가 아직 비어 있는 카드는 이동하지 않게 */
  document.querySelectorAll("[data-doc]").forEach((a) => {
    if (a.getAttribute("href") === "#") a.addEventListener("click", (e) => e.preventDefault());
  });
})();
