#!/usr/bin/env node
// sponsorship-credibility.mjs
// ──────────────────────────────────────────────────────────────────────────────
// Sample-size-aware sponsorship credibility (upstream feed for the Ch.11 Role
// Scorer's `sponsorship.p`).
//
// THE GAP THIS CLOSES
// The engine reads an employer's H-1B strength as a raw approval RATE. On the
// real DOL/USCIS-mapped file that rate is degenerate: 1262 of 1557 employers sit
// at exactly 100%, most of them on a handful of cases. A 2-of-2 employer and a
// 610-of-610 employer are indistinguishable — the ranking is a 1262-way tie
// broken by whatever order the rows happen to arrive in. A rate with no sample
// size is a confidence claim the record does not support.
//
// WHAT IT DOES
// Fits a Beta prior to the observed (approvals, denials) counts by beta-binomial
// maximum likelihood — the prior is ESTIMATED FROM THE DATA at run time, never
// hardcoded — then reports each employer's posterior mean
//
//     credibility = (alpha + approvals) / (alpha + beta + total)
//
// Small samples are pulled toward the fitted population rate; large samples keep
// their own evidence. The tie breaks in the direction the record supports.
//
// WHAT IT REFUSES TO DO
// An employer with no usable H-1B record is reported EMPTY (credibility null,
// tier "Unknown") — never 0. "No record" and "denied" are different facts, and
// collapsing them would be the fabrication this engine exists to prevent. Rows
// that are present but unparseable are counted as ERROR, separately from EMPTY.
//
// USAGE
//   node scripts/score/sponsorship-credibility.mjs                  # fit + audit
//   node scripts/score/sponsorship-credibility.mjs --compare        # raw vs adjusted top-10
//   node scripts/score/sponsorship-credibility.mjs --company "DATABRICKS INC"
//   node scripts/score/sponsorship-credibility.mjs --emit output/sponsorship-credibility.json
//   node scripts/score/sponsorship-credibility.mjs --min-n 0        # (default 0: no rows dropped)
//   node scripts/score/sponsorship-credibility.mjs --self-test      # invariants; exits 1 on failure
// ──────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_CSV = 'data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv';
const COL = { name: 'company_name', approvals: 'Total Approvals', denials: 'Total Denials' };

const argv = process.argv.slice(2);
const flag = (k, d = null) => {
  const i = argv.indexOf(k);
  return i === -1 ? d : (argv[i + 1] ?? true);
};
const has = (k) => argv.includes(k);

// ── CSV (quote-aware; the employer column contains commas) ───────────────────
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// ── load: EMPTY (no usable counts) is separated from ERROR (present, unparseable)
function load(csvPath, minN) {
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(raw);
  const header = rows.shift().map((h) => h.trim());
  const iName = header.indexOf(COL.name);
  const iA = header.indexOf(COL.approvals);
  const iD = header.indexOf(COL.denials);
  if (iName < 0 || iA < 0 || iD < 0) {
    console.error(`ERROR: expected columns ${Object.values(COL).join(' / ')} not found in ${csvPath}`);
    console.error('        (schema drift — refusing to guess column positions)');
    process.exit(2);
  }
  const scored = [], empty = [], error = [];
  const num = (x) => {
    const s = String(x ?? '').replace(/,/g, '').trim();
    if (s === '') return null;
    const v = Number(s);
    return Number.isFinite(v) ? v : NaN;
  };
  for (const r of rows) {
    if (r.length < header.length) continue;              // trailing blank line
    const name = String(r[iName] ?? '').trim();
    const a = num(r[iA]), d = num(r[iD]);
    if (a === null || d === null) { empty.push({ name, why: 'no H-1B counts on record' }); continue; }
    if (Number.isNaN(a) || Number.isNaN(d) || a < 0 || d < 0) { error.push({ name, why: 'unparseable counts' }); continue; }
    const n = a + d;
    if (n === 0) { empty.push({ name, why: 'zero filings on record' }); continue; }
    if (n < minN) { empty.push({ name, why: `below --min-n ${minN}` }); continue; }
    scored.push({ name, approvals: a, total: n });
  }
  return { scored, empty, error };
}

// ── beta-binomial MLE (grid + coordinate refine; no external deps) ───────────
function lgamma(z) {                                    // Lanczos g=7, n=9
  const g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1;
  let x = g[0];
  for (let i = 1; i < 9; i++) x += g[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function logLik(rows, alpha, beta) {
  if (!(alpha > 0) || !(beta > 0)) return -Infinity;
  const c = lgamma(alpha) + lgamma(beta) - lgamma(alpha + beta);
  let s = 0;
  for (const { approvals: k, total: n } of rows) {
    s += lgamma(alpha + k) + lgamma(beta + n - k) - lgamma(alpha + beta + n) - c;
  }
  return s;
}

function fitPrior(rows) {
  let best = { ll: -Infinity, mu: 0.5, M: 1 };
  for (let i = 0; i < 24; i++) {
    const mu = 0.86 + 0.006 * i;
    for (let j = 0; j < 34; j++) {
      const M = 0.5 * Math.pow(1.32, j);
      const ll = logLik(rows, mu * M, (1 - mu) * M);
      if (ll > best.ll) best = { ll, mu, M };
    }
  }
  for (let pass = 0; pass < 6; pass++) {                 // coordinate refine
    const dmu = 0.004 / (pass + 1), dM = best.M * 0.12 / (pass + 1);
    let improved = true;
    while (improved) {
      improved = false;
      for (const [sm, sM] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const mu = Math.min(0.9995, Math.max(0.5, best.mu + sm * dmu));
        const M = Math.max(0.05, best.M + sM * dM);
        const ll = logLik(rows, mu * M, (1 - mu) * M);
        if (ll > best.ll + 1e-9) { best = { ll, mu, M }; improved = true; }
      }
    }
  }
  return { alpha: best.mu * best.M, beta: (1 - best.mu) * best.M, mu: best.mu, M: best.M, logLik: best.ll };
}

const credibility = (k, n, p) => (p.alpha + k) / (p.alpha + p.beta + n);

// Shrinkage borrows strength from the population. That is what we want for an
// employer whose thin record is ABOVE the fitted rate — and exactly what we must
// not act on when the thin record is BELOW it. FEEDMOB INC (0 approvals, 2
// denials) shrinks to 0.879, which reads as a strong sponsor; the record says the
// opposite. The number is the correct posterior mean and stays as computed — but
// it is not evidence of sponsorship, so it is labeled and flagged, never promoted.
const CAUTION_LIFT = 0.20;   // credibility - raw_rate above which the score is prior-borrowed
const ADVERSE_RAW = 0.75;    // a raw record below this is adverse evidence, whatever the posterior

// The four thresholds below are AUTHORED (`your-input`), not derived from the
// data — they are a reading convenience over the computed credibility, and the
// attestation labels them as such. A plausibility audit caught them being
// knife-edged: DATABRICKS (1640/1648, credibility 0.994988) fell one part in
// 100,000 short of a 0.995 cut and was labeled below a 240-filing employer.
// Bands widened so a deep record is not demoted by a rounding boundary.
function tier(c, n, rawRate = null) {
  if (c === null) return 'Unknown';
  if (rawRate !== null && rawRate < ADVERSE_RAW) return 'Thin'; // never promote an adverse record
  if (n >= 100 && c >= 0.99) return 'Proven';
  if (n >= 20 && c >= 0.98) return 'Likely';
  if (n >= 5) return 'Possible';
  return 'Thin';
}

// Surface the borrowing instead of hiding it inside a single number.
function caution(c, rawRate) {
  if (c === null || rawRate === null) return null;
  if (c - rawRate > CAUTION_LIFT) {
    return `prior-borrowed: raw record is ${(rawRate * 100).toFixed(1)}% on a thin sample; ` +
      `${(c - rawRate).toFixed(3)} of this score comes from the population prior, not from this employer`;
  }
  return null;
}

// ── self-test: the invariants the whole contribution rests on ────────────────
function selfTest(rows, prior) {
  const t = [];
  const add = (name, ok, detail) => t.push({ name, ok, detail });
  const c = (k, n) => credibility(k, n, prior);

  add('monotone in sample size at equal raw rate: c(2/2) < c(18/18) < c(610/610)',
    c(2, 2) < c(18, 18) && c(18, 18) < c(610, 610),
    `${c(2, 2).toFixed(6)} < ${c(18, 18).toFixed(6)} < ${c(610, 610).toFixed(6)}`);

  add('a thin perfect record does not outrank a deep near-perfect one: c(2/2) < c(1640/1648)',
    c(2, 2) < c(1640, 1648),
    `${c(2, 2).toFixed(6)} < ${c(1640, 1648).toFixed(6)}`);

  add('shrinkage is toward the fitted rate, never above 1 or below 0',
    c(0, 3) > 0 && c(3, 3) < 1,
    `c(0/3)=${c(0, 3).toFixed(6)} c(3/3)=${c(3, 3).toFixed(6)}`);

  add('a genuinely bad record stays bad: c(1/40) < 0.5',
    c(1, 40) < 0.5, `c(1/40)=${c(1, 40).toFixed(6)}`);

  add('large n converges to the raw rate (|c - raw| < 0.002 at n=4990)',
    Math.abs(c(4962, 4990) - 4962 / 4990) < 0.002,
    `c=${c(4962, 4990).toFixed(6)} raw=${(4962 / 4990).toFixed(6)}`);

  add('no record is scored 0 (EMPTY is null, not zero)',
    tier(null, 0) === 'Unknown', 'tier(null) === "Unknown"');

  // Regression guard for the defect this component's own break attempt found:
  // an all-denied employer shrinks to ~0.88 and read as a strong sponsor.
  add('an adverse thin record is never promoted above Thin: 0/2 stays Thin',
    tier(c(0, 2), 2, 0) === 'Thin', `c(0/2)=${c(0, 2).toFixed(6)} tier=${tier(c(0, 2), 2, 0)}`);

  add('a prior-borrowed score is flagged, not shipped silently: 0/2 carries a caution',
    caution(c(0, 2), 0) !== null, (caution(c(0, 2), 0) || 'NO CAUTION').slice(0, 96));

  add('a well-evidenced employer carries no caution: 1640/1648 is unflagged',
    caution(c(1640, 1648), 1640 / 1648) === null, 'no caution on a deep record');

  add('prior was fitted, not assumed (M is finite and > 0)',
    Number.isFinite(prior.M) && prior.M > 0, `M=${prior.M.toFixed(3)} mu=${prior.mu.toFixed(4)}`);

  const failed = t.filter((x) => !x.ok);
  for (const x of t) console.log(`  ${x.ok ? 'PASS' : 'FAIL'}  ${x.name}\n        ${x.detail}`);
  console.log(`\n${t.length - failed.length}/${t.length} invariants hold.`);
  return failed.length;
}

// ── main ─────────────────────────────────────────────────────────────────────
const csvPath = String(flag('--csv', DEFAULT_CSV));
if (!fs.existsSync(csvPath)) {
  console.error(`ERROR: H-1B source not found: ${csvPath}`);
  console.error('        (this component reads a record or it does not run — it does not estimate)');
  process.exit(2);
}
const minN = Number(flag('--min-n', 0));
const { scored, empty, error } = load(csvPath, minN);

if (scored.length === 0) {
  console.error(`EMPTY: no employer in ${csvPath} has usable H-1B counts. Nothing scored. (EMPTY, not ERROR.)`);
  process.exit(0);
}

const prior = fitPrior(scored);
const out = scored.map((r) => {
  const c = credibility(r.approvals, r.total, prior);
  const rawRate = r.approvals / r.total;
  return { ...r, raw_rate: rawRate, credibility: c, tier: tier(c, r.total, rawRate), caution: caution(c, rawRate) };
});

console.log(`source        : ${csvPath}`);
console.log(`employers     : ${out.length} scored · ${empty.length} EMPTY (no usable record) · ${error.length} ERROR (unparseable)`);
console.log(`fitted prior  : alpha=${prior.alpha.toFixed(4)}  beta=${prior.beta.toFixed(4)}  (mu=${prior.mu.toFixed(4)}, M=${prior.M.toFixed(3)}, logLik=${prior.logLik.toFixed(2)})`);
console.log(`                ^ estimated from these ${out.length} records by beta-binomial MLE at run time — not a constant`);
const tied = out.filter((r) => r.raw_rate === 1).length;
console.log(`raw-rate ties : ${tied} employers sit at exactly 100% on the raw rate (the tie this component breaks)`);
const flagged = out.filter((r) => r.caution);
console.log(`cautions      : ${flagged.length} employers carry a prior-borrowed caution (score lifted >${CAUTION_LIFT} above their own record)`);

if (has('--cautions')) {
  console.log('\nPRIOR-BORROWED SCORES (the component flagging its own weakest output)');
  console.log('| Employer | approvals/total | raw rate | credibility | lift | tier |');
  console.log('|---|---|---|---|---|---|');
  [...flagged].sort((a, b) => (b.credibility - b.raw_rate) - (a.credibility - a.raw_rate)).slice(0, 15)
    .forEach((r) => console.log(`| ${r.name} | ${r.approvals}/${r.total} | ${r.raw_rate.toFixed(4)} | ${r.credibility.toFixed(6)} | +${(r.credibility - r.raw_rate).toFixed(3)} | ${r.tier} |`));
}

if (has('--self-test')) {
  console.log('\nSELF-TEST (invariants)');
  process.exit(selfTest(scored, prior) === 0 ? 0 : 1);
}

if (has('--company')) {
  const q = String(flag('--company')).toUpperCase();
  const hits = out.filter((r) => r.name.toUpperCase().includes(q));
  if (!hits.length) {
    const e = empty.find((r) => r.name.toUpperCase().includes(q));
    console.log(`\n${q}: ${e ? `EMPTY — ${e.why} (credibility null, tier Unknown — NOT zero)` : 'not present in this file'}`);
    process.exit(0);
  }
  console.log('\n| Employer | approvals/total | raw rate | credibility | tier |');
  console.log('|---|---|---|---|---|');
  for (const r of hits.slice(0, 20)) {
    console.log(`| ${r.name} | ${r.approvals}/${r.total} | ${r.raw_rate.toFixed(4)} | ${r.credibility.toFixed(6)} | ${r.tier} |`);
  }
}

if (has('--compare')) {
  const N = Number(flag('--top', 10));
  // Raw ranking: rate only. Ties are broken by file order — which is the defect.
  const rawTop = [...out].sort((a, b) => b.raw_rate - a.raw_rate).slice(0, N);
  const adjTop = [...out].sort((a, b) => b.credibility - a.credibility).slice(0, N);
  const names = new Set(rawTop.map((r) => r.name));
  const overlap = adjTop.filter((r) => names.has(r.name)).length;

  console.log(`\nTOP ${N} BY RAW APPROVAL RATE (ties broken by file order — the defect)`);
  console.log('| # | Employer | approvals/total | raw rate |');
  console.log('|---|---|---|---|');
  rawTop.forEach((r, i) => console.log(`| ${i + 1} | ${r.name} | ${r.approvals}/${r.total} | ${r.raw_rate.toFixed(4)} |`));

  console.log(`\nTOP ${N} BY SAMPLE-SIZE-AWARE CREDIBILITY`);
  console.log('| # | Employer | approvals/total | raw rate | credibility | tier |');
  console.log('|---|---|---|---|---|---|');
  adjTop.forEach((r, i) => console.log(`| ${i + 1} | ${r.name} | ${r.approvals}/${r.total} | ${r.raw_rate.toFixed(4)} | ${r.credibility.toFixed(6)} | ${r.tier} |`));

  const medRaw = rawTop.map((r) => r.total).sort((a, b) => a - b)[Math.floor(N / 2)];
  const medAdj = adjTop.map((r) => r.total).sort((a, b) => a - b)[Math.floor(N / 2)];
  console.log(`\noverlap between the two top-${N} lists: ${overlap}/${N}`);
  console.log(`median sample size in the list: raw ${medRaw} filings → adjusted ${medAdj} filings`);
}

const emit = flag('--emit', null);
if (emit) {
  const p = String(emit);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify({
    _component: 'sponsorship-credibility',
    _chapter: 5,
    _source_record: csvPath,
    _prior: { ...prior, _how: 'beta-binomial MLE fitted to these records at run time (script-output, not a constant)' },
    _counts: { scored: out.length, empty: empty.length, error: error.length },
    _note: 'EMPTY employers are omitted from `employers` and are NOT scored 0 — no record is not a denial.',
    employers: out.map((r) => ({
      company: r.name, approvals: r.approvals, total: r.total,
      raw_rate: Number(r.raw_rate.toFixed(6)),
      credibility: Number(r.credibility.toFixed(6)),
      tier: r.tier, caution: r.caution, source: 'record',
    })),
    empty: empty.slice(0, 50),
    error: error.slice(0, 50),
  }, null, 2));
  console.log(`\nwrote ${p}`);
}
