/* MATTER dress attributes. Runs in Chrome on Natalie's Mac, never in node.
 *
 * Reads each Shopify product's own JSON (/products/<handle>.js: description,
 * tags, options) and works out occasion, length and sleeve for the dress.
 * Usage (see "Dress attributes, step by step" in REVIEW-LOOP.md):
 *   1. Open any https page (the Shopify stores answer cross-origin).
 *   2. Paste this whole file, then run
 *        window.matterAttrsRun = matterAttrsCheck(pieces)
 *      where pieces is an array of catalog items ({ id, retailer, url, name }).
 *      Poll window.matterAttrsCheck.progress until it reports done.
 *   3. The results are saved to Downloads as matter-attrs-<date>.json and the
 *      promise resolves with the same object. Apply with scripts/apply-attrs.mjs.
 *
 * Same manners as the stock check: 4 in flight, one per store, pause after
 * each, stop a store at its first 403 or 429 or third network failure. A
 * piece we could not read is an error and is left alone.
 */

(() => {
  const CONCURRENCY = 4;
  const PAUSE_MS = 300;
  const TIMEOUT_MS = 20000;
  const MAX_NETWORK_FAILURES = 3;

  const strip = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').toLowerCase();

  // Order matters: the first match wins, so the more specific words lead.
  const RULES = {
    length: [
      ['maxi', /\bmaxi\b|\bgown\b|floor.?length|floor.?grazing|full.?length|ankle.?length|to the ankle|hits at the ankle|hits the floor|\bfloor\b/],
      ['midi', /\bmidi\b|mid.?length|mid.?calf|tea.?length|below.the.knee|hits below the knee|hits at the calf|\bcalf\b/],
      ['mini', /\bmini\b|above.the.knee|hits above the knee|mid.?thigh|\bthigh\b|short.?length/],
    ],
    sleeve: [
      ['sleeveless', /sleeveless|strapless|\btank\b|\bcami\b|camisole|\bslip dress|halter|bandeau|\btube\b|one.?shoulder|spaghetti|thin straps|shoulder straps|off.the.shoulder/],
      ['short sleeve', /short.?sleeve|cap.?sleeve|flutter.?sleeve|puff.?sleeve|elbow.?sleeve|three.?quarter|3\/4.?sleeve|t-shirt dress|\btee dress/],
      ['long sleeve', /long.?sleeve|full.?length sleeve|bishop.?sleeve|balloon.?sleeve|blouson.?sleeve|turtleneck|high.?neck|funnel.?neck|mock.?neck|sweater dress|knit dress|shirt.?dress|shirtdress|trench dress|\bcuffs?\b/],
    ],
    occasion: [
      ['black tie', /\bgown\b|black.?tie|evening|floor.?length|\bgala\b|\bball\b|red carpet|formal/],
      ['cocktail', /cocktail|sequin|satin|velvet|\blace\b|embroider|feather|metallic|lam[eé]\b|\bparty\b|strapless|bias.?cut|organza|taffeta|tulle|beaded|corset|wedding|occasion|dinner|night out|date night|silk charmeuse|silk crepe|silk georgette|silk chiffon/],
      ['everyday', /\btee\b|t-shirt|sweater|knit|shirt|denim|cotton|linen|poplin|jersey|smocked|tiered|polo|corduroy|\bcord\b|flannel|day dress|sundress|wrap|weekend|everyday|casual|easy|relaxed|throw on|laid.?back|beach|vacation|errands/],
    ],
  };

  const classify = (text) => {
    const out = {};
    for (const [key, rules] of Object.entries(RULES)) {
      const hit = rules.find(([, re]) => re.test(text));
      out[key] = hit ? hit[0] : null;
    }
    return out;
  };

  const handleOf = (url) => {
    const m = url.match(/\/products\/([^/?#]+)/);
    return m ? m[1] : null;
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fetchJson = async (url) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(url, { signal: ctl.signal, credentials: 'omit' });
      if (r.status === 403 || r.status === 429) throw Object.assign(new Error(`HTTP ${r.status}`), { stop: true });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally {
      clearTimeout(t);
    }
  };

  const download = (obj, name) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };

  async function matterAttrsCheck(pieces) {
    const progress = matterAttrsCheck.progress = { total: pieces.length, done: 0, results: 0, errors: 0, notChecked: 0, stopped: [], status: 'running' };
    const out = { checkedAt: new Date().toISOString().slice(0, 10), results: [], errors: [], notChecked: [] };
    const byStore = {};
    for (const p of pieces) {
      const handle = handleOf(p.url);
      if (!handle) { out.notChecked.push({ id: p.id, why: 'no Shopify handle in url' }); progress.notChecked++; progress.done++; continue; }
      const origin = new URL(p.url).origin;
      (byStore[origin] = byStore[origin] || []).push({ ...p, handle, origin });
    }
    const stores = Object.entries(byStore).map(([origin, list]) => ({ origin, list, i: 0, failures: 0, stopped: false }));
    const stopStore = (s, why) => {
      s.stopped = true;
      progress.stopped.push(`${s.origin}: ${why}`);
      for (const p of s.list.slice(s.i)) { out.errors.push({ id: p.id, why: `store stopped: ${why}` }); progress.errors++; progress.done++; }
      s.i = s.list.length;
    };
    const worker = async () => {
      for (;;) {
        const s = stores.filter((x) => !x.stopped && x.i < x.list.length && !x.busy).sort((a, b) => a.i - b.i)[0];
        if (!s) return;
        s.busy = true;
        const p = s.list[s.i++];
        try {
          const j = await fetchJson(`${s.origin}/products/${p.handle}.js`);
          if (!j) { out.errors.push({ id: p.id, why: 'gone (404)' }); progress.errors++; }
          else {
            const text = [j.title, strip(j.body_html), (j.tags || []).join(' '), (j.options || []).map((o) => `${o.name} ${(o.values || []).join(' ')}`).join(' '), j.type].join(' ').toLowerCase();
            out.results.push({ id: p.id, attrs: classify(text), images: (j.images || []).slice(0, 8) });
            progress.results++;
            s.failures = 0;
          }
        } catch (e) {
          if (e.stop) { stopStore(s, e.message); }
          else {
            s.failures++;
            out.errors.push({ id: p.id, why: e.message || 'network' }); progress.errors++;
            if (s.failures >= MAX_NETWORK_FAILURES) stopStore(s, 'repeated network failures');
          }
        }
        progress.done++;
        await sleep(PAUSE_MS);
        s.busy = false;
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    progress.status = 'done';
    download(out, `matter-attrs-${out.checkedAt}.json`);
    return out;
  }
  window.matterAttrsCheck = matterAttrsCheck;
})();
