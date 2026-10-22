# MATTER review loop

How new pieces get into the catalog. Two scheduled runs do the work, Natalie
curates in between.

- **Monday pull.** Pull candidates, load them into the review page, save the
  photo file. Natalie has given standing approval (2026-10-22) for the Monday
  run to save `matter-thumbnails.json` to her Downloads folder without asking.
- **Wednesday publish.** Read her skips, merge the rest into the catalog,
  audit, commit, push.
- **Review page.** https://claude.ai/artifact/SX52cEycYGym5RrhYJWMvK
  Source lives in `tools/review-page/index.html`. Its database holds
  `candidates/<id>` (one doc per piece, field `skip`) and `meta/round`
  (`label`, `round`, `deadline` ISO with -05:00 or -06:00, `retailers`).

## The fiber rule

A candidate needs `effectiveNatural >= 95` on the shell, the same function the
site uses in `lib/fibers.js`: natural fibers plus elastane when elastane is
5% or less. Lining never disqualifies a piece. It is stored separately exactly
as the retailer publishes it. A retailer that says "lined" without saying what
gets `"undisclosed"`. Never guess a composition.

Fiber names are stored in the site's spelling (capitalised, see
`FIBER_ALIASES`). Massimo Dutti says "goat leather" or "cow leather": store
`Suede` when the product name says suede, otherwise `Leather`.

Colour must be a key of `COLOURS` in `lib/fibers.js`. Map the retailer's colour
name to the nearest swatch (mole brown and brown marl to Chocolate, beige and
sand to Cream, khaki to Olive, ink or indigo blue to Navy, and so on).

## Retailers, and what works

Use Claude in Chrome on Natalie's Mac. Pace requests. Several retailers block
after a burst, and a block can follow her into her own browsing for a while.

**Massimo Dutti. Reliable.** Run JavaScript on any massimodutti.com/us page.
- Category id: fetch the category page HTML (e.g. `/us/women/jumpers-n1464`)
  and read `"categoryId"`.
- Product ids: `/itxrest/3/catalog/store/34009527/30359506/category/<catId>/product?languageId=-1&showProducts=false&appId=1`,
  every `gridElements[].commercialComponentIds[].ccId`.
- Details, 20 ids per call: `/itxrest/3/catalog/store/34009527/30359506/productsArray?languageId=-1&appId=1&productIds=<ids>`.
  Use `bundleProductSummaries[0]` when present. `detail.colors[0].compositionDetail.parts`
  holds the composition. A part's `description` is the zone (OUTER SHELL,
  LINING). A part may have empty `components` and an `areas` array instead
  (BODY, SLEEVES): for linings, store the BODY area.
- Price is `colors[0].sizes[0].price / 100`. URL is
  `https://www.massimodutti.com/us/` + `productUrl`.
- Image: from `detail.xmedia[].xmediaItems[].medias[].extraInfo.deliveryPath`,
  take the `-o1` shot for the first colour's code, and serve it as
  `https://static.massimodutti.net` + path + `?w=600`. The `-r` shot is a
  40 pixel swatch, never use it.
- Categories used: coats-n1426, jackets-n1450, blazers-n1428 (Tailoring),
  jumpers-n1464 and cardigans-n1448 (Sweaters), dresses-n1494, shirts-n1439,
  blouses-n1432 and t-shirts-n1444 (Tops & blouses), trousers-n1476 (Pants),
  skirts-n1457.

**Revolve. Works, rate limited.** Navigate to a category page in Chrome and
collect `a[href*="/dp/"]` from the DOM (the server HTML has no grid). On each
product page the raw HTML carries `data-yotpo-description` (composition text,
"Self: ... Lining: ..."), `data-yotpo-price` and `data-yotpo-image-url`. Three
at a time with a pause got about 50 pages before an Access Denied. Keep a run
under 40 product pages, one every 3 seconds.

**Zara. Blocks quickly.** Category list from
`/us/en/category/<id>/products?ajax=true`, composition from
`/us/en/products-details?productIds=<colors[0].productId>&ajax=true`
(`detail.detailedComposition.parts`). It returned 403 after about eight
requests. Only try with name pre-filtering (WOOL, CASHMERE, LINEN, SILK,
LEATHER, COTTON, POPLIN) and one request every 6 seconds, and stop at the first
403.

**Mango.** 403 on category pages fetched by script. Not automated yet.
**Neiman Marcus.** Serves a CAPTCHA. Do not attempt to get past it. Manual or
affiliate feed only.
**Nordstrom.** Listing renders client side and was inconsistent. Product pages
carry composition in `copyFeatures`. Not automated yet.

## Monday pull, step by step

1. Read `data/catalog.json` and every `data/review/round-*.json` so nothing
   already listed or already offered comes back.
2. Pull from Massimo Dutti, then Revolve within its pacing. Apply the fiber
   rule. Pick about 40 across all seven categories, favouring what is in
   season, a mix of fibers within each category, and nothing near-identical to
   a piece already live.
3. Write `data/review/round-<YYYY-MM-DD>.json` in catalog format (see an
   existing round file) and commit it.
4. Thumbnails. In a retailer tab, fetch each image with `mode: 'cors'`, draw
   it to a 360 pixel wide canvas, `toDataURL('image/jpeg', 0.74)`, and save one
   JSON object `{id: dataUrl}` as `matter-thumbnails.json` through an anchor
   download. Read it from Downloads, write `img/<id>.jpg` files.
5. Review page. Read the artifact first, then republish
   `tools/review-page/index.html` to the same URL with the new `img/` files.
   Delete the previous round's `candidates` docs, write the new ones (fields:
   retailer, brand, name, price, url, img, category, colour, shell and lining
   as `[{fiber, pct}]`, round, order, skip false), and set `meta/round` with the
   deadline Wednesday 11:00 AM Central.
6. Tell Natalie how many pieces are waiting and when the window closes.

## Wednesday publish, step by step

1. Query the review page database for `candidates` where `skip == true`.
2. Write their ids as a JSON array to `data/review/<round>.skips.json`.
3. `node scripts/merge-review.mjs <round>` then `node scripts/audit.mjs`.
   Fix any audit error before going further.
4. Commit, then push with GitHub Desktop (Repository, Push). If the Mac is
   locked or GitHub Desktop will not respond, leave the commit in place and
   tell Natalie one click is waiting.
