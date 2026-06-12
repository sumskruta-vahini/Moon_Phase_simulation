/**
 * tools/generate.mjs — Constellation GEOMETRY generator.
 *
 * Reads:
 *   data/sources/hygdata_v41.csv         (HYG v4.1 star catalog — MIT/CC)
 *   data/sources/stellarium_western.json (Stellarium "western" sky culture)
 *
 * Emits:
 *   data/geometry.generated.js           (window.GEOMETRY = { stars, constellations })
 *
 * Scope: GEOMETRY ONLY — star positions/magnitudes and constellation line
 * topology, plus objectively-derived center/hemisphere. All prose (mythology,
 * nicknames, fun facts, polished season text, IAU area) is kept OUT of here and
 * lives in the hand-written data/editorial.js overlay. script.js merges the two
 * at runtime.
 *
 * Run:  node tools/generate.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC  = join(ROOT, "data", "sources");

// ── The locked educational set (IAU abbreviations, Stellarium casing) ──
const TARGETS = [
  "Ori", "UMa", "UMi", "Cas", "Sco", "Cyg", "Tau", "CMa", "Leo",
  "Gem", "Lyr", "Aql", "Peg", "And", "Boo", "Per", "Sgr", "Cru",
];

// ── Bayer 3-letter abbreviation → Greek letter (display only) ──
const GREEK = {
  Alp:"α", Bet:"β", Gam:"γ", Del:"δ", Eps:"ε",
  Zet:"ζ", Eta:"η", The:"θ", Iot:"ι", Kap:"κ",
  Lam:"λ", Mu:"μ",  Nu:"ν",  Xi:"ξ",  Omi:"ο",
  Pi:"π",  Rho:"ρ", Sig:"σ", Tau:"τ", Ups:"υ",
  Phi:"φ", Chi:"χ", Psi:"ψ", Ome:"ω",
};

// ── Minimal quote-aware CSV row splitter ──
function splitCsv(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

// ── Circular mean of RA (hours) so patterns straddling 0h/24h average right ──
function circularMeanRaHours(raList) {
  let sx = 0, sy = 0;
  for (const ra of raList) {
    const a = (ra / 24) * 2 * Math.PI;
    sx += Math.cos(a); sy += Math.sin(a);
  }
  let a = Math.atan2(sy, sx);
  if (a < 0) a += 2 * Math.PI;
  return (a / (2 * Math.PI)) * 24;
}

// ── 1. Stellarium: target constellations → line polylines + HIP set ──
const sky = JSON.parse(readFileSync(join(SRC, "stellarium_western.json"), "utf8"));
const byIau = {};
for (const c of sky.constellations) byIau[c.iau] = c;

const conSpec = [];      // { iau, name, polylines:[[hip..]], hipSet:Set }
const neededHip = new Set();
for (const iau of TARGETS) {
  const c = byIau[iau];
  if (!c) { console.warn("!! Stellarium missing constellation:", iau); continue; }
  // Newer Stellarium polylines may begin with a style token (e.g. "thin");
  // keep only the numeric HIP ids.
  const polylines = (c.lines || []).map(p => p.filter(x => typeof x === "number"));
  const hipSet = new Set();
  polylines.forEach(p => p.forEach(h => { hipSet.add(h); neededHip.add(h); }));
  conSpec.push({
    iau,
    name: (c.common_name && c.common_name.native) || iau,
    polylines,
    hipSet,
  });
}

// ── 2. HYG: pull the needed stars only ──
const csv = readFileSync(join(SRC, "hygdata_v41.csv"), "utf8").split(/\r?\n/);
const header = splitCsv(csv[0]);
const col = {};
header.forEach((h, i) => { col[h] = i; });

const starByHip = new Map();
for (let i = 1; i < csv.length; i++) {
  const line = csv[i];
  if (!line) continue;
  // Cheap pre-filter: the hip number is the 2nd field.
  const firstComma = line.indexOf(",");
  const secondComma = line.indexOf(",", firstComma + 1);
  const hipRaw = line.slice(firstComma + 1, secondComma);
  if (!hipRaw) continue;
  const hip = Number(hipRaw);
  if (!neededHip.has(hip)) continue;

  const f = splitCsv(line);
  const proper = f[col.proper].trim();
  const bayerAbbr = f[col.bayer].trim();          // e.g. "Alp"
  const con = f[col.con].trim();                  // e.g. "Ori"
  const greek = GREEK[bayerAbbr] || "";
  const bayerDisp = greek && con ? `${greek} ${con}` : "";
  const name = proper || bayerDisp || `HIP ${hip}`;

  starByHip.set(hip, {
    id: "hip" + hip,
    name,
    bayer: bayerDisp,
    hip,
    ra: +(+f[col.ra]).toFixed(4),
    dec: +(+f[col.dec]).toFixed(4),
    mag: +(+f[col.mag]).toFixed(2),
    con: con.toLowerCase(),
    spectral: f[col.spect].trim(),
  });
}

// Report any HIP referenced by lines but absent from HYG.
const missing = [...neededHip].filter(h => !starByHip.has(h));
if (missing.length) console.warn("!! HIP not found in HYG (segments skipped):", missing.join(", "));

// ── 3. Assemble geometry ──
const usedStarIds = new Set();
const constellations = conSpec.map(spec => {
  // Lines: expand polylines → unique id pairs, dropping any with a missing star.
  const lines = [];
  const seenPair = new Set();
  for (const poly of spec.polylines) {
    for (let i = 0; i + 1 < poly.length; i++) {
      const a = starByHip.get(poly[i]);
      const b = starByHip.get(poly[i + 1]);
      if (!a || !b) continue;
      const key = a.hip < b.hip ? a.hip + "-" + b.hip : b.hip + "-" + a.hip;
      if (seenPair.has(key)) continue;
      seenPair.add(key);
      lines.push([a.id, b.id]);
    }
  }
  // Stars actually present in HYG for this constellation.
  const stars = [...spec.hipSet]
    .filter(h => starByHip.has(h))
    .map(h => starByHip.get(h).id);
  stars.forEach(id => usedStarIds.add(id));

  // Center = circular-mean RA + mean Dec of member stars.
  const members = stars.map(id => [...starByHip.values()].find(s => s.id === id));
  const raMean = circularMeanRaHours(members.map(s => s.ra));
  const decMean = members.reduce((t, s) => t + s.dec, 0) / members.length;
  const hemisphere =
    decMean > 10  ? "Northern" :
    decMean < -10 ? "Southern" : "Equatorial (both hemispheres)";

  return {
    id: spec.iau.toLowerCase(),
    name: spec.name,
    abbreviation: spec.iau,
    center: { ra: +raMean.toFixed(3), dec: +decMean.toFixed(2) },
    hemisphere,
    stars,
    lines,
  };
});

// Only emit stars that are actually used by a constellation.
const stars = [...starByHip.values()]
  .filter(s => usedStarIds.has(s.id))
  .sort((a, b) => a.mag - b.mag);

// ── 4. Write classic-script geometry file ──
const banner =
`/**
 * data/geometry.generated.js  —  AUTO-GENERATED, do not edit by hand.
 * Regenerate with:  node tools/generate.mjs
 *
 * Sources:
 *   HYG Database v4.1 (Astronexus) — star positions, magnitudes, spectra.
 *   Stellarium "western" sky culture — constellation line topology.
 *
 * GEOMETRY ONLY. Mythology / nicknames / facts / season text / IAU area are
 * in data/editorial.js and merged at runtime by script.js.
 */`;

const body =
`window.GEOMETRY = {
  generatedAt: ${JSON.stringify(new Date().toISOString())},
  stars: ${JSON.stringify(stars, null, 0).replace(/\},\{/g, "},\n    {").replace(/^\[/, "[\n    ").replace(/\]$/, "\n  ]")},
  constellations: ${JSON.stringify(constellations, null, 2).replace(/\n/g, "\n  ")}
};
`;

writeFileSync(join(ROOT, "data", "geometry.generated.js"), banner + "\n" + body, "utf8");

console.log("Generated data/geometry.generated.js");
console.log("  constellations:", constellations.length);
console.log("  stars:", stars.length);
console.log("  star/line summary:");
for (const c of constellations) {
  console.log("   ", c.abbreviation.padEnd(4), "stars=" + String(c.stars.length).padEnd(3),
              "lines=" + String(c.lines.length).padEnd(3),
              "center=(" + c.center.ra + "h, " + c.center.dec + ")", c.hemisphere);
}
