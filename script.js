/**
 * Constellation Explorer — Interactive Simulation
 *
 * Architecture (all in one file for zero-build compatibility):
 *   StarData       — real HYG-derived astronomical coordinates
 *   EventBus       — pub/sub decoupling layer
 *   SkyProjection  — stereographic RA/Dec → canvas pixel transform
 *   StarCatalog    — indexed data-access layer
 *   SkyRenderer    — canvas rendering engine with viewport animation
 *   UIController   — sidebar list, search, details panel
 *
 * Data is split across three files:
 *   data/geometry.generated.js  — star positions + line topology
 *                                 (auto-generated from HYG v4.1 + Stellarium)
 *   data/editorial.js           — hand-written mythology / facts / season
 *   script.js (this file)       — engine; merges the two at runtime
 */

// ═══════════════════════════════════════════════════════════════
// 1. DATA — generated GEOMETRY joined with hand-written EDITORIAL
// ═══════════════════════════════════════════════════════════════
//
// Star positions and constellation line topology are produced by
// tools/generate.mjs (from the HYG + Stellarium datasets) and loaded via
// data/geometry.generated.js. Narrative content — mythology, nickname,
// fun facts, season, IAU area — lives in data/editorial.js. The two
// concerns are kept fully separate and joined here at runtime, so a
// constellation still renders even if its editorial entry is absent.

const GEO = window.GEOMETRY  || { stars: [], constellations: [] };
const EDU = window.EDITORIAL || {};

const STARS = GEO.stars;

const CONSTELLATIONS = GEO.constellations.map(c => {
  const e = EDU[c.id] || {};
  return {
    id:           c.id,
    name:         c.name,
    abbreviation: c.abbreviation,
    nickname:     e.nickname  || "",
    center:       c.center,
    season:       e.season    || "\u2014",
    hemisphere:   c.hemisphere,
    area:         e.area      || "\u2014",
    mythology:    e.mythology || "No description available yet.",
    facts:        e.facts     || [],
    stars:        c.stars,
    lines:        c.lines,
  };
});


// ═══════════════════════════════════════════════════════════════
// 2. EVENT BUS
// ═══════════════════════════════════════════════════════════════

class EventBus {
  constructor() { this._map = {}; }
  on(ev, fn)   { (this._map[ev] = this._map[ev] || []).push(fn); }
  off(ev, fn)  { if (this._map[ev]) this._map[ev] = this._map[ev].filter(h => h !== fn); }
  emit(ev, d)  { (this._map[ev] || []).forEach(h => h(d)); }
}
const bus = new EventBus();


// ═══════════════════════════════════════════════════════════════
// 3. STAR CATALOG (data-access layer)
// ═══════════════════════════════════════════════════════════════

class StarCatalog {
  constructor(stars, constellations) {
    this._byId    = {};
    stars.forEach(s => { this._byId[s.id] = s; });
    this._cons    = constellations;
    this._consById = {};
    constellations.forEach(c => { this._consById[c.id] = c; });
  }

  allConstellations()  { return this._cons; }
  constellation(id)    { return this._consById[id]; }
  star(id)             { return this._byId[id]; }

  constellationStars(conId) {
    const con = this._consById[conId];
    if (!con) return [];
    return con.stars.map(id => this._byId[id]).filter(Boolean);
  }

  constellationLines(conId) {
    const con = this._consById[conId];
    if (!con) return [];
    return con.lines
      .map(([a, b]) => ({ a: this._byId[a], b: this._byId[b] }))
      .filter(p => p.a && p.b);
  }

  search(q) {
    if (!q) return this._cons;
    const lq = q.toLowerCase();
    return this._cons.filter(c =>
      c.name.toLowerCase().includes(lq) ||
      c.nickname.toLowerCase().includes(lq) ||
      c.abbreviation.toLowerCase().includes(lq)
    );
  }

  hitTest(px, py, proj, r = 14) {
    let best = null, bestD = r * r;
    this._cons.forEach(con => {
      con.stars.forEach(sid => {
        const s = this._byId[sid];
        if (!s) return;
        const pt = proj.project(s.ra, s.dec);
        if (!pt) return;
        const d = (px - pt.x) ** 2 + (py - pt.y) ** 2;
        if (d < bestD) { bestD = d; best = { star: s, conId: con.id }; }
      });
    });
    return best;
  }
}


// ═══════════════════════════════════════════════════════════════
// 4. SKY PROJECTION  (stereographic, Calabretta & Greisen 2002)
// ═══════════════════════════════════════════════════════════════

class SkyProjection {
  constructor(canvas) {
    this.canvas = canvas;
    this.vp = { centerRa: 5.57, centerDec: 2.0, fovDeg: 70 };
    this._anim = null;
  }

  project(raH, decD) {
    const PI  = Math.PI;
    const ra0 = this.vp.centerRa  * PI / 12;
    const d0  = this.vp.centerDec * PI / 180;
    const ra  = raH  * PI / 12;
    const d   = decD * PI / 180;
    let dra = ra - ra0;
    if (dra >  PI) dra -= 2 * PI;
    if (dra < -PI) dra += 2 * PI;
    const cosc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(dra);
    if (cosc <= 0) return null;
    const k  = 2 / (1 + cosc);
    const px = k * Math.cos(d) * Math.sin(dra);
    const py = k * (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(dra));
    const sc = this._scale();
    return { x: this.canvas.width / 2 + px * sc, y: this.canvas.height / 2 - py * sc };
  }

  animateTo(ra, dec, fov, done) {
    if (this._anim) cancelAnimationFrame(this._anim);
    const s = Object.assign({}, this.vp);
    let dra = ra - s.centerRa;
    if (dra >  12) dra -= 24;
    if (dra < -12) dra += 24;
    const dDec = dec - s.centerDec, dFov = fov - s.fovDeg;
    const N = 45; let f = 0;
    const step = () => {
      f++;
      const t = 1 - Math.pow(1 - f / N, 3);
      this.vp.centerRa  = ((s.centerRa  + dra  * t) + 24) % 24;
      this.vp.centerDec =   s.centerDec + dDec * t;
      this.vp.fovDeg    =   s.fovDeg    + dFov * t;
      this._anim = f < N ? requestAnimationFrame(step) : null;
      if (f >= N && done) done();
    };
    this._anim = requestAnimationFrame(step);
  }

  _scale() {
    const r = 2 * Math.tan(this.vp.fovDeg * Math.PI / 360);
    return (Math.min(this.canvas.width, this.canvas.height) / 2 * 0.88) / r;
  }
}


// ═══════════════════════════════════════════════════════════════
// 5. SKY RENDERER
// ═══════════════════════════════════════════════════════════════

class SkyRenderer {
  constructor(canvas, proj, catalog) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext("2d");
    this.proj     = proj;
    this.catalog  = catalog;
    this._sel     = null;
    this._bg      = [];

    this._resize();
    this._makeBg();
    window.addEventListener("resize", () => { this._resize(); this._makeBg(); });

    canvas.addEventListener("click", e => {
      const r   = canvas.getBoundingClientRect();
      const hit = catalog.hitTest(e.clientX - r.left, e.clientY - r.top, proj);
      bus.emit("constellation:select", { id: hit ? hit.conId : null });
    });

    // Cursor affordance only (no selection/render change): pointer when the
    // cursor is over a selectable star, plain arrow otherwise.
    let _cursor = "default";
    canvas.addEventListener("mousemove", e => {
      const r   = canvas.getBoundingClientRect();
      const hit = catalog.hitTest(e.clientX - r.left, e.clientY - r.top, proj);
      const next = hit ? "pointer" : "default";
      if (next !== _cursor) { canvas.style.cursor = _cursor = next; }
    });

    this._loop();
  }

  select(id) {
    this._sel = id;
    if (id) {
      const con = this.catalog.constellation(id);
      if (con) this.proj.animateTo(con.center.ra, con.center.dec, this._fovFor(con));
    }
  }

  /**
   * Field-of-view-independent stereographic coordinates of a star relative
   * to a projection centre. Only the final pixel scale depends on the FOV,
   * so these normalised (x, y) values let us size the zoom analytically
   * before committing to a viewport. Returns null for points on the far
   * hemisphere.
   */
  _projNorm(centerRa, centerDec, raH, decD) {
    const PI  = Math.PI;
    const ra0 = centerRa  * PI / 12,  d0 = centerDec * PI / 180;
    const ra  = raH       * PI / 12,  d  = decD      * PI / 180;
    let dra = ra - ra0;
    if (dra >  PI) dra -= 2 * PI;
    if (dra < -PI) dra += 2 * PI;
    const cosc = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(dra);
    if (cosc <= 0) return null;
    const k = 2 / (1 + cosc);
    return {
      x: k * Math.cos(d) * Math.sin(dra),
      y: k * (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(dra)),
    };
  }

  /**
   * Adaptive zoom — choose a field of view so the selected constellation's
   * pattern fills ~78% of the chart on its dominant (binding) axis, keeping
   * every member star comfortably on-screen.
   *
   * Method: the pattern's bounding box is measured in FOV-independent
   * stereographic units. We pick the largest pixel scale that (a) keeps both
   * the width and height within FILL of their own frame dimension — so wide
   * figures fill the width and tall figures fill the height — and (b) never
   * pushes the most extreme star past the frame edge. That scale is then
   * inverted through the projection's scale relation to a FOV in degrees.
   */
  _fovFor(con) {
    const W = this.canvas.width, H = this.canvas.height;
    const stars = this.catalog.constellationStars(con.id);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of stars) {
      const p = this._projNorm(con.center.ra, con.center.dec, s.ra, s.dec);
      if (!p) continue;
      if (p.x < minX) minX = p.x;  if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;  if (p.y > maxY) maxY = p.y;
    }
    if (!isFinite(minX)) return 30;

    const Bx = Math.max(maxX - minX, 1e-6);
    const By = Math.max(maxY - minY, 1e-6);
    const minDim = Math.min(W, H);

    const FILL = 0.78; // target fill on the binding axis (mid of the 70-80% band)
    // Largest scale keeping each axis within FILL of its own frame dimension.
    const scaleFill = Math.min(FILL * W / Bx, FILL * H / By);
    // Per-axis no-clip caps: screen centre maps to con.center, 6% safety margin.
    const exX = Math.max(Math.abs(minX), Math.abs(maxX), 1e-6);
    const exY = Math.max(Math.abs(minY), Math.abs(maxY), 1e-6);
    const scale = Math.min(scaleFill, 0.94 * (W / 2) / exX, 0.94 * (H / 2) / exY);

    // Invert  scale = (minDim/2 * 0.88) / (2 * tan(fov/2))  →  fov.
    const tanHalf = (minDim * 0.88) / (4 * scale);
    const fovDeg  = 2 * Math.atan(tanHalf) * 180 / Math.PI;
    // Floor of 3 deg lets physically tiny figures (Crux, Lyra) still fill the
    // frame; stereographic distortion is negligible at these small fields.
    return Math.max(3, Math.min(45, fovDeg));
  }

  /** Display radius for a star; selected stars get a visibility floor. */
  _radius(s, hi) {
    const r = Math.max(1.2, 4.5 - s.mag * 0.65);
    return hi ? Math.max(5.5, r * 1.7) : r;
  }

  _resize() {
    const p = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = p.width;
    this.canvas.height = p.height;
  }

  _makeBg() {
    let s = 0xdeadbeef;
    const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
    this._bg = [];
    for (let i = 0; i < 1800; i++) {
      const ra    = rng() * 24;
      const dec   = Math.asin(rng() * 2 - 1) * 180 / Math.PI;
      const mag   = 3.5 + rng() * 3.0;
      const alpha = 0.12 + (6.5 - mag) / 6.5 * 0.38;
      this._bg.push({ ra, dec, mag, alpha });
    }
  }

  _loop() {
    const draw = () => { this._draw(); requestAnimationFrame(draw); };
    requestAnimationFrame(draw);
  }

  _draw() {
    const { canvas, ctx } = this;
    const W = canvas.width, H = canvas.height;

    // Background
    const g = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.75);
    g.addColorStop(0, "#0a1628"); g.addColorStop(1, "#010810");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const hasSel = !!this._sel;

    // Background stars — strongly faded once a constellation is selected,
    // so the chosen figure stands out against a quiet ground.
    const bgFade = hasSel ? 0.22 : 1;
    for (const s of this._bg) {
      const pt = this.proj.project(s.ra, s.dec);
      if (!pt) continue;
      const r = Math.max(0.4, 1.8 - (s.mag - 3.5) * 0.3);
      ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, 2*Math.PI);
      ctx.fillStyle = "rgba(200,216,255," + (s.alpha * bgFade) + ")"; ctx.fill();
    }

    // Constellations — when a selection exists, non-selected ones drop to a
    // faint ghost so the active figure dominates.
    for (const con of this.catalog.allConstellations()) {
      const hi = con.id === this._sel;
      if (hasSel && !hi) {
        this._lines(con.id, false, 0.16);
        this._stars(con.id, false, 0.22);
      } else {
        this._lines(con.id, hi);
        this._stars(con.id, hi);
        if (hi) this._labels(con.id);
      }
    }

    // On-chart educational overlay (name + nickname of the selected figure).
    this._overlay();

    // Hint (only when nothing is selected)
    if (!hasSel) {
      ctx.font = "12px 'Segoe UI',sans-serif"; ctx.fillStyle = "rgba(100,140,200,0.4)";
      ctx.textAlign = "center";
      ctx.fillText("Click a star or use the list", W/2, H - 16);
      ctx.textAlign = "left";
    }
  }

  _lines(conId, hi, alphaMul = 1) {
    const ctx = this.ctx;
    ctx.strokeStyle = hi
      ? "rgba(255,230,100," + (0.85 * alphaMul) + ")"
      : "rgba(90,130,210," + (0.22 * alphaMul) + ")";
    ctx.lineWidth = hi ? 1.6 : 1.0;
    for (const { a, b } of this.catalog.constellationLines(conId)) {
      const pa = this.proj.project(a.ra, a.dec);
      const pb = this.proj.project(b.ra, b.dec);
      if (!pa || !pb) continue;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
  }

  _stars(conId, hi, alphaMul = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alphaMul;
    for (const s of this.catalog.constellationStars(conId)) {
      const pt = this.proj.project(s.ra, s.dec);
      if (!pt) continue;
      const r = this._radius(s, hi);
      if (hi) {
        const gw = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 5);
        gw.addColorStop(0, "rgba(255,230,80,0.50)");
        gw.addColorStop(1, "rgba(255,200,50,0)");
        ctx.beginPath(); ctx.arc(pt.x, pt.y, r * 5, 0, 2*Math.PI);
        ctx.fillStyle = gw; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, 2*Math.PI);
      ctx.fillStyle = hi ? "#ffe87c" : "#c8d8ff"; ctx.fill();
    }
    ctx.restore();
  }

  _labels(conId) {
    const ctx = this.ctx;
    ctx.font = "11px 'Segoe UI',sans-serif"; ctx.fillStyle = "rgba(255,240,200,0.90)";
    for (const s of this.catalog.constellationStars(conId)) {
      const pt = this.proj.project(s.ra, s.dec);
      if (!pt) continue;
      const r = this._radius(s, true);
      ctx.fillText(s.name, pt.x + r + 5, pt.y + 4);
    }
  }

  /** Unobtrusive on-chart label: constellation name + nickname (top-left). */
  _overlay() {
    if (!this._sel) return;
    const con = this.catalog.constellation(this._sel);
    if (!con) return;
    const ctx = this.ctx;
    const x = 24, y = 38;
    ctx.save();
    ctx.textAlign = "left";
    // Name
    ctx.font = "600 26px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,233,140,0.92)";
    ctx.fillText(con.name, x, y);
    // Thin accent underline
    const w = ctx.measureText(con.name).width;
    ctx.strokeStyle = "rgba(255,217,102,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + w, y + 6); ctx.stroke();
    // Nickname + abbreviation
    ctx.font = "italic 14px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "rgba(150,180,220,0.78)";
    ctx.fillText(con.nickname + "  ·  " + con.abbreviation, x, y + 26);
    ctx.restore();
  }
}


// ═══════════════════════════════════════════════════════════════
// 6. UI CONTROLLER
// ═══════════════════════════════════════════════════════════════

class UIController {
  constructor(catalog, renderer) {
    this.catalog  = catalog;
    this.renderer = renderer;
    this._cur     = null;
  }

  init() {
    this._buildList(this.catalog.allConstellations());
    this._bindSearch();
    this._bindKeys();
    this._renderDetails(null);

    bus.on("constellation:select", ({ id }) => {
      this._cur = id;
      this.renderer.select(id);
      this._highlightItem(id);
      this._renderDetails(id);
    });
  }

  _buildList(cons) {
    const ul = document.getElementById("constellation-list");
    ul.innerHTML = "";
    cons.forEach(con => {
      const li = document.createElement("li");
      li.className  = "con-item";
      li.dataset.id = con.id;
      li.setAttribute("role", "option");
      li.setAttribute("tabindex", "0");
      li.setAttribute("aria-selected", "false");
      li.innerHTML  = `<span class="con-name">${con.name}</span><span class="con-nick">${con.nickname}</span>`;
      li.addEventListener("click", () => bus.emit("constellation:select", { id: con.id }));
      ul.appendChild(li);
    });
    if (this._cur) this._highlightItem(this._cur);
  }

  _highlightItem(id) {
    document.querySelectorAll(".con-item").forEach(el => {
      const on = el.dataset.id === id;
      el.classList.toggle("active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  // Keyboard navigation for the constellation list (additive: emits the
  // same select event as a click; does not alter selection/search logic).
  _bindKeys() {
    const ul = document.getElementById("constellation-list");
    ul.addEventListener("keydown", (e) => {
      const items = [...ul.querySelectorAll(".con-item")];
      if (!items.length) return;
      const cur = document.activeElement.closest
        ? document.activeElement.closest(".con-item")
        : null;
      let idx = items.indexOf(cur);
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); items[Math.min(idx + 1, items.length - 1) || 0].focus(); break;
        case "ArrowUp":   e.preventDefault(); items[idx <= 0 ? 0 : idx - 1].focus(); break;
        case "Home":      e.preventDefault(); items[0].focus(); break;
        case "End":       e.preventDefault(); items[items.length - 1].focus(); break;
        case "Enter":
        case " ":         e.preventDefault(); if (cur) bus.emit("constellation:select", { id: cur.dataset.id }); break;
        default: break;
      }
    });
  }

  _bindSearch() {
    const input   = document.getElementById("search-input");
    const noRes   = document.getElementById("no-results");
    input.addEventListener("input", () => {
      const res = this.catalog.search(input.value.trim());
      this._buildList(res);
      noRes.hidden = res.length > 0;
    });
  }

  _renderDetails(id) {
    const panel = document.getElementById("details-panel");
    if (!id) {
      panel.innerHTML = "<p class=\"details-placeholder\">Select a constellation to see details.</p>";
      return;
    }
    const con   = this.catalog.constellation(id);
    const stars = this.catalog.constellationStars(id).slice().sort((a,b) => a.mag - b.mag);
    const specClass = s => (s || "").trim().charAt(0).toUpperCase();
    panel.innerHTML = `
      <header class="cx-head">
        <div class="cx-titlerow">
          <h2 class="cx-title">${con.name}</h2>
          <span class="cx-abbr">${con.abbreviation}</span>
        </div>
        <p class="cx-nick">${con.nickname}</p>
      </header>
      <div class="cx-stats">
        <div class="cx-stat"><span class="cx-stat-label">Season</span><span class="cx-stat-value">${con.season}</span></div>
        <div class="cx-stat"><span class="cx-stat-label">Hemisphere</span><span class="cx-stat-value">${con.hemisphere}</span></div>
        <div class="cx-stat"><span class="cx-stat-label">Area</span><span class="cx-stat-value">${con.area}</span></div>
      </div>
      <section class="cx-section">
        <h3 class="cx-section-label">Mythology</h3>
        <p class="cx-myth">${con.mythology}</p>
      </section>
      <section class="cx-section">
        <h3 class="cx-section-label">Key Facts</h3>
        <ul class="cx-facts">${con.facts.map(f => `<li>${f}</li>`).join("")}</ul>
      </section>
      <section class="cx-section">
        <h3 class="cx-section-label">Stars <span class="cx-count">${stars.length}</span></h3>
        <table class="cx-table">
          <thead><tr><th>Name</th><th>Bayer</th><th class="cx-num">Mag</th><th class="cx-num">Type</th></tr></thead>
          <tbody>${stars.map(s =>
            `<tr><td class="cx-star-name">${s.name}</td><td>${s.bayer}</td><td class="cx-num cx-mag">${s.mag.toFixed(2)}</td><td class="cx-num cx-spec" data-spec="${specClass(s.spectral)}">${s.spectral}</td></tr>`
          ).join("")}</tbody>
        </table>
      </section>`;
  }
}


// ═══════════════════════════════════════════════════════════════
// 7. BOOTSTRAP
// ═══════════════════════════════════════════════════════════════

(function init() {
  const catalog  = new StarCatalog(STARS, CONSTELLATIONS);
  const canvas   = document.getElementById("sky-canvas");
  const proj     = new SkyProjection(canvas);
  const renderer = new SkyRenderer(canvas, proj, catalog);
  const ui       = new UIController(catalog, renderer);
  ui.init();
})();
