/* MATTER colour check. Runs in Chrome on Natalie's Mac, never in node.
 *
 * Measures how much of each product photo is a given hue, so a colour edit is
 * picked by what the photo shows rather than the colour name a retailer gave
 * it ("iris" can be fuchsia, "violet" can be plum). Written 2026-10-28 for
 * the bright purple edit; see "Colour pulls" in REVIEW-LOOP.md.
 *
 *   1. Open any https page.
 *   2. Paste this file, then run
 *        window.matterColourRun = matterColourCheck(pieces, { min: 258, max: 305 })
 *      where pieces is [{ id, image }]. Poll matterColourCheck.progress.
 *   3. Resolves with [{ id, share, satShare }] and saves
 *      matter-colour-<date>.json to Downloads.
 *
 * share is the fraction of all pixels that are saturated (s > 0.3) and of
 * mid lightness inside the hue window. Studio backgrounds are near neutral,
 * so in practice it is the share of the garment in that colour. 0.05 and up
 * is a real colour piece; look at every hit before tagging, since skin,
 * props and prints can land in the window.
 *
 * Images must come from a host that sends CORS headers (Shopify's CDN does).
 * A piece whose image cannot be read is reported in errors, never as a miss.
 */
(() => {
  const small = (u) => {
    try {
      const x = new URL(u);
      if (x.hostname === 'cdn.shopify.com') { x.searchParams.delete('v'); x.searchParams.set('width', '240'); }
      return x.toString();
    } catch (e) { return u; }
  };
  const hsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  };
  const load = (u) => new Promise((res, rej) => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    const t = setTimeout(() => rej(new Error('timeout')), 15000);
    im.onload = () => { clearTimeout(t); res(im); };
    im.onerror = () => { clearTimeout(t); rej(new Error('load')); };
    im.src = u;
  });

  async function matterColourCheck(pieces, { min = 258, max = 305, workers = 6 } = {}) {
    const progress = matterColourCheck.progress = { total: pieces.length, done: 0, errors: 0, status: 'running' };
    const cv = document.createElement('canvas'); cv.width = 60; cv.height = 80;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const results = [], errors = [];
    const one = async (p) => {
      try {
        const im = await load(small(p.image));
        cx.clearRect(0, 0, 60, 80); cx.drawImage(im, 0, 0, 60, 80);
        const d = cx.getImageData(0, 0, 60, 80).data;
        let hit = 0, sat = 0, n = 0;
        for (let k = 0; k < d.length; k += 4) {
          const [h, s, l] = hsl(d[k], d[k + 1], d[k + 2]); n++;
          if (s > 0.3 && l > 0.15 && l < 0.85) { sat++; if (h >= min && h < max) hit++; }
        }
        results.push({ id: p.id, share: +(hit / n).toFixed(3), satShare: sat ? +(hit / sat).toFixed(2) : 0 });
      } catch (e) { errors.push({ id: p.id, why: e.message }); progress.errors++; }
      progress.done++;
    };
    const q = [...pieces];
    await Promise.all(Array.from({ length: workers }, async () => { while (q.length) await one(q.shift()); }));
    results.sort((a, b) => b.share - a.share);
    const out = { checkedAt: new Date().toISOString().slice(0, 10), hue: { min, max }, results, errors };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }));
    a.download = `matter-colour-${out.checkedAt}.json`; document.body.appendChild(a); a.click(); a.remove();
    progress.status = 'done';
    return out;
  }
  window.matterColourCheck = matterColourCheck;
})();
