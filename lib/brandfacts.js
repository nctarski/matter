import fs from 'node:fs';
import path from 'node:path';
import { catalog } from './catalog';
import { effectiveNatural, formatPrice, naturalPct } from './fibers';
import { listWords, topFibers } from './shop';

/* Plain facts about a brand or a category, worked out from the catalog and
 * the seen ledger at every build. The site rebuilds whenever new pieces are
 * published, so these stay current on their own, and the "updated" date is
 * the build date.
 *
 * The ledger (data/seen/<retailer>.json) records every women's piece a sweep
 * has read, with the date and whether it cleared the fiber rule. For a brand
 * we read from its own store, that gives two things nobody else has: how much
 * of the brand's range is actually natural, and, month by month, whether new
 * arrivals are getting more or less natural over time. */

const ledgerSlug = (s) =>
  String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Outcomes that mean we read the composition. Rejected means it cleared the
// fiber rule and was passed over for style, so it still counts as natural.
const CLEARED = ['staged', 'catalog', 'rejected'];
const MISSED = ['fiber'];

const readLedger = (retailer) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'seen', `${ledgerSlug(retailer)}.json`), 'utf8'));
  } catch {
    return null;
  }
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const monthName = (ym) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const plural = (n, one, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** Build date in Austin, e.g. "October 24, 2026". */
export const updatedOn = () =>
  new Date().toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric' });

function pieceFacts(pieces) {
  const lined = pieces.filter((i) => Array.isArray(i.lining) && i.lining.length);
  const prices = pieces.map((i) => i.price).sort((a, b) => a - b);
  return {
    n: pieces.length,
    pure: pieces.filter((i) => naturalPct(i.shell) === 100).length,
    clears: pieces.filter((i) => effectiveNatural(i.shell, true) >= 95).length,
    lined: lined.length,
    unnaturalLinings: lined.filter((i) => naturalPct(i.lining) < 100).length,
    minPrice: prices[0],
    maxPrice: prices[prices.length - 1],
    fibers: topFibers(pieces),
  };
}

/** What the sweeps found reading this brand's own store, or null. */
function ledgerFacts(brand, pieces) {
  const retailers = [...new Set(pieces.map((i) => i.retailer))];
  if (retailers.length !== 1 || retailers[0] !== brand) return null;
  const ledger = readLedger(brand);
  if (!ledger) return null;
  const months = {};
  let read = 0;
  let cleared = 0;
  for (const v of Object.values(ledger)) {
    if (![...CLEARED, ...MISSED].includes(v.outcome)) continue;
    const ok = CLEARED.includes(v.outcome);
    read += 1;
    if (ok) cleared += 1;
    const m = (v.date || '').slice(0, 7);
    if (m) {
      months[m] ||= { read: 0, cleared: 0 };
      months[m].read += 1;
      if (ok) months[m].cleared += 1;
    }
  }
  if (read < 10) return null;
  return {
    read,
    cleared,
    months: Object.entries(months).sort(([a], [b]) => (a < b ? -1 : 1)).map(([month, v]) => ({ month, ...v })),
  };
}

export function brandFacts(brand) {
  const pieces = catalog.filter((i) => i.brand === brand);
  return { brand, ...pieceFacts(pieces), ledger: ledgerFacts(brand, pieces) };
}

export function categoryFacts(category) {
  const pieces = catalog.filter((i) => i.category === category);
  return { ...pieceFacts(pieces), brands: new Set(pieces.map((i) => i.brand)).size };
}

/** The shared middle of every summary: what the pieces are made of, linings, price. */
function pieceSentences(f, shownWord) {
  const s = [];
  if (f.fibers.length) s.push(`${shownWord} mostly ${listWords(f.fibers).toLowerCase()}.`);
  s.push(f.pure === f.n
    ? `Every one is 100% natural fiber.`
    : `${plural(f.pure, 'piece')} ${f.pure === 1 ? 'is' : 'are'} 100% natural fiber.`);
  if (!f.lined) s.push('None are lined.');
  else if (!f.unnaturalLinings) s.push(`${plural(f.lined, 'piece')} ${f.lined === 1 ? 'is' : 'are'} lined, and every lining is natural fiber.`);
  else s.push(`${plural(f.lined, 'piece')} ${f.lined === 1 ? 'is' : 'are'} lined, and ${f.unnaturalLinings} of those linings ${f.unnaturalLinings === 1 ? 'is' : 'are'} not fully natural, which every card shows.`);
  if (f.minPrice) s.push(f.minPrice === f.maxPrice ? `Price ${formatPrice(f.minPrice)}.` : `Prices run ${formatPrice(f.minPrice)} to ${formatPrice(f.maxPrice)}.`);
  return s;
}

export function brandSummary(f) {
  const s = [];
  if (f.ledger) {
    const first = f.ledger.months[0]?.month;
    s.push(`Since ${first ? monthName(first) : 'we started'}, we have read the label on ${plural(f.ledger.read, `${f.brand} women's piece`)}. ${f.ledger.cleared.toLocaleString()} of them, ${pct(f.ledger.cleared, f.ledger.read)}%, were 95% natural fiber or more.`);
    s.push(...pieceSentences(f, `The ${plural(f.n, 'piece')} shown here ${f.n === 1 ? 'is' : 'are'}`));
  } else {
    s.push(`We carry ${plural(f.n, `${f.brand} piece`)}, each with its label read shell and lining separately.`);
    s.push(...pieceSentences(f, f.n === 1 ? 'It is' : 'They are'));
  }
  return s.join(' ').replace(/\s+/g, ' ');
}

export function categorySummary(label, f) {
  return [
    `${plural(f.n, 'piece')} from ${plural(f.brands, 'brand')}, every label read shell and lining separately.`,
    ...pieceSentences(f, 'They are'),
  ].join(' ');
}

/** A month by month line, once there are at least two months worth reading. */
export function brandTrend(f) {
  const months = (f.ledger?.months || []).filter((m) => m.read >= 10);
  if (months.length < 2) return null;
  const first = months[0];
  const last = months[months.length - 1];
  const a = pct(first.cleared, first.read);
  const b = pct(last.cleared, last.read);
  const dir = b > a ? `up from ${a}%` : b < a ? `down from ${a}%` : `level with ${a}%`;
  return {
    sentence: `New ${f.brand} arrivals we read in ${monthName(last.month)} were ${b}% natural, ${dir} across the range we first read in ${monthName(first.month)}.`,
    rows: months.map((m) => ({ label: monthName(m.month), read: m.read, pct: pct(m.cleared, m.read) })),
  };
}
