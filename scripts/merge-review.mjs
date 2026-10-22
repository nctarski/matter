/* Publish a review round into the catalog.
 *
 *   node scripts/merge-review.mjs round-1
 *
 * Reads data/review/<round>.json (the candidates) and
 * data/review/<round>.skips.json (an array of candidate ids Natalie skipped on
 * the review page), appends every candidate that was not skipped and is not
 * already in the catalog, and writes data/catalog.json back. Run the audit
 * straight after. Re-running a round is safe: anything already in the catalog,
 * by id or by product URL, is left alone.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const round = process.argv[2];
if (!round) { console.error('Usage: node scripts/merge-review.mjs <round>'); process.exit(1); }

const root = new URL('../', import.meta.url);
const path = (p) => new URL(p, root);
const candidates = JSON.parse(readFileSync(path(`data/review/${round}.json`), 'utf8'));
const skipsFile = path(`data/review/${round}.skips.json`);
if (!existsSync(skipsFile)) { console.error(`Missing ${round}.skips.json. Write [] if nothing was skipped.`); process.exit(1); }
const skips = new Set(JSON.parse(readFileSync(skipsFile, 'utf8')));
const catalog = JSON.parse(readFileSync(path('data/catalog.json'), 'utf8'));

const bare = (u) => String(u || '').split('?')[0].replace(/\/$/, '');
const ids = new Set(catalog.map((i) => i.id));
const urls = new Set(catalog.map((i) => bare(i.url)));

let added = 0, skipped = 0, present = 0;
for (const c of candidates) {
  if (skips.has(c.id)) { skipped++; continue; }
  if (ids.has(c.id) || urls.has(bare(c.url))) { present++; continue; }
  catalog.push(c); ids.add(c.id); urls.add(bare(c.url)); added++;
}
writeFileSync(path('data/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log(`${round}: ${added} added, ${skipped} skipped, ${present} already in the catalog. Catalog now ${catalog.length}.`);
