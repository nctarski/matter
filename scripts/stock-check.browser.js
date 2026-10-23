/* MATTER stock check. Runs in Chrome on Natalie's Mac, never in node.
 *
 * Usage (see "Stock check, step by step" in REVIEW-LOOP.md):
 *   1. Open any https://www.massimodutti.com/us/ page. The Massimo Dutti
 *      endpoints are same-origin from there, and the Shopify stores answer
 *      cross-origin from any tab.
 *   2. Paste this whole file into the page, then run
 *        window.matterStockRun = matterStockCheck(pieces)
 *      where pieces is an array of catalog items ({ id, retailer, url, image }).
 *      Poll window.matterStockCheck.progress until it reports done.
 *   3. The results are saved to Downloads as matter-stock-<date>.json through
 *      an anchor download, and the promise resolves with the same object.
 *
 * Rules that matter more than speed:
 *   - At most 4 requests in flight, a short pause after each one.
 *   - A store stops at its first 403 or 429; its remaining pieces are reported
 *     as errors, not as sold out. A 429 sent without CORS headers reaches us as
 *     a bare "Failed to fetch", so 3 network failures in a row also stop the
 *     store (White + Warren did this on 2026-10-23 after about 130 requests).
 *   - At most one request in flight per store, so the 4 slots are spread over
 *     different stores rather than spent on one.
 *   - Only a clear answer changes stock. A network error, a timeout or a body
 *     we cannot parse is an error and the piece is left alone.
 *   - Retailers not listed below are "not checked" and left unchanged.
 */

(() => {
  // Shopify stores from the retailer list in REVIEW-LOOP.md that are in the catalog.
  const SHOPIFY_RETAILERS = [
    'White + Warren', 'Guest In Residence', 'Naadam', 'Brochu Walker',
    'Sea New York', 'Ulla Johnson', 'St. Agni', 'Gabriela Hearst', 'Tibi',
    'Christy Dawn', 'Jenni Kayne', 'Faherty', 'Anine Bing', 'Kotn',
    'Lisa Says Gah', 'Another Tomorrow', 'Hanro',
  ];
  const MD = 'Massimo Dutti';
  const MD_STORE = '/itxrest/3/catalog/store/34009527/30359506';
  const CONCURRENCY = 4;
  const PAUSE_MS = 300;
  const TIMEOUT_MS = 20000;
  const MAX_NETWORK_FAILURES = 3;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  class Blocked extends Error {}

  /* Tiny limiter: CONCURRENCY slots shared by every store. */
  function limiter(n) {
    let active = 0;
    const queue = [];
    const next = () => {
      if (active >= n || !queue.length) return;
      active++;
      const { fn, resolve, reject } = queue.shift();
      fn().then(resolve, reject).finally(async () => {
        await sleep(PAUSE_MS);
        active--;
        next();
      });
    };
    return (fn) => new Promise((resolve, reject) => { queue.push({ fn, resolve, reject }); next(); });
  }

  async function matterStockCheck(pieces, { download = true } = {}) {
    const run = limiter(CONCURRENCY);
    const blocked = {};        // store key -> status that stopped it
    const netFails = {};       // store key -> network failures in a row
    const storeLock = {};      // store key -> tail of that store's request chain
    const progress = (matterStockCheck.progress = { total: pieces.length, done: 0, finished: false });
    const results = [];        // clear answers only
    const notChecked = [];     // retailer has no method yet
    const errors = [];         // anything unclear; the piece stays as it is

    /* fetch with a timeout, a per-store stop on 403/429. Returns the Response. */
    const get = (store, url, opts = {}) => {
      const job = (storeLock[store] || Promise.resolve()).catch(() => {}).then(() => run(async () => {
        if (blocked[store]) throw new Blocked(`${store} stopped after ${blocked[store]}`);
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
        try {
          // Default credentials: cookies go only to the same origin. Massimo Dutti
          // serves a short bot page instead of the product page without them.
          const r = await fetch(url, { ...opts, signal: ctl.signal });
          netFails[store] = 0;
          if (r.status === 403 || r.status === 429) {
            blocked[store] = r.status;
            throw new Blocked(`${store} answered ${r.status}`);
          }
          return r;
        } catch (e) {
          if (!(e instanceof Blocked)) {
            netFails[store] = (netFails[store] || 0) + 1;
            if (netFails[store] >= MAX_NETWORK_FAILURES) blocked[store] ||= 'network failures';
          }
          throw e;
        } finally {
          clearTimeout(t);
        }
      }));
      storeLock[store] = job;
      return job;
    };

    const ok = (id, retailer, sizes, how) => results.push({ id, retailer, sizes, how });
    const fail = (p, reason) => errors.push({ id: p.id, retailer: p.retailer, reason: String(reason?.message || reason) });
    const tick = () => { progress.done++; };

    /* ---------- Shopify ---------- */

    const storeChecked = {};   // host -> Promise<boolean> products.json answers like Shopify
    const storeIndex = {};     // host -> Promise<Map handle -> product> from full products.json

    const isShopify = (host) => (storeChecked[host] ||= (async () => {
      const r = await get(host, `https://${host}/products.json?limit=1`);
      if (!r.ok) return false;
      const j = await r.json();
      return Array.isArray(j.products);
    })());

    const fullIndex = (host) => (storeIndex[host] ||= (async () => {
      const map = new Map();
      for (let page = 1; page < 200; page++) {
        const r = await get(host, `https://${host}/products.json?limit=250&page=${page}`);
        if (!r.ok) throw new Error(`products.json page ${page} answered ${r.status}`);
        const j = await r.json();
        if (!Array.isArray(j.products)) throw new Error(`products.json page ${page} did not parse`);
        if (!j.products.length) return map;
        for (const prod of j.products) map.set(prod.handle, prod);
      }
      throw new Error('products.json never ended');
    })());

    /* Sizes from the option named Size, or the only option. A size counts as
     * available when any variant in that size is available, in the retailer's
     * own option order. A product with no size option is one size. */
    const shopifySizes = (prod) => {
      const options = (prod.options || []).map((o, i) => (typeof o === 'string'
        ? { name: o, position: i + 1, values: null }
        : { name: o.name, position: o.position || i + 1, values: o.values || null }));
      const variants = prod.variants;
      if (!Array.isArray(variants) || !variants.length) return null;
      if (variants.some((v) => typeof v.available !== 'boolean')) return null;
      let opt = options.find((o) => /^size$/i.test(String(o.name).trim()))
        || options.find((o) => /size/i.test(String(o.name)));
      if (!opt && options.length === 1 && !/^title$/i.test(options[0].name)) opt = options[0];
      if (!opt) return [{ size: 'One size', available: variants.some((v) => v.available) }];
      const key = `option${opt.position}`;
      const order = opt.values && opt.values.length
        ? [...opt.values]
        : [...new Set(variants.map((v) => v[key]))];
      const sizes = order.map((size) => ({
        size: String(size),
        available: variants.some((v) => v[key] === size && v.available),
      }));
      return sizes.every((s) => s.size && s.size !== 'undefined') ? sizes : null;
    };

    const checkShopify = async (p) => {
      let u;
      try { u = new URL(p.url); } catch { return fail(p, 'bad url'); }
      const m = u.pathname.match(/\/products\/([^/?#]+)/);
      if (!m) return fail(p, 'url has no /products/<handle>');
      const host = u.host;
      const handle = decodeURIComponent(m[1]);
      if (!(await isShopify(host))) return fail(p, `${host} did not answer as a Shopify store`);

      let r;
      try {
        r = await get(host, `https://${host}/products/${encodeURIComponent(handle)}.js`);
      } catch (e) {
        if (e instanceof Blocked || blocked[host]) throw e;
        r = null; // one network error: try products.json below
      }
      if (r && r.status === 404) return ok(p.id, p.retailer, [], 'shopify .js 404');
      if (r && r.ok) {
        let prod = null;
        try { prod = await r.json(); } catch { prod = null; }
        const sizes = prod && shopifySizes(prod);
        if (sizes) return ok(p.id, p.retailer, sizes, 'shopify .js');
      }
      // Fallback: the full products.json. Missing from a complete listing means sold out.
      const index = await fullIndex(host);
      const prod = index.get(handle);
      if (!prod) return ok(p.id, p.retailer, [], 'missing from products.json');
      const sizes = shopifySizes(prod);
      if (!sizes) return fail(p, 'variants did not parse');
      return ok(p.id, p.retailer, sizes, 'shopify products.json');
    };

    /* ---------- Massimo Dutti ---------- */

    /* The catalog keeps the product page URL (".../name-l05608565") and the
     * image path, whose 11 digit code is reference (8) plus colour (3). The
     * page HTML carries "iProductId" near the top, so read only until it
     * appears instead of downloading the whole 1 MB page. */
    const mdProductId = async (p) => {
      const r = await get(MD, p.url);
      if (!r.ok) throw new Error(`product page answered ${r.status}`);
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let text = '';
      try {
        while (text.length < 400000) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          const m = text.match(/"iProductId"\s*:\s*(\d+)/);
          if (m) return Number(m[1]);
        }
      } finally {
        reader.cancel().catch(() => {});
      }
      throw new Error('no iProductId on the product page');
    };

    const mdParse = (p) => {
      const ref = (p.url.match(/-l(\d{8})(?:[/?#]|$)/) || [])[1];
      const code = ((p.image || '').match(/\/(\d{11})-o\d/) || [])[1];
      if (!ref) return null;
      return { ref, colour: code && code.startsWith(ref) ? code.slice(8) : null };
    };

    /* Size availability, from detail.colors[<colour>].sizes[]:
     *   visibilityValue "SHOW" and isBuyable true -> available
     *   visibilityValue "SOLD_OUT"                 -> not available
     *   visibilityValue "COMING_SOON"              -> not available (not buyable yet)
     * Anything else is unclear and fails the piece. Checked 2026-10-23 against
     * /itxrest/2/.../product/<id>/stock: SOLD_OUT sizes are "out_of_stock" there. */
    const mdSizes = (prod, ref, colour) => {
      const detail = prod.bundleProductSummaries?.[0]?.detail || prod.detail;
      if (!detail || !String(detail.reference || '').startsWith(ref)) return { error: 'reference does not match' };
      const colors = detail.colors || [];
      const c = colour ? colors.find((x) => String(x.id) === colour) : (colors.length === 1 ? colors[0] : null);
      if (!c) return { error: colour ? `colour ${colour} no longer offered` : 'colour unknown' };
      if (!Array.isArray(c.sizes) || !c.sizes.length) return { error: 'no sizes' };
      const sizes = [];
      for (const z of [...c.sizes].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))) {
        if (z.visibilityValue === 'SHOW') sizes.push({ size: String(z.name), available: z.isBuyable === true });
        else if (z.visibilityValue === 'SOLD_OUT' || z.visibilityValue === 'COMING_SOON') sizes.push({ size: String(z.name), available: false });
        else return { error: `size ${z.name} has visibilityValue ${z.visibilityValue}` };
      }
      return { sizes };
    };

    const checkMassimoDutti = async (mdPieces) => {
      const withIds = [];
      await Promise.all(mdPieces.map(async (p) => {
        try {
          const parsed = mdParse(p);
          if (!parsed) throw new Error('no reference in url');
          const pid = await mdProductId(p);
          withIds.push({ p, pid, ...parsed });
        } catch (e) {
          fail(p, e); tick();
        }
      }));
      for (let i = 0; i < withIds.length; i += 20) {
        const batch = withIds.slice(i, i + 20);
        const ids = [...new Set(batch.map((b) => b.pid))].join(',');
        try {
          const r = await get(MD, `${MD_STORE}/productsArray?languageId=-1&appId=1&productIds=${ids}`);
          if (!r.ok) throw new Error(`productsArray answered ${r.status}`);
          const j = await r.json();
          const byId = new Map((j.products || []).map((x) => [Number(x.id), x]));
          for (const b of batch) {
            const prod = byId.get(b.pid);
            if (!prod) { fail(b.p, 'not in productsArray response'); continue; }
            const res = mdSizes(prod, b.ref, b.colour);
            if (res.error) fail(b.p, res.error);
            else ok(b.p.id, b.p.retailer, res.sizes, 'massimo dutti productsArray');
          }
        } catch (e) {
          for (const b of batch) fail(b.p, e);
        }
        progress.done += batch.length;
      }
    };

    /* ---------- run ---------- */

    const shopify = pieces.filter((p) => SHOPIFY_RETAILERS.includes(p.retailer));
    const md = pieces.filter((p) => p.retailer === MD);
    for (const p of pieces) {
      if (!SHOPIFY_RETAILERS.includes(p.retailer) && p.retailer !== MD) {
        notChecked.push({ id: p.id, retailer: p.retailer });
        tick();
      }
    }

    await Promise.all([
      ...shopify.map(async (p) => {
        try { await checkShopify(p); } catch (e) { fail(p, e); }
        tick();
      }),
      checkMassimoDutti(md),
    ]);

    const out = {
      checkedAt: today(),
      generatedAt: new Date().toISOString(),
      counts: {
        pieces: pieces.length,
        answered: results.length,
        errors: errors.length,
        notChecked: notChecked.length,
      },
      blocked,
      results,
      errors,
      notChecked,
    };

    if (download) {
      const blob = new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `matter-stock-${out.checkedAt}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    }
    progress.finished = true;
    matterStockCheck.last = out;
    return out;
  }

  window.matterStockCheck = matterStockCheck;
})();
