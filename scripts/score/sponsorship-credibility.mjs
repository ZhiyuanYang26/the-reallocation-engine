#!/usr/bin/env node
// sponsorship-credibility.mjs
// ──────────────────────────────────────────────────────────────────────────────
// Sample-size-aware sponsorship credibility (upstream feed for the Ch.11 Role
// Scorer's `sponsorship.p`).
//
// THE GAP THIS CLOSES
// The engine reads an employer's H-1B strength as a raw approval RATE. On the
// real DOL/USCIS-mapped file that rate is degenerate: 1262 of 1557 employers sit
// at exactly 100%, most of them on a handful of filings. A 2-of-2 employer and a
// 610-of-610 employer are indistinguishable — the ranking is a 1262-way tie
// broken by whatever order the rows happen to arrive in (the raw top-10 comes out
// alphabetical). A rate reported without its sample size is a confidence claim
// the record does not support.
//
// WHAT IT DOES — Laplace's rule of succession (1774)
//
//     credibility = (approvals + 1) / (total + 2)
//
// Every employer starts with one notional success and one notional failure, then
// its own record is added. A thin record is pulled toward the middle in BOTH
// directions: 2/2 → 0.750 (not 1.000) and 0/2 → 0.250 (not 0.000), while
// 700/1000 → 0.6996, essentially its own rate. Credibility is earned by evidence,
// and the adjustment vanishes as the record grows.
//
// WHY NOT SHRINK TOWARD THE POPULATION RATE
// The pooled approval rate across these employers is 98.1%. Shrinking toward it
// makes small samples look like the crowd — which rescues bad records: an earlier
// version of this component (beta-binomial empirical Bayes, prior fitted at
// α=17.01, β=0.35) scored FEEDMOB INC — 0 approvals, 2 denials — at 0.879, a
// number that reads as a strong sponsor while the record says the opposite. 25
// employers were lifted more than 0.20 above their own rate. The anchor is 0.5,
// not 0.981, so that no amount of population optimism can manufacture a record
// an employer does not have.
//
// TIES
// Employers with identical records score identically — 313 employers in this file
// are all exactly 2/2, and the tool does not invent an order between them. Where
// scores collide across different records, more filings ranks first. This is a
// different thing from the defect above: there, employers with *different*
// records (2/2 vs 610/610) were tied.
//
// WHAT IT REFUSES TO DO
// An employer with no usable H-1B record is reported EMPTY (credibility null,
// tier "Unknown") — never 0. "No record" and "denied" are different facts, and
// collapsing them would be the fabrication this engine exists to prevent. Rows
// that are present but unparseable are counted as ERROR, separately from EMPTY.
//
// USAGE
//   node scripts/score/sponsorship-credibility.mjs                  # score + summary
//   node scripts/score/sponsorship-credibility.mjs --compare        # raw vs adjusted top-10
//   node scripts/score/sponsorship-credibility.mjs --company "DATABRICKS INC"
//   node scripts/score/sponsorship-credibility.mjs --emit output/sponsorship-credibility.json
//   node scripts/score/sponsorship-credibility.mjs --self-test      # invariants; exits 1 on failure
// ──────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_CSV = 'data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped.csv';
const COL = { name: 'company_name', approvals: 'Total Approvals', denials: 'Total Denials' };

// Laplace's rule of succession: one notional success, one notional failure.
// AUTHORED (`your-input`) as a modeling choice — but a named classical rule, not
// a tuned constant. Raising PSEUDO_TOTAL pulls thin records harder toward 0.5 in
// both directions; it cannot be set to rescue one side without penalising the other.
const PSEUDO_SUCCESS = 1;
const PSEUDO_TOTAL = 2;

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

const credibility = (k, n) => (k + PSEUDO_SUCCESS) / (n + PSEUDO_TOTAL);

// Rank order: credibility first, then filings. Employers with identical records
// stay tied — the data cannot separate them and the tool does not pretend it can.
const byRank = (a, b) => (b.credibility - a.credibility) || (b.total - a.total);

// tier is a LABEL over a computed number, not an independent claim. The four
// bands are AUTHORED (`your-input`) — a reading convenience, not a derived value.
function tier(c, n) {
  if (c === null) return 'Unknown';
  if (n >= 100 && c >= 0.95) return 'Proven';
  if (n >= 20 && c >= 0.90) return 'Likely';
  if (n >= 5 && c >= 0.70) return 'Possible';
  return 'Thin';
}

// ── self-test: the invariants the whole contribution rests on ────────────────
function selfTest() {
  const t = [];
  const add = (name, ok, detail) => t.push({ name, ok, detail });
  const c = credibility;

  add('more evidence of denial scores lower: c(0/2) > c(0/10) > c(0/40)',
    c(0, 2) > c(0, 10) && c(0, 10) > c(0, 40),
    `${c(0, 2).toFixed(4)} > ${c(0, 10).toFixed(4)} > ${c(0, 40).toFixed(4)}`);

  add('monotone in sample size at equal raw rate: c(2/2) < c(18/18) < c(610/610)',
    c(2, 2) < c(18, 18) && c(18, 18) < c(610, 610),
    `${c(2, 2).toFixed(4)} < ${c(18, 18).toFixed(4)} < ${c(610, 610).toFixed(4)}`);

  add('a thin perfect record does not outrank a deep near-perfect one: c(2/2) < c(995/1000)',
    c(2, 2) < c(995, 1000),
    `${c(2, 2).toFixed(4)} < ${c(995, 1000).toFixed(4)}`);

  add('a thin perfect record still beats a deep mediocre one: c(5/5) > c(700/1000)',
    c(5, 5) > c(700, 1000),
    `${c(5, 5).toFixed(4)} > ${c(700, 1000).toFixed(4)}`);

  add('a deep record keeps its own rate (|c - raw| < 0.001 at n=1000)',
    Math.abs(c(700, 1000) - 0.7) < 0.001,
    `c(700/1000)=${c(700, 1000).toFixed(6)} raw=0.700000`);

  add('an all-denied record is not rescued: c(0/2) < 0.30',
    c(0, 2) < 0.30, `c(0/2)=${c(0, 2).toFixed(4)}`);

  add('a genuinely bad deep record stays bad: c(1/40) < 0.10',
    c(1, 40) < 0.10, `c(1/40)=${c(1, 40).toFixed(4)}`);

  add('the score never reaches 0 or 1 (no record proves certainty)',
    c(0, 10000) > 0 && c(10000, 10000) < 1,
    `c(0/10000)=${c(0, 10000).toExponential(2)} c(10000/10000)=${c(10000, 10000).toFixed(6)}`);

  add('no record is scored 0 (EMPTY is null, not zero)',
    tier(null, 0) === 'Unknown', 'tier(null) === "Unknown"');

  add('identical records rank equal (no invented order)',
    byRank({ credibility: c(2, 2), total: 2 }, { credibility: c(2, 2), total: 2 }) === 0,
    'byRank(2/2, 2/2) === 0');

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

const out = scored.map((r) => {
  const c = credibility(r.approvals, r.total);
  return { ...r, raw_rate: r.approvals / r.total, credibility: c, tier: tier(c, r.total) };
});

console.log(`source        : ${csvPath}`);
console.log(`employers     : ${out.length} scored · ${empty.length} EMPTY (no usable record) · ${error.length} ERROR (unparseable)`);
console.log(`rule          : credibility = (approvals + ${PSEUDO_SUCCESS}) / (total + ${PSEUDO_TOTAL})  — Laplace's rule of succession`);
console.log(`                anchored at 0.5, NOT at the pooled rate — the population cannot vouch for an employer's own record`);
const tied = out.filter((r) => r.raw_rate === 1).length;
console.log(`raw-rate ties : ${tied} employers sit at exactly 100% on the raw rate (the tie this component breaks)`);
const distinct = new Set(out.map((r) => r.credibility.toFixed(9))).size;
console.log(`distinct scores: ${distinct} (employers with identical records stay tied — the data cannot separate them)`);

if (has('--self-test')) {
  console.log('\nSELF-TEST (invariants)');
  process.exit(selfTest() === 0 ? 0 : 1);
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
  const adjTop = [...out].sort(byRank).slice(0, N);
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

  const med = (a) => a.map((r) => r.total).sort((x, y) => x - y)[Math.floor(N / 2)];
  console.log(`\noverlap between the two top-${N} lists: ${overlap}/${N}`);
  console.log(`median sample size in the list: raw ${med(rawTop)} filings → adjusted ${med(adjTop)} filings`);
  console.log(`note: near the top the gaps are small (thousandths). The ordering is by weight of evidence,`);
  console.log(`      not a claim that #1 is meaningfully better than #4.`);
}

if (has('--movers')) {
  const M = Number(flag('--top', 10));
  console.log('\nLARGEST DOWNWARD ADJUSTMENTS (thin records losing their unearned 100%)');
  console.log('| Employer | approvals/total | raw rate | credibility | change |');
  console.log('|---|---|---|---|---|');
  [...out].sort((a, b) => (a.credibility - a.raw_rate) - (b.credibility - b.raw_rate)).slice(0, M)
    .forEach((r) => console.log(`| ${r.name} | ${r.approvals}/${r.total} | ${r.raw_rate.toFixed(4)} | ${r.credibility.toFixed(6)} | ${(r.credibility - r.raw_rate).toFixed(4)} |`));
  console.log('\nLARGEST UPWARD ADJUSTMENTS (thin adverse records — uncertainty cuts both ways)');
  console.log('| Employer | approvals/total | raw rate | credibility | change |');
  console.log('|---|---|---|---|---|');
  [...out].sort((a, b) => (b.credibility - b.raw_rate) - (a.credibility - a.raw_rate)).slice(0, M)
    .forEach((r) => console.log(`| ${r.name} | ${r.approvals}/${r.total} | ${r.raw_rate.toFixed(4)} | ${r.credibility.toFixed(6)} | +${(r.credibility - r.raw_rate).toFixed(4)} |`));
}

const emit = flag('--emit', null);
if (emit) {
  const p = String(emit);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify({
    _component: 'sponsorship-credibility',
    _chapter: 5,
    _source_record: csvPath,
    _rule: `(approvals + ${PSEUDO_SUCCESS}) / (total + ${PSEUDO_TOTAL}) — Laplace's rule of succession; anchor 0.5`,
    _counts: { scored: out.length, empty: empty.length, error: error.length, distinct_scores: distinct },
    _note: 'EMPTY employers are omitted from `employers` and are NOT scored 0 — no record is not a denial.',
    employers: [...out].sort(byRank).map((r) => ({
      company: r.name, approvals: r.approvals, total: r.total,
      raw_rate: Number(r.raw_rate.toFixed(6)),
      credibility: Number(r.credibility.toFixed(6)),
      tier: r.tier, source: 'record',
    })),
    empty: empty.slice(0, 50),
    error: error.slice(0, 50),
  }, null, 2));
  console.log(`\nwrote ${p}`);
}
