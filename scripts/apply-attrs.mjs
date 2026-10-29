/* Merge a dress attributes check into the catalog.
 *
 *   node scripts/apply-attrs.mjs ~/Downloads/matter-attrs-YYYY-MM-DD.json
 *
 * The results file comes from scripts/attrs-check.browser.js. For each piece
 * in "results", item.attrs gets the keys the product page answered (a null
 * from the page leaves whatever the catalog had). "images" (the product's
 * photo list) is stored as item.images for the studio photo pass. Errors and
 * notChecked are reported and left alone.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2];
if (!file) { console.error('usage: node scripts/apply-attrs.mjs <results file>'); process.exit(1); }
const res = JSON.parse(readFileSync(resolve(file), 'utf8'));
const catalogPath = new URL('../data/catalog.json', import.meta.url);
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const byId = Object.fromEntries(catalog.map((i) => [i.id, i]));

let set = 0, filled = 0, missing = 0;
for (const r of res.results || []) {
  const item = byId[r.id];
  if (!item) { missing++; continue; }
  const attrs = { ...(item.attrs || {}) };
  for (const [k, v] of Object.entries(r.attrs || {})) if (v) { attrs[k] = v; filled++; }
  item.attrs = attrs;
  if (Array.isArray(r.images) && r.images.length) item.images = r.images;
  set++;
}
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`${set} pieces updated, ${filled} attributes filled, ${missing} ids not in catalog, ${(res.errors || []).length} errors, ${(res.notChecked || []).length} not checked`);
for (const s of res.stopped || []) console.log('stopped:', s);
