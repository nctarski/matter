# MATTER review loop

How new pieces get into the catalog. Nothing goes live until Natalie has seen
it and pressed Publish.

- **Monday pull.** Pull candidates, add them to the review page, save the
  photo file. Natalie has given standing approval (2026-10-22) for the Monday
  run to save the photo file to her Downloads folder without asking.
- **Review page.** https://claude.ai/artifact/SX52cEycYGym5RrhYJWMvK
  Source lives in `tools/review-page/index.html`. It shows only pieces she has
  not reviewed yet. A card counts as reviewed once she has scrolled past it
  (`seenAt` is written). She taps Skip on anything below the bar. The Publish
  button marks every reviewed, kept piece `status: "approved"` and starts the
  "MATTER publish now" scheduled task (trig_01Kxb1RHkXd1GA1fcDHsjHG9) through
  her Claude Code Remote connector.
- **Publish run.** "MATTER publish now" on demand, plus the Wednesday run as a
  backstop for approvals that did not get published. Both follow "Publish"
  below and only ever publish `approved` docs.
- **Database.** `candidates/<id>`, one doc per piece: retailer, brand, name,
  price, url, img (`img/<id>.jpg` published with the page), category, colour,
  shell and lining as `[{fiber, pct}]` (lining may be the string
  `"undisclosed"` or null), round, order, skip, seenAt, status
  (`pending`, `approved`, `published`, `rejected`). The full catalog record for
  every candidate lives in a `data/review/round-*.json` file in the repo.

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

**Shopify brand stores. Reliable, the preferred source.** From any open tab,
`fetch('https://<domain>/products.json?limit=250&page=N')` works across
origins. Composition sits in `body_html` text ("Composition: 100% silk",
"Shell ... Lining ..."); parse it strictly, map every fiber name to the site's
spelling, require the shell to sum to 100, and drop anything that does not
parse rather than guess. Use `variants[].available`, `variants[0].price`,
`images[0].src` + `?width=600`, and `https://<domain>/products/<handle>`.
Exclude men's (`mens-` in the handle), kids, home, shoes, bags and
accessories. Multi-brand stores (Jenni Kayne, Lisa Says Gah) carry other
labels: use the `vendor` field as the brand. Verified 2026-10-22 with fiber
content in the data: White + Warren (whiteandwarren.com), Guest In Residence
(guestinresidence.com), Naadam (naadam.co), Brochu Walker (brochuwalker.com),
Sea New York (sea-ny.com), Ulla Johnson (ullajohnson.com), St. Agni
(st-agni.com), Gabriela Hearst (gabrielahearst.com), Tibi (tibi.com), Christy
Dawn (christydawn.com), Jenni Kayne (jennikayne.com), Faherty
(fahertybrand.com, women's only), Anine Bing (aninebing.com), Kotn (kotn.com),
Lisa Says Gah (lisasaysgah.com). Shopify, but composition missing from the
data: Khaite, Toteme, Nili Lotan, Citizens of Humanity, Cuyana, Lauren
Manoogian, Nanushka, Ronny Kobo, Frame, Rachel Comey, Staud, Simkhai, Matteau.
Arch4 is Shopify but prices in GBP, skip. Could not be read: Vince, Pact,
Pansy, Doen, Jesse Kamm, Rag & Bone, Reformation, Sezane, Rouje, Ganni, A Piece
Apart, Lisa Yang, LaPointe, Les et Moi, Posse.

**Mango.** 403 on category pages fetched by script. Not automated yet.
**Neiman Marcus.** Serves a CAPTCHA. Do not attempt to get past it. Manual or
affiliate feed only.
**Nordstrom.** Listing renders client side and was inconsistent. Product pages
carry composition in `copyFeatures`. Not automated yet.

## Monday pull, step by step

1. Read `data/catalog.json` and every `data/review/round-*.json` so nothing
   already listed or already offered comes back.
2. Pull from the Shopify brand stores first, then Massimo Dutti, then Revolve
   within its pacing. Apply the fiber rule. Pick about 60 across all seven
   categories, at most 8 per brand and 3 per category per brand, favouring what
   is new and in season, a mix of fibers, and nothing near-identical to a piece
   already live or already in the queue.
3. Write `data/review/round-<YYYY-MM-DD>.json` in catalog format (see an
   existing round file), audit it against a temporary merged copy, and commit
   it.
4. Photo file. In a retailer tab, fetch each image, draw it to a 360 pixel
   wide canvas, `toDataURL('image/jpeg', 0.74)`, and save one JSON file to
   Downloads through an anchor download. Read it from Downloads and write
   `img/<id>.jpg` files.
5. Review page. Read the artifact first, then republish
   `tools/review-page/index.html` to the same URL, passing only the new
   `img/` files (earlier ones are kept). Keep every existing `candidates` doc.
   Add one doc per new piece with `status: "pending"`, `skip: false` and no
   `seenAt`.
6. Tell Natalie how many new pieces are waiting.

## Publish, step by step

Used by "MATTER publish now" and the Wednesday backstop.

1. Query `candidates` where `status == "approved"`. If none, stop.
2. Write their ids as a JSON array to `data/review/publish-<YYYY-MM-DD-HHMM>.json`.
3. `node scripts/merge-review.mjs --ids <that file>` then
   `node scripts/audit.mjs`. Stop on any audit error or missing id.
4. Commit, then push with GitHub Desktop (Repository, Push). If the Mac is
   locked or GitHub Desktop will not respond, leave the commit in place and
   tell Natalie one click is waiting.
5. Set every approved doc to `status: "published"` with `publishedAt`, and
   every `pending` doc with a `seenAt` and `skip: true` to `status: "rejected"`.
