/* The seen ledger. One file per retailer in data/seen/<slug>.json, mapping a
 * product key to what happened when we looked at it, so a sweep never reads
 * the same composition twice and a delta run only touches what is new.
 *
 *   node scripts/ledger.mjs seed            seed from catalog + every review round
 *   node scripts/ledger.mjs record <file>   record outcomes from a run
 *   node scripts/ledger.mjs has <retailer> <key>
 *
 * Key: the product URL with no query string or hash, no trailing slash,
 * lower-cased host. Outcome values: "staged" (on the review page or in a round
 * file), "catalog" (live), "rejected" (Natalie vetoed it), "fiber" (under 95%
 * natural or composition did not parse), "not-womens", "out-of-scope" (shoes,
 * bags, accessories, kids, home), "no-price-usd", "no-composition", "dead".
 * Only record a product once it is fully handled. Never record an item that
 * errored or timed out, so it is picked up next run.
 * The results file for "record" is a JSON array of
 *   { retailer, key, outcome, date, round? }
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
const read = (p, d) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : d);
const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const keyOf = (url) => {
  try { const u = new URL(url); return `${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '')}`; }
  catch { return String(url).split(/[?#]/)[0].replace(/\/+$/, ''); }
};
const file = (retailer) => `data/seen/${slug(retailer)}.json`;
const load = (retailer) => read(file(retailer), {});
const save = (retailer, data) => { mkdirSync('data/seen', { recursive: true }); writeFileSync(file(retailer), JSON.stringify(data, null, 1) + '\n'); };
const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'seed') {
  const today = new Date().toISOString().slice(0, 10);
  const live = new Set(read('data/catalog.json', []).map((i) => i.id));
  const rows = [...read('data/catalog.json', []).map((i) => ({ ...i, outcome: 'catalog' }))];
  for (const f of readdirSync('data/review')) {
    if (/^round-.*\.json$/.test(f) && !f.endsWith('.skips.json')) {
      for (const i of read(`data/review/${f}`, [])) if (!live.has(i.id)) rows.push({ ...i, outcome: 'staged', round: f });
    }
  }
  const by = {};
  for (const i of rows) if (i.url) { (by[i.retailer] ||= load(i.retailer))[keyOf(i.url)] = { outcome: i.outcome, date: today, round: i.round }; }
  for (const [r, d] of Object.entries(by)) { save(r, d); console.log(r, Object.keys(d).length); }
} else if (cmd === 'record') {
  const rows = read(a, []); const by = {};
  for (const r of rows) (by[r.retailer] ||= load(r.retailer))[r.key.includes('/') ? keyOf(r.key.startsWith('http') ? r.key : 'https://' + r.key) : r.key] = { outcome: r.outcome, date: r.date, round: r.round };
  for (const [r, d] of Object.entries(by)) { save(r, d); console.log(r, Object.keys(d).length); }
} else if (cmd === 'has') {
  console.log(Boolean(load(a)[keyOf(b)]));
} else { console.error('Usage: node scripts/ledger.mjs seed | record <file> | has <retailer> <key>'); process.exit(1); }
