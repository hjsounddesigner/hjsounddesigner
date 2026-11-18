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
    // &t=41s / &t=1m5s / &t=65 → 초 단위 시작 지점
    const startOf = (url) => {
      try {
        const t = new URL(url, location.href).searchParams.get("t") || "";
        const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
        return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
      } catch { return 0; }
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
        const start = startOf(url);
        a.href = `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`;
        if (start) a.dataset.start = start;
        a.target = "_blank";
        a.rel = "noopener";
        a.dataset.videoId = id;
        a.setAttribute("aria-label", `영상 ${i + 1} 재생`);
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

  /* 7-b) 팝업 뷰어: Works 영상(유튜브) · About 사례 문서(구글 드라이브)를 사이트 안에서 표시 */
  if (list || document.querySelector("[data-embed]")) {
    const modal = document.createElement("div");
    modal.className = "vmodal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "뷰어");
    modal.innerHTML =
      '<div class="vmodal__frame"><div class="vmodal__player"></div></div>' +
      '<button class="vmodal__close" type="button" aria-label="닫기">Close <i aria-hidden="true">✕</i></button>';
    document.body.appendChild(modal);
    const player = modal.querySelector(".vmodal__player");
    const closeBtn = modal.querySelector(".vmodal__close");
    let lastFocus = null;

    const open = (src, title, isDoc, from) => {
      lastFocus = from;
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = title;
      iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      player.replaceChildren(iframe);
      modal.classList.toggle("vmodal--doc", isDoc);
      modal.hidden = false;
      html.classList.add("modal-open");
      closeBtn.focus();
    };
    const close = () => {
      if (modal.hidden) return;
      modal.hidden = true;
      player.replaceChildren(); // iframe 제거 → 재생 중지
      html.classList.remove("modal-open");
      if (lastFocus) lastFocus.focus();
    };

    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-video-id], a[data-embed]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // 새 탭 열기 등은 그대로 원본 링크로
      e.preventDefault();
      if (a.dataset.embed) open(a.dataset.embed, a.dataset.title || "문서 보기", true, a);
      else open(`https://www.youtube-nocookie.com/embed/${encodeURIComponent(a.dataset.videoId)}?autoplay=1&rel=0&playsinline=1${a.dataset.start ? `&start=${a.dataset.start}` : ""}`, "YouTube video player", false, a);
    });
    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => { if (e.target === modal || e.target.classList.contains("vmodal__frame")) close(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* 7-c) About: 드라이브 문서 썸네일 (공유 설정이 풀려 있지 않으면 자리표시 유지) */
  document.querySelectorAll(".case__thumb img[data-src]").forEach((img) => {
    img.addEventListener("error", () => img.remove());
    img.src = img.dataset.src;
  });

  /* 7-d) 탭 이동 제스처 — Home ↔ Works ↔ About ↔ Analysis ↔ Contact (메뉴 순서 기준, Home 은 상단 브랜드 링크)
     · 좌우로 밀기: 모바일 터치 / 데스크톱 트랙패드 가로 스크롤(Shift+휠 포함) / 홈에서는 마우스 드래그도 가능
     · 홈 전용 SCROLL: 아래로 스크롤(휠 · ↓ · PageDown · Space) 또는 위로 스와이프(모바일), 혹은 SCROLL 을 누르면 Works 로
     · 다른 탭: 페이지 맨 아래에서 한 번 더 아래로 스크롤(휠 · ↓ · Space · 위로 스와이프)하면 다음 탭으로, Contact 에서는 Home 으로 */
  const tabs = [...document.querySelectorAll(".nav__brand, #site-nav a[href]")];
  const cur = tabs.findIndex((a) => a.getAttribute("aria-current") === "page");
  const scrollHint = document.querySelector(".scroll-hint");
  if (cur !== -1) {
    const interactive = "input, textarea, select, iframe, [data-no-swipe]";
    const blocked = () => html.classList.contains("menu-open") || html.classList.contains("modal-open");
    const scrollsX = (el) => {
      for (; el && el !== document.body; el = el.parentElement) {
        if (el.scrollWidth > el.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(el).overflowX)) return true;
      }
      return false;
    };
    let leaving = false;
    const leave = (href, mx, my) => {
      if (leaving) return;
      leaving = true;
      if (!REDUCED) {
        document.body.style.transition = "opacity 0.2s ease, transform 0.2s ease";
        document.body.style.opacity = "0";
        document.body.style.transform = `translate(${mx}px, ${my}px)`;
      }
      setTimeout(() => { location.href = href; }, REDUCED ? 0 : 180);
    };
    const step = (dir) => { const next = tabs[cur + dir]; if (next) leave(next.href, dir > 0 ? -28 : 28, 0); }; // +1: 다음 탭
    const toWorks = () => { if (scrollHint) leave(scrollHint.href, 0, -28); };
    const atBottom = () => scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    const down = () => { const next = tabs[cur + 1] || tabs[0]; if (next) leave(next.href, 0, -28); }; // 맨 아래에서 아래로 → 다음 탭 (마지막 탭 Contact 은 Home 으로 되돌아감)
    // 뒤로가기(bfcache)로 돌아왔을 때 페이지가 투명한 채로 남지 않게
    addEventListener("pageshow", () => { leaving = false; document.body.style.cssText = ""; });

    /* 터치 (모바일) */
    let t0 = null;
    addEventListener("touchstart", (e) => {
      t0 = null;
      if (e.touches.length !== 1 || blocked()) return;
      if (e.target.closest(interactive) || scrollsX(e.target)) return;
      const t = e.touches[0];
      t0 = { x: t.clientX, y: t.clientY, time: Date.now(), bottom: atBottom() };
    }, { passive: true });
    addEventListener("touchend", (e) => {
      if (!t0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - t0.x, dy = t.clientY - t0.y, dt = Date.now() - t0.time, startedAtBottom = t0.bottom;
      t0 = null;
      if (dt > 700) return;
      if (Math.abs(dx) >= 70 && Math.abs(dx) >= Math.abs(dy) * 1.6) step(dx < 0 ? 1 : -1); // 왼쪽으로 밀면 다음 탭
      else if (dy <= -70 && Math.abs(dy) >= Math.abs(dx) * 1.6) { // 위로 쓸어올리기
        if (scrollHint) toWorks(); // 홈: Works 로
        else if (startedAtBottom) down(); // 그 외: 맨 아래에서 한 번 더 쓸어올리면 다음 탭
      }
    }, { passive: true });

    /* 휠 / 트랙패드 (데스크톱) */
    let acc = 0, accAt = 0, wheelAt = 0, wheelBottom = false, wheelAcc = 0;
    addEventListener("wheel", (e) => {
      if (leaving || blocked() || e.ctrlKey) return;
      const ax = Math.abs(e.deltaX), ay = Math.abs(e.deltaY);
      if (ax > ay * 1.5) {
        if (e.target.closest(interactive) || scrollsX(e.target)) return;
        const now = Date.now();
        if (now - accAt > 250) acc = 0; // 관성 스크롤이 이어지는 동안만 누적
        accAt = now;
        acc += e.deltaX;
        if (Math.abs(acc) > 70) { step(acc > 0 ? 1 : -1); acc = 0; }
      } else if (scrollHint) {
        if (e.deltaY > 12 && ay > ax) toWorks();
      } else if (e.deltaY > 0 && ay > ax && !e.target.closest(interactive)) {
        // 맨 아래에 '이미' 닿아 있는 상태에서 시작한 스크롤만 인정 (관성 스크롤로 바닥에 닿은 경우는 제외)
        const now = Date.now();
        if (now - wheelAt > 250) { wheelBottom = atBottom(); wheelAcc = 0; }
        wheelAt = now;
        if (wheelBottom) { wheelAcc += e.deltaY; if (wheelAcc > 120) { wheelAcc = 0; down(); } }
      }
    }, { passive: true });

    /* 키보드 (홈) */
    if (scrollHint) {
      addEventListener("keydown", (e) => {
        if (!["ArrowDown", "PageDown", " "].includes(e.key) || e.target.closest("input, textarea, select, button, a")) return;
        e.preventDefault();
        toWorks();
      });
      scrollHint.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        toWorks();
      });
    }

    /* 키보드 (그 외 탭): 맨 아래에서 ↓ / PageDown / Space 를 한 번 더 누르면 다음 탭 */
    if (!scrollHint) {
      addEventListener("keydown", (e) => {
        if (e.repeat || blocked() || !["ArrowDown", "PageDown", " "].includes(e.key) || e.target.closest("input, textarea, select, button, a")) return;
        if (atBottom()) down();
      });
    }

    /* 마우스 드래그 (홈 전용 — 다른 페이지는 글 선택과 겹치므로 제외) */
    if (document.body.classList.contains("page-home")) {
      let d0 = null;
      addEventListener("pointerdown", (e) => {
        d0 = null;
        if (e.pointerType !== "mouse" || e.button !== 0 || blocked() || e.target.closest("a, button, " + interactive)) return;
        d0 = { x: e.clientX, y: e.clientY, time: Date.now() };
      });
      addEventListener("pointerup", (e) => {
        if (!d0) return;
        const dx = e.clientX - d0.x, dy = e.clientY - d0.y, dt = Date.now() - d0.time;
        d0 = null;
        if (dt < 900 && Math.abs(dx) >= 90 && Math.abs(dx) >= Math.abs(dy) * 1.6) step(dx < 0 ? 1 : -1);
      });
    }
  }

  /* 7-f) Contact: 문의 폼 → FormSubmit 으로 내 메일에 전달 */
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const f = contactForm.elements; // form.name 은 폼 자체 속성이라 elements 로 접근
    const error = document.getElementById("form-error");
    const status = document.getElementById("form-status");
    const submit = document.getElementById("form-submit");
    const MAIL = "2hakjun15@naver.com";
    const ENDPOINT = `https://formsubmit.co/ajax/${MAIL}`;
    const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const fail = (msg, field) => { error.textContent = msg; error.hidden = false; if (field) field.focus(); };

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = f.name.value.trim();
      const company = f.company.value.trim();
      const email = f.email.value.trim();
      const message = f.message.value.trim();

      f.name.setAttribute("aria-invalid", name ? "false" : "true");
      f.email.setAttribute("aria-invalid", EMAIL_OK.test(email) ? "false" : "true");
      f.message.setAttribute("aria-invalid", message ? "false" : "true");
      if (!name) return fail("이름을 적어 주세요.", f.name);
      if (!EMAIL_OK.test(email)) return fail("답장받을 이메일 주소를 확인해 주세요.", f.email);
      if (!message) return fail("내용을 적어 주세요.", f.message);
      if (f._honey.value) return; // 자동 스팸
      error.hidden = true;

      submit.disabled = true;
      submit.textContent = "보내는 중";
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            _subject: `[포트폴리오 문의] ${name}${company ? ` / ${company}` : ""}`,
            _template: "table",
            _replyto: email,
            이름: name,
            회사: company || "-",
            이메일: email,
            내용: message,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) !== "true") throw new Error(data.message || `HTTP ${res.status}`);
        contactForm.reset();
        status.textContent = "보냈습니다. 확인하는 대로 답장드릴게요.";
        submit.textContent = "보냈습니다";
      } catch (err) {
        fail(`보내지 못했습니다 (${err.message}). 잠시 후 다시 시도하거나 ${MAIL}으로 직접 메일을 보내 주세요.`);
        submit.textContent = "보내기";
        submit.disabled = false;
      }
    });
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
