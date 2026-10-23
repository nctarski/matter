/* Merge a stock check into the catalog.
 *
 *   node scripts/apply-stock.mjs ~/Downloads/matter-stock-YYYY-MM-DD.json
 *
 * The results file comes from scripts/stock-check.browser.js. Only its
 * "results" list changes anything: those are clear answers from the retailer.
 * "errors" and "notChecked" are reported and left alone, so a timeout or a
 * block never marks a piece sold out.
 *
 * For each answered piece:
 *   stock         = { checkedAt, sizes: [{ size, available }] }
 *   soldOutSince  = set to checkedAt on the first check with nothing available,
 *                   kept as is on later sold out checks, removed as soon as any
 *                   size is available again.
 * A piece that is gone from the store (Shopify 404 or missing from
 * products.json) comes back with no sizes. It keeps the sizes it had last time,
 * all marked unavailable, so the record still says what it was sold in.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/apply-stock.mjs <results file>');
  process.exit(1);
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const catalogPath = new URL('../data/catalog.json', import.meta.url);
const raw = readFileSync(catalogPath, 'utf8');
const catalog = JSON.parse(raw);
const run = JSON.parse(readFileSync(resolve(file), 'utf8'));

if (!DATE.test(run.checkedAt || '')) {
  console.error(`results file has no valid checkedAt (${run.checkedAt})`);
  process.exit(1);
}
if (!Array.isArray(run.results)) {
  console.error('results file has no results list');
  process.exit(1);
}

const byId = new Map(catalog.map((i) => [i.id, i]));
const counts = { updated: 0, soldOutNew: 0, soldOutKept: 0, back: 0, unknownId: 0 };
const problems = [];

for (const r of run.results) {
  const item = byId.get(r.id);
  if (!item) { counts.unknownId++; problems.push(`${r.id}: not in the catalog`); continue; }
  if (!Array.isArray(r.sizes) || r.sizes.some((s) => typeof s.size !== 'string' || !s.size || typeof s.available !== 'boolean')) {
    problems.push(`${r.id}: sizes did not validate, left unchanged`);
    continue;
  }

  let sizes = r.sizes.map((s) => ({ size: s.size, available: s.available }));
  if (!sizes.length && item.stock?.sizes?.length) {
    sizes = item.stock.sizes.map((s) => ({ size: s.size, available: false }));
  }
  const anyAvailable = sizes.some((s) => s.available);

  // Rebuild the record so stock and soldOutSince sit together at the end.
  const { stock: _old, soldOutSince: prevSince, ...rest } = item;
  const next = { ...rest, stock: { checkedAt: run.checkedAt, sizes } };
  if (!anyAvailable) {
    next.soldOutSince = prevSince || run.checkedAt;
    if (prevSince) counts.soldOutKept++; else counts.soldOutNew++;
  } else if (prevSince) {
    counts.back++;
  }
  Object.keys(item).forEach((k) => delete item[k]);
  Object.assign(item, next);
  counts.updated++;
}

writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + (raw.endsWith('\n') ? '\n' : ''));

const unchecked = {};
for (const p of run.notChecked || []) unchecked[p.retailer] = (unchecked[p.retailer] || 0) + 1;
const errored = {};
for (const p of run.errors || []) errored[p.retailer] = (errored[p.retailer] || 0) + 1;

console.log(`\nStock check ${run.checkedAt}`);
console.log(`  updated ${counts.updated}, newly sold out ${counts.soldOutNew}, still sold out ${counts.soldOutKept}, back in stock ${counts.back}`);
if (Object.keys(run.blocked || {}).length) console.log(`  blocked: ${JSON.stringify(run.blocked)}`);
if (Object.keys(errored).length) console.log(`  errors, left unchanged: ${JSON.stringify(errored)}`);
if (Object.keys(unchecked).length) console.log(`  not checked: ${JSON.stringify(unchecked)}`);
for (const p of problems) console.log(`  ${p}`);
console.log('');
