(function () {
  "use strict";

  const FILMS = window.FILMS;
  const VIDEO = "https://www.youtube.com/watch?v=mlwD5SdMM7I&t=";
  const JW = "https://www.justwatch.com";
  const RENT = "In den USA und in Deutschland bei Amazon und Apple TV.";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ICON = {
    play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    eye: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M1.5 10S5 4 10 4s8.5 6 8.5 6-3.5 6-8.5 6S1.5 10 1.5 10z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="10" cy="10" r="2.6" fill="currentColor"/></svg>',
    film: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 7.5v5l4-2.5z" fill="currentColor"/></svg>',
    out: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4H4.5v11.5H16V12M11 4h5v5M16 4l-7 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- Gesehen-Status (nur in diesem Browser) ----------
  let seen = {};
  try { seen = JSON.parse(localStorage.getItem("hc-seen") || "{}") || {}; } catch (e) { seen = {}; }
  const saveSeen = () => { try { localStorage.setItem("hc-seen", JSON.stringify(seen)); } catch (e) { /* privat */ } };

  // ---------- Bausteine ----------
  function vhsBox(f) {
    return `
      <div class="vhs-stage">
        <div class="vhs" style="--poster:url('assets/posters/${f.id}.webp')">
          <div class="face front"><img src="assets/posters/${f.id}.webp" alt="Filmplakat ${esc(f.title)}" loading="lazy" width="592" height="846"><span class="sheen" aria-hidden="true"></span></div>
          <div class="face back" aria-hidden="true"><span>${esc(f.title)}</span></div>
          <div class="face spine" aria-hidden="true"><span class="spine-title">${esc(f.title)}</span><span class="spine-year">${f.year}</span></div>
          <div class="face side" aria-hidden="true"></div>
          <div class="face top" aria-hidden="true"></div>
          <div class="face bottom" aria-hidden="true"></div>
        </div>
      </div>`;
  }

  function services(list, none, free) {
    const tags = list.length
      ? list.map((s) => `<li class="svc${s === "Peacock" ? " svc-pk" : ""}">${esc(s)}</li>`).join("")
      : `<li class="svc-none">${esc(none || "Kein Abo.")}</li>`;
    return `<ul class="svc-list">${tags}</ul>${free ? `<p class="svc-free">${esc(free)}</p>` : ""}`;
  }

  function peacockBadge(f) {
    return f.peacock
      ? `<p class="pk pk-yes">${ICON.check}<span><b>Auf Peacock</b>${f.pkNote ? " · " + esc(f.pkNote) : ""}</span></p>`
      : `<p class="pk pk-no">${ICON.cross}<span><b>Nicht auf Peacock.</b> ${esc(f.notOn || "")}</span></p>`;
  }

  function timeline(f) {
    const items = f.timeline.map((e) => `
      <li class="tl-item${e.self ? " is-self" : ""}${e.planned ? " is-planned" : ""}">
        <span class="tl-year">${e.y}</span>
        <span class="tl-dot" aria-hidden="true"></span>
        <span class="tl-title">${esc(e.t)}${e.self ? " <em>(dieser Film)</em>" : ""}</span>
      </li>`).join("");
    return `<div class="tl-scroll"><ol class="tl">${items}</ol></div>${f.extra ? `<p class="tl-extra">${esc(f.extra)}</p>` : ""}`;
  }

  function seenButton(f) {
    const on = !!seen[f.id];
    return `<button class="btn btn-seen" type="button" data-seen="${f.id}" aria-pressed="${on}">${ICON.eye}<span>${on ? "Gesehen" : "Als gesehen markieren"}</span></button>`;
  }

  function actions(f) {
    return `
      <div class="actions">
        <button class="btn btn-primary" type="button" data-trailer="${f.trailer}" data-title="${esc(f.title)}">${ICON.film}<span>Trailer ansehen</span></button>
        ${seenButton(f)}
      </div>`;
  }

  function streamPanel(f) {
    return `
      <div class="stream">
        <h4>Streamen</h4>
        <div class="stream-cols">
          <div><p class="stream-label">Abo USA</p>${services(f.subsUs, f.noneUs, f.freeUs)}</div>
          <div><p class="stream-label">Abo Deutschland</p>${services(f.subsDe, f.noneDe, "")}</div>
        </div>
        <p class="stream-rent"><b>Leihen oder kaufen:</b> ${esc(f.rent || RENT)}</p>
        <p class="stream-links"><a href="${JW}${f.jwUs}" target="_blank" rel="noopener">JustWatch USA ${ICON.out}</a><a href="${JW}${f.jwDe}" target="_blank" rel="noopener">JustWatch Deutschland ${ICON.out}</a></p>
      </div>`;
  }

  function castList(f) {
    return `<ul class="cast">${f.cast.map(([n, r]) => `<li><span class="cast-name">${esc(n)}</span><span class="cast-role">${esc(r)}</span></li>`).join("")}</ul>`;
  }

  function meta(f) {
    return `<ul class="meta"><li>${f.year}</li><li>${esc(f.dir)}</li><li>${esc(f.min)}</li><li class="fsk fsk-${f.fsk}">FSK ${f.fsk}</li></ul>`;
  }

  function chapter(f) {
    const result = f.hit
      ? `<span class="res res-hit">${ICON.check}Erraten</span>`
      : `<span class="res res-miss">${ICON.cross}Nicht erraten</span>`;
    return `
    <article class="chapter${seen[f.id] ? " is-seen" : ""}" id="${f.id}" style="--accent:${f.accent}" data-peacock="${f.peacock}">
      <div class="chapter-bg" aria-hidden="true"><img src="assets/backdrops/${f.id}.webp" alt="" loading="lazy" decoding="async"></div>
      <div class="chapter-inner">
        <div class="osd-line">
          <span class="card-no">Karte ${String(f.no).padStart(2, "0")}</span>
          <a class="tc" href="${VIDEO}${f.t}s" target="_blank" rel="noopener" aria-label="Szene im Video ab ${f.tc} öffnen">${ICON.play}${f.tc}</a>
          <span>${esc(f.round)}</span>
          ${result}
        </div>
        <div class="chapter-top">
          ${vhsBox(f)}
          <div class="chapter-head">
            <h3>${esc(f.title)}</h3>
            ${f.titleDe !== f.title ? `<p class="title-de">${esc(f.titleDe)}</p>` : ""}
            ${meta(f)}
            ${peacockBadge(f)}
            <p class="story">${esc(f.story)}</p>
            ${actions(f)}
          </div>
        </div>
        <div class="chapter-details">
          <figure class="scene">
            <div class="crt">
              <div class="crt-screen">
                <video data-src="assets/clips/${f.id}.mp4" poster="assets/clips/${f.id}.jpg" muted loop playsinline preload="none" aria-label="Ausschnitt aus dem Video: ${esc(f.title)} wird vorgespielt"></video>
                <span class="crt-osd">▶ ${f.tc}</span>
              </div>
            </div>
            <figcaption><b>Im Video:</b> ${esc(f.scene)}</figcaption>
          </figure>
          <div class="detail-col">
            <h4>Hauptcast</h4>
            ${castList(f)}
          </div>
          <div class="detail-wide">
            <h4>Fortsetzungen und Reihe</h4>
            ${timeline(f)}
          </div>
          <div class="detail-wide">${streamPanel(f)}</div>
        </div>
      </div>
    </article>`;
  }

  function wrongCard(f) {
    return `
    <article class="wcard${seen[f.id] ? " is-seen" : ""}" id="${f.id}" style="--accent:${f.accent}" data-peacock="${f.peacock}">
      <div class="wcard-bg" aria-hidden="true"><img src="assets/backdrops/${f.id}.webp" alt="" loading="lazy" decoding="async"></div>
      <div class="wcard-inner">
        <div class="osd-line">
          <a class="tc" href="${VIDEO}${f.t}s" target="_blank" rel="noopener" aria-label="Stelle im Video ab ${f.tc} öffnen">${ICON.play}${f.tc}</a>
          <span>${esc(f.round)}</span>
          ${f.special ? `<span class="special">${esc(f.special)}</span>` : ""}
        </div>
        <div class="wcard-top">
          ${vhsBox(f)}
          <div class="chapter-head">
            <h3>${esc(f.title)}</h3>
            ${f.titleDe !== f.title ? `<p class="title-de">${esc(f.titleDe)}</p>` : ""}
            ${meta(f)}
            ${peacockBadge(f)}
          </div>
        </div>
        <p class="story">${esc(f.story)}</p>
        <p class="wscene"><b>Im Video:</b> ${esc(f.scene)}</p>
        ${actions(f)}
        <details class="more">
          <summary>Cast, Fortsetzungen und Streaming</summary>
          <div class="more-body">
            <h4>Hauptcast</h4>
            ${castList(f)}
            <h4>Fortsetzungen und Reihe</h4>
            ${timeline(f)}
            ${streamPanel(f)}
          </div>
        </details>
      </div>
    </article>`;
  }

  // ---------- Rendern ----------
  const listGame = document.getElementById("list-game");
  const listWrong = document.getElementById("list-wrong");
  listGame.innerHTML = FILMS.filter((f) => f.group === "game").map(chapter).join("");
  listWrong.innerHTML = FILMS.filter((f) => f.group === "wrong").map(wrongCard).join("");

  // ---------- Filter & Fortschritt ----------
  let filter = "all";
  function applyFilter() {
    let shown = { game: 0, wrong: 0 };
    FILMS.forEach((f) => {
      const el = document.getElementById(f.id);
      const show = filter === "all" ? true : filter === "peacock" ? f.peacock : !seen[f.id];
      el.hidden = !show;
      if (show) shown[f.group]++;
    });
    ["game", "wrong"].forEach((g) => {
      const list = document.getElementById("list-" + g);
      let empty = list.querySelector(".empty");
      if (!shown[g]) {
        if (!empty) { empty = document.createElement("p"); empty.className = "empty"; list.appendChild(empty); }
        empty.textContent = filter === "open" ? "Alle Filme hier hast du schon gesehen." : "Keine Filme in dieser Auswahl.";
      } else if (empty) { empty.remove(); }
    });
  }
  function updateProgress() {
    const n = FILMS.filter((f) => seen[f.id]).length;
    document.getElementById("seen-text").textContent = `${n} von ${FILMS.length} gesehen`;
    document.getElementById("seen-bar").style.transform = `scaleX(${n / FILMS.length})`;
    document.getElementById("open-count").textContent = FILMS.length - n;
  }

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      filter = chip.dataset.filter;
      document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      applyFilter();
    });
  });

  document.addEventListener("click", (e) => {
    const sb = e.target.closest("[data-seen]");
    if (sb) {
      const id = sb.dataset.seen;
      if (seen[id]) delete seen[id]; else seen[id] = true;
      saveSeen();
      const on = !!seen[id];
      sb.setAttribute("aria-pressed", String(on));
      sb.querySelector("span").textContent = on ? "Gesehen" : "Als gesehen markieren";
      document.getElementById(id).classList.toggle("is-seen", on);
      updateProgress();
      if (filter === "open") applyFilter();
      return;
    }
    const tb = e.target.closest("[data-trailer]");
    if (tb) openTrailer(tb.dataset.trailer, tb.dataset.title, tb);
  });

  applyFilter();
  updateProgress();

  // ---------- Trailer-Dialog ----------
  const dlg = document.getElementById("trailer");
  const frame = document.getElementById("trailer-frame");
  let lastTrigger = null;
  function openTrailer(id, title, trigger) {
    lastTrigger = trigger;
    document.getElementById("trailer-title").textContent = `Trailer: ${title}`;
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1" title="Trailer ${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function closeTrailer() {
    frame.innerHTML = "";
    if (dlg.open) dlg.close();
    if (lastTrigger) lastTrigger.focus();
  }
  dlg.querySelector(".trailer-close").addEventListener("click", closeTrailer);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeTrailer(); });
  // Escape selbst behandeln, damit der Trailer sicher stoppt
  dlg.addEventListener("cancel", (e) => { e.preventDefault(); closeTrailer(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && dlg.open) closeTrailer(); });
  dlg.addEventListener("close", () => { frame.innerHTML = ""; });

  // ---------- YouTube erst beim Klick laden ----------
  document.querySelectorAll(".yt-lite").forEach((box) => {
    box.querySelector(".yt-btn").addEventListener("click", () => {
      box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.id}?start=${box.dataset.start}&autoplay=1&rel=0" title="Hot Ones Versus: Inde Navarrette vs. Michael Johnston" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    });
  });

  // ---------- Clips nur abspielen, wenn sichtbar ----------
  const videos = document.querySelectorAll("video");
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const v = en.target;
        if (en.isIntersecting) {
          if (v.dataset.src && !v.src) v.src = v.dataset.src;
          if (!reduceMotion) v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    }, { rootMargin: "120px 0px" });
    videos.forEach((v) => vio.observe(v));
  } else {
    videos.forEach((v) => { if (v.dataset.src) v.src = v.dataset.src; });
  }
  if (reduceMotion) videos.forEach((v) => { v.removeAttribute("autoplay"); v.controls = true; });

  // ---------- VHS-Hüllen: Drehung beim Scrollen + Neigen mit der Maus ----------
  const stages = Array.from(document.querySelectorAll(".vhs-stage"));
  const tilt = new Map();
  stages.forEach((st) => {
    tilt.set(st, { x: 0, y: 0 });
    st.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = st.getBoundingClientRect();
      tilt.set(st, { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
    });
    st.addEventListener("pointerleave", () => tilt.set(st, { x: 0, y: 0 }));
  });
  let ticking = false;
  function updateBoxes() {
    ticking = false;
    const vh = window.innerHeight;
    stages.forEach((st) => {
      const r = st.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      const t = tilt.get(st);
      const ry = (reduceMotion ? 24 : 26 + p * 22) + t.x * 34;
      const rx = (reduceMotion ? -3 : -4 + p * -8) - t.y * 18;
      st.style.setProperty("--ry", ry.toFixed(2) + "deg");
      st.style.setProperty("--rx", rx.toFixed(2) + "deg");
      st.style.setProperty("--shine", (50 + t.x * 60 + p * 30).toFixed(1) + "%");
    });
  }
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(updateBoxes); } };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  document.addEventListener("pointermove", requestUpdate, { passive: true });
  updateBoxes();

  // ---------- Hintergrundbilder leicht verschieben (Parallax) ----------
  if (!reduceMotion) {
    const bgs = Array.from(document.querySelectorAll(".chapter-bg img"));
    let pTick = false;
    const parallax = () => {
      pTick = false;
      const vh = window.innerHeight;
      bgs.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        img.style.transform = `translate3d(0, ${(p * -60).toFixed(1)}px, 0) scale(1.12)`;
      });
    };
    window.addEventListener("scroll", () => { if (!pTick) { pTick = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  // ---------- VCR-Zähler im Kopf ----------
  const counter = document.getElementById("counter");
  if (counter && !reduceMotion) {
    let s = 17 * 60 + 30;
    setInterval(() => {
      s = s >= 19 * 60 + 42 ? 17 * 60 + 30 : s + 1;
      counter.textContent = `0:${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }, 1000);
  }

  // ---------- Erscheinen beim Scrollen ----------
  if ("IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("js-reveal");
    const rio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); rio.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".chapter, .wcard, .block-head, .game").forEach((el) => rio.observe(el));
  }
})();
