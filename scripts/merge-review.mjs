/* Publish reviewed pieces into the catalog.
 *
 *   node scripts/merge-review.mjs --ids data/review/publish-<stamp>.json
 *
 * The ids file is a JSON array of candidate ids Natalie approved on the review
 * page. Every data/review/round-*.json file is searched for them (the round
 * files hold the full catalog records), and each approved piece that is not
 * already in the catalog, by id or by product URL, is appended to
 * data/catalog.json. Run the audit straight after. Re-running is safe.
 *
 * The older form still works for a single round with a skip list:
 *   node scripts/merge-review.mjs round-1   (reads round-1.skips.json)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const path = (p) => new URL(p, root);
const read = (p) => JSON.parse(readFileSync(path(p), 'utf8'));

const args = process.argv.slice(2);
let wanted; // Set of ids to publish, or null for "round minus skips"
let pool = [];

if (args[0] === '--ids') {
  if (!args[1]) { console.error('Usage: node scripts/merge-review.mjs --ids <file>'); process.exit(1); }
  wanted = new Set(read(args[1]));
  for (const f of readdirSync(path('data/review/'))) {
    if (/^round-.*\.json$/.test(f) && !f.endsWith('.skips.json')) pool.push(...read(`data/review/${f}`));
  }
} else {
  const round = args[0];
  if (!round) { console.error('Usage: node scripts/merge-review.mjs --ids <file> | <round>'); process.exit(1); }
  const skipsFile = `data/review/${round}.skips.json`;
  if (!existsSync(path(skipsFile))) { console.error(`Missing ${skipsFile}. Write [] if nothing was skipped.`); process.exit(1); }
  const skips = new Set(read(skipsFile));
  pool = read(`data/review/${round}.json`);
  wanted = new Set(pool.map((c) => c.id).filter((id) => !skips.has(id)));
}

const catalog = read('data/catalog.json');
const bare = (u) => String(u || '').split('?')[0].replace(/\/$/, '');
const ids = new Set(catalog.map((i) => i.id));
const urls = new Set(catalog.map((i) => bare(i.url)));
const byId = new Map(pool.map((c) => [c.id, c]));

let added = 0, present = 0;
const missing = [];
for (const id of wanted) {
  const c = byId.get(id);
  if (!c) { missing.push(id); continue; }
  if (ids.has(c.id) || urls.has(bare(c.url))) { present++; continue; }
  catalog.push(c); ids.add(c.id); urls.add(bare(c.url)); added++;
}
writeFileSync(path('data/catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
console.log(`${added} added, ${present} already in the catalog, ${missing.length} not found in any round file. Catalog now ${catalog.length}.`);
if (missing.length) { console.log('Not found:', missing.join(', ')); process.exitCode = 2; }
