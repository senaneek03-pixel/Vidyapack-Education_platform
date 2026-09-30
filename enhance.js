/* VidyaPack — frontend enhancements (drop-in, no dependencies, works offline)
 *
 * Loaded after the main script in index.html. Adds:
 *  - Theme switch (Auto / Light / Dark), remembered per device
 *  - Text-size control (A− / A+) for small screens and low vision
 *  - Online / offline status pill, so students know lessons still work offline
 *  - Remembers Low-resource mode and last opened tab; auto-suggests Low-resource on Data Saver / 2G
 *  - Keyboard shortcuts: Alt+1 / Alt+2 / Alt+3 switch tabs
 *  - Thin scroll-progress bar and a back-to-top button
 */
(function () {
  "use strict";

  /* ---------- Safe storage (private mode / blocked storage) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  const KEYS = { theme: "vp_theme", scale: "vp_text_scale", lowres: "vp_lowres", tab: "vp_last_tab" };
  const q = (s) => document.querySelector(s);
  const notify = (msg) => { if (typeof window.toast === "function") window.toast(msg); };

  /* ---------- Styles ---------- */
  const css = `
:root[data-theme="light"] {
  --paper:#fdf4ff; --paper-2:#fce7f3; --card:#ffffff; --card-glass:rgba(255,255,255,.9);
  --ink:#1e1b4b; --ink-soft:#6b5b95; --line:#ddd6fe; --indigo:#6366f1; --indigo-soft:#e0e7ff;
  --saffron:#d97706; --saffron-soft:#fef3c7; --pink:#db2777; --teal:#0d9488;
  --green:#059669; --green-soft:#d1fae5; --red:#dc2626; --red-soft:#fee2e2;
  --code-bg:#1e1b4b; --code-fg:#f8fafc;
  --shadow:0 10px 25px -5px rgba(99,40,170,.12),0 8px 10px -6px rgba(99,40,170,.06);
  color-scheme: light;
}
:root[data-theme="dark"] {
  --paper:#140f2d; --paper-2:#221a4d; --card:#1e1750; --card-glass:rgba(30,23,80,.85);
  --ink:#f8fafc; --ink-soft:#b7aee8; --line:#453a8f; --indigo:#818cf8; --indigo-soft:#3730a3;
  --saffron:#fbbf24; --saffron-soft:#78350f; --pink:#f472b6; --teal:#2dd4bf;
  --green:#34d399; --green-soft:#064e3b; --red:#fb7185; --red-soft:#7f1d1d;
  --code-bg:#020617; --code-fg:#f1f5f9;
  --shadow:0 10px 25px -5px rgba(0,0,0,.5),0 8px 10px -6px rgba(0,0,0,.5);
  color-scheme: dark;
}
html { font-size: calc(100% * var(--vp-scale, 1)); }
body { font-size: 1rem; }

.vp-tools { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.vp-seg { display:inline-flex; border:1px solid var(--line); border-radius:999px; overflow:hidden; }
.vp-seg button {
  background:transparent; color:var(--ink-soft); border:0; padding:5px 10px;
  font:600 .78rem var(--font-body); cursor:pointer; min-height:30px;
}
.vp-seg button + button { border-left:1px solid var(--line); }
.vp-seg button[aria-pressed="true"] { background:var(--indigo); color:#fff; }

.vp-net {
  display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px;
  font:600 .75rem var(--font-body); border:1px solid currentColor;
}
.vp-net::before { content:""; width:8px; height:8px; border-radius:50%; background:currentColor; }
.vp-net.on { color:var(--green); }
.vp-net.off { color:var(--saffron); }

#vpProgress {
  position:fixed; top:0; left:0; height:3px; width:100%; z-index:60; pointer-events:none;
  background:linear-gradient(90deg, var(--saffron), var(--pink), var(--indigo));
  transform-origin:0 50%; transform:scaleX(0);
}
#vpTop {
  position:fixed; right:16px; bottom:76px; z-index:50; width:44px; height:44px;
  border-radius:50%; border:1px solid var(--line); background:var(--card); color:var(--ink);
  font-size:1.2rem; cursor:pointer; box-shadow:var(--shadow);
  opacity:0; transform:translateY(10px); pointer-events:none;
  transition:opacity .2s ease, transform .2s ease;
}
#vpTop.show { opacity:1; transform:none; pointer-events:auto; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior:auto; }
  #vpTop { transition:none; }
}
body.lowres #vpProgress { display:none; }
`;
  const style = document.createElement("style");
  style.id = "vp-enhance-css";
  style.textContent = css;
  document.head.appendChild(style);

  const root = document.documentElement;
  const tools = q(".top-tools");

  /* ---------- Theme ---------- */
  function applyTheme(mode) {
    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode);
    else root.removeAttribute("data-theme");
    const meta = q('meta[name="theme-color"]') || document.head.appendChild(
      Object.assign(document.createElement("meta"), { name: "theme-color" }));
    meta.content = getComputedStyle(root).getPropertyValue("--paper").trim() || "#140f2d";
  }

  function segmented(label, options, current, onPick) {
    const wrap = document.createElement("div");
    wrap.className = "vp-seg";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", label);
    options.forEach(([value, text, title]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      b.title = title;
      b.dataset.value = value;
      b.setAttribute("aria-pressed", String(value === current));
      b.addEventListener("click", () => {
        wrap.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
        onPick(value);
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  const savedTheme = store.get(KEYS.theme) || "auto";
  applyTheme(savedTheme);
  const themeSeg = segmented("Colour theme", [
    ["auto", "Auto", "Follow device theme"],
    ["light", "☀", "Light theme"],
    ["dark", "☾", "Dark theme"]
  ], savedTheme, (v) => { store.set(KEYS.theme, v); applyTheme(v); });

  /* ---------- Text size ---------- */
  const SCALES = [0.9, 1, 1.12, 1.25];
  let scaleIdx = Math.max(0, SCALES.indexOf(parseFloat(store.get(KEYS.scale)) || 1));
  const applyScale = () => {
    root.style.setProperty("--vp-scale", SCALES[scaleIdx]);
    store.set(KEYS.scale, String(SCALES[scaleIdx]));
  };
  applyScale();
  const sizeSeg = document.createElement("div");
  sizeSeg.className = "vp-seg";
  sizeSeg.setAttribute("role", "group");
  sizeSeg.setAttribute("aria-label", "Text size");
  [["−", -1, "Smaller text"], ["+", 1, "Larger text"]].forEach(([t, d, title]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "A" + t;
    b.title = title;
    b.setAttribute("aria-label", title);
    b.addEventListener("click", () => {
      scaleIdx = Math.min(SCALES.length - 1, Math.max(0, scaleIdx + d));
      applyScale();
    });
    sizeSeg.appendChild(b);
  });

  /* ---------- Online / offline pill ---------- */
  const net = document.createElement("span");
  net.className = "vp-net";
  net.setAttribute("role", "status");
  net.setAttribute("aria-live", "polite");
  function updateNet(announce) {
    const on = navigator.onLine;
    net.className = "vp-net " + (on ? "on" : "off");
    net.textContent = on ? "Online" : "Offline — lessons still work";
    if (announce) notify(on ? "Back online" : "You're offline — saved lessons still open");
  }
  updateNet(false);
  window.addEventListener("online", () => updateNet(true));
  window.addEventListener("offline", () => updateNet(true));

  if (tools) {
    const box = document.createElement("div");
    box.className = "vp-tools";
    box.append(net, sizeSeg, themeSeg);
    tools.prepend(box);
  }

  /* ---------- Low-resource mode: remember + Data Saver hint ---------- */
  const lowres = q("#lowres");
  if (lowres) {
    const conn = navigator.connection || {};
    const saved = store.get(KEYS.lowres);
    const slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
    const want = saved === null ? slow : saved === "1";
    if (want && !lowres.checked) {
      lowres.checked = true;
      lowres.dispatchEvent(new Event("change")); // reuse existing handler (stops lab animation)
      if (saved === null) notify("Slow network detected — Low-resource mode turned on");
    }
    lowres.addEventListener("change", () => store.set(KEYS.lowres, lowres.checked ? "1" : "0"));
  }

  /* ---------- Tabs: remember last tab + Alt+1/2/3 ---------- */
  const tabNames = ["studio", "learn", "dash"];
  const goTab = (name) => {
    if (typeof window.switchTab !== "function" || !q("#tab-" + name)) return;
    window.switchTab(name);
    store.set(KEYS.tab, name);
  };
  tabNames.forEach((name, i) => {
    const btn = q("#tab-" + name);
    if (!btn) return;
    btn.addEventListener("click", () => store.set(KEYS.tab, name));
    btn.title = "Shortcut: Alt+" + (i + 1);
  });
  const lastTab = store.get(KEYS.tab);
  if (lastTab && tabNames.includes(lastTab) && lastTab !== "studio") goTab(lastTab);

  document.addEventListener("keydown", (e) => {
    if (!e.altKey || e.ctrlKey || e.metaKey) return;
    const i = ["1", "2", "3"].indexOf(e.key);
    if (i === -1) return;
    e.preventDefault();
    goTab(tabNames[i]);
    const btn = q("#tab-" + tabNames[i]);
    if (btn) btn.focus();
  });

  /* ---------- Scroll progress + back to top ---------- */
  const bar = document.createElement("div");
  bar.id = "vpProgress";
  bar.setAttribute("aria-hidden", "true");
  const topBtn = document.createElement("button");
  topBtn.id = "vpTop";
  topBtn.type = "button";
  topBtn.textContent = "↑";
  topBtn.setAttribute("aria-label", "Back to top");
  topBtn.addEventListener("click", () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.body.classList.contains("lowres");
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
  document.body.append(bar, topBtn);

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
      topBtn.classList.toggle("show", y > 500);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
})();
