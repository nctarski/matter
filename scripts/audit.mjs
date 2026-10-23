/* Catalog audit. Run it before every commit that touches data/catalog.json.
 *
 *   node scripts/audit.mjs
 *
 * It checks three things the site itself cannot tell you about, because a bad
 * entry does not crash anything, it just quietly shows a shopper the wrong
 * number:
 *   1. structure   - required fields present, ids unique, category real
 *   2. composition - every fiber name known to the taxonomy, percentages sum
 *                    to 100 on both shell and lining
 *   3. readiness   - which pieces are classified but still held back, and why
 *
 * Exits non-zero on a structural or composition error so it can gate a build.
 * Pending pieces are reported but never fail the run, because waiting on a
 * link is a normal state for a piece, not a mistake.
 */

import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

/* lib/fibers.js is ES module source inside a CommonJS package, so plain node
 * will not import it by path. It has no imports of its own, which means we can
 * hand the source straight to the loader as a data URL and keep the taxonomy
 * in exactly one place. If fibers.js ever grows an import, this breaks loudly
 * rather than silently, which is the behaviour we want. */
const fibers = await import(
  'data:text/javascript;base64,' + Buffer.from(read('lib/fibers.js')).toString('base64')
);

const {
  TIER_1_NATURAL, TIER_2_CELLULOSIC, LYOCELL, TIER_3_SYNTHETIC,
  FIBER_ALIASES, CATEGORIES, COLOURS, NAV, RESTING_TAGS,
  naturalPct, cellulosicPct, effectiveNatural, formatComposition,
} = fibers;

const KNOWN_FIBERS = new Set([
  ...TIER_1_NATURAL, ...TIER_2_CELLULOSIC, ...LYOCELL, ...TIER_3_SYNTHETIC,
]);
const KNOWN_TAGS = new Set([...NAV.filter((n) => n.tag).map((n) => n.tag), ...RESTING_TAGS]);
const KNOWN_COLOURS = new Set(Object.keys(COLOURS));

const catalog = JSON.parse(read('data/catalog.json'));
const edits = JSON.parse(read('data/edits.json'));

const errors = [];
const warnings = [];
const fail = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);

/* ---------- structure and composition ---------- */

const seen = new Set();

const pad2 = (n) => String(n).padStart(2, '0');
const now = new Date();
const TODAY = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
/** A real calendar date written YYYY-MM-DD. */
const isDate = (v) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

for (const item of catalog) {
  const id = item.id || '(missing id)';

  if (!item.id) fail(id, 'no id');
  if (seen.has(item.id)) fail(id, 'duplicate id');
  seen.add(item.id);

  for (const field of ['retailer', 'brand', 'name', 'category']) {
    if (!item[field]) fail(id, `missing ${field}`);
  }

  if (item.category && !CATEGORIES.includes(item.category)) {
    fail(id, `category "${item.category}" is not in NAV`);
  }

  if (item.colour && !KNOWN_COLOURS.has(item.colour)) {
    fail(id, `colour "${item.colour}" has no swatch in COLOURS`);
  }

  for (const tag of item.tags || []) {
    if (!KNOWN_TAGS.has(tag)) fail(id, `tag "${tag}" is not in NAV`);
  }

  for (const [label, comp] of [['shell', item.shell], ['lining', item.lining]]) {
    if (comp === 'undisclosed') {
      if (label === 'shell') fail(id, 'shell composition cannot be undisclosed');
      else warn(id, 'retailer says lined but will not say with what');
      continue;
    }
    if (!comp) {
      if (label === 'shell') fail(id, 'no shell composition');
      continue;
    }
    if (!Array.isArray(comp) || comp.length === 0) {
      fail(id, `${label} composition is not a non-empty array`);
      continue;
    }

    let total = 0;
    for (const entry of comp) {
      if (!Array.isArray(entry) || entry.length !== 2) {
        fail(id, `${label} has a malformed entry ${JSON.stringify(entry)}`);
        continue;
      }
      const [fiber, pct] = entry;

      if (FIBER_ALIASES[fiber]) {
        fail(id, `${label} uses "${fiber}", store it as "${FIBER_ALIASES[fiber]}"`);
      } else if (!KNOWN_FIBERS.has(fiber)) {
        fail(id, `${label} fiber "${fiber}" is in no tier, add it to lib/fibers.js`);
      }

      if (typeof pct !== 'number' || pct <= 0 || pct > 100) {
        fail(id, `${label} "${fiber}" has percentage ${pct}`);
      } else {
        total += pct;
      }
    }

    if (total !== 100) fail(id, `${label} percentages sum to ${total}, not 100`);
  }

  /* Stock, written by scripts/apply-stock.mjs. Optional, but when present it
   * has to be exactly this shape, because the card prints it word for word:
   *   stock        { checkedAt: "YYYY-MM-DD", sizes: [{ size, available }] }
   *   soldOutSince "YYYY-MM-DD", present exactly when no size is available */
  if (item.stock !== undefined) {
    const st = item.stock;
    if (!st || typeof st !== 'object' || Array.isArray(st)) {
      fail(id, 'stock is not an object');
    } else {
      for (const k of Object.keys(st)) {
        if (!['checkedAt', 'sizes'].includes(k)) fail(id, `stock has unknown field "${k}"`);
      }
      if (!isDate(st.checkedAt)) fail(id, `stock.checkedAt "${st.checkedAt}" is not a YYYY-MM-DD date`);
      else if (st.checkedAt > TODAY) fail(id, `stock.checkedAt ${st.checkedAt} is in the future`);
      if (!Array.isArray(st.sizes)) {
        fail(id, 'stock.sizes is not an array');
      } else {
        const names = new Set();
        for (const z of st.sizes) {
          if (!z || typeof z !== 'object' || Array.isArray(z)) { fail(id, `stock size ${JSON.stringify(z)} is not an object`); continue; }
          for (const k of Object.keys(z)) {
            if (!['size', 'available'].includes(k)) fail(id, `stock size has unknown field "${k}"`);
          }
          if (typeof z.size !== 'string' || !z.size.trim()) fail(id, `stock size name ${JSON.stringify(z.size)} is not a non-empty string`);
          else if (names.has(z.size)) fail(id, `stock lists size "${z.size}" twice`);
          else names.add(z.size);
          if (typeof z.available !== 'boolean') fail(id, `stock size "${z.size}" has available ${JSON.stringify(z.available)}, not true or false`);
        }
        const anyAvailable = st.sizes.some((z) => z && z.available === true);
        if (!anyAvailable && item.soldOutSince === undefined) fail(id, 'no size available but no soldOutSince');
        if (anyAvailable && item.soldOutSince !== undefined) fail(id, 'soldOutSince set but a size is available');
      }
    }
  }
  if (item.soldOutSince !== undefined) {
    if (item.stock === undefined) fail(id, 'soldOutSince without stock');
    if (!isDate(item.soldOutSince)) fail(id, `soldOutSince "${item.soldOutSince}" is not a YYYY-MM-DD date`);
    else if (isDate(item.stock?.checkedAt) && item.soldOutSince > item.stock.checkedAt) {
      fail(id, `soldOutSince ${item.soldOutSince} is after the last check ${item.stock.checkedAt}`);
    }
  }

  // Not an error, just the thing most worth a second look before publishing.
  if (item.shell && naturalPct(item.shell) === 0) {
    warn(id, `nothing natural in the shell (${formatComposition(item.shell)})`);
  }
}

/* ---------- edits reference real pieces ---------- */

const ids = new Set(catalog.map((i) => i.id));
for (const block of edits) {
  if (block.type !== 'edit') continue;
  for (const pick of block.picks || []) {
    if (!ids.has(pick.id)) {
      fail(`edit "${block.title}"`, `pick "${pick.id}" is not in the catalog`);
    }
  }
}

/* ---------- readiness ---------- */

const missingFields = (item) => {
  const missing = [];
  if (!item.url) missing.push('url');
  if (typeof item.price !== 'number' || item.price <= 0) missing.push('price');
  if (!item.colour) missing.push('colour');
  return missing;
};

/* Mirrors lib/catalog.js: sold out for more than 14 days is hidden from the
 * site but stays in the catalog. Report only, never an error. */
const SOLD_OUT_HIDE_DAYS = 14;
const daysSince = (date) => Math.floor((Date.parse(`${TODAY}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000);
const hiddenSoldOut = (i) => isDate(i.soldOutSince) && daysSince(i.soldOutSince) > SOLD_OUT_HIDE_DAYS;

const live = catalog.filter((i) => missingFields(i).length === 0 && !hiddenSoldOut(i));
const soldOut = catalog.filter((i) => missingFields(i).length === 0 && i.soldOutSince !== undefined);
const pending = catalog.filter((i) => missingFields(i).length > 0);

/* ---------- report ---------- */

const pct = (item) => `${effectiveNatural(item.shell, true)}%`;

console.log(`\nCatalog  ${catalog.length} pieces  ${live.length} live  ${pending.length} pending  ${soldOut.length} sold out\n`);

if (live.length) {
  console.log('LIVE');
  for (const i of live) {
    const cell = cellulosicPct(i.shell);
    console.log(
      `  ${pct(i).padStart(5)}  $${String(i.price).padStart(5)}  ${i.brand} ${i.name}` +
        `${cell ? `  (${cell}% cellulosic)` : ''}`
    );
  }
  console.log('');
}

if (pending.length) {
  console.log('PENDING');
  for (const i of pending) {
    console.log(`  ${pct(i).padStart(5)}  ${i.brand} ${i.name}  needs ${missingFields(i).join(', ')}`);
  }
  console.log('');
}

if (soldOut.length) {
  console.log('SOLD OUT');
  for (const i of soldOut) {
    console.log(`  since ${i.soldOutSince}${hiddenSoldOut(i) ? '  hidden' : ''}  ${i.brand} ${i.name}`);
  }
  console.log('');
}

if (warnings.length) {
  console.log('WORTH A LOOK');
  for (const w of warnings) console.log(`  ${w}`);
  console.log('');
}

if (errors.length) {
  console.log('ERRORS');
  for (const e of errors) console.log(`  ${e}`);
  console.log('');
  process.exit(1);
}

console.log('No errors.\n');
