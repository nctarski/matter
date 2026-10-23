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

## The brand rule: no words or graphics on tees

Natalie's call on 2026-10-23: MATTER does not carry tees, sweatshirts or tanks
with words, slogans, logos, university or city names, team or varsity lettering,
or pictorial graphics on them. Plain, striped, ringer, tonal and colour-blocked
pieces are fine, and so is a small tonal or tag-level logo. When staging, look at
the product photo for any tee, sweatshirt, hoodie or tank, and record the ones
that carry words or graphics in the ledger as `rejected` instead of staging them.
Names such as Collegiate, University, Los Angeles, Stencil, Letterman, Sport
Club, New Era and any brand wordmark are the usual signal, and the photo is the
final word.

## Curated edits on the homepage

The homepage sections live in `data/edits.json`, in the order they show. The
brand statement above them is `components/Statement.js`.

- Each edit sets `"photos"` to `"model"` or `"garment"`, and every pick in it
  must show that kind of photo, so a section reads as one set. Mood sections
  (the Fall Edit, This Moment) are on the model. Side by side sections
  (Low, Mid, High) are the garment alone.
- When the catalog photo is the wrong kind, a pick can carry its own `"image"`,
  another photo of the same product from the retailer's own product page.
  Guest In Residence publishes only flat shots, so its pieces fit garment
  sections and not model ones.
- A pick can carry a `"label"`, shown above the card. Low, Mid, High uses it
  for the tiers, ordered by price.
- "This Moment" is the name for a trend section. Never call it a trend.
- Seasonal occasions rest off the top bar out of season. Wedding guest rested
  on 2026-10-23; its tag stays on the pieces and lives in `RESTING_TAGS` in
  `lib/fibers.js` until it comes back.
- Sub-categories (`lib/subcats.js`) are read from product names for Sweaters,
  Tops and Outerwear only. Dresses, pants and skirts need a tagging pass from
  the photo before they can be split.

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
  blouses-n1432 and t-shirts-n1444 (Tops), trousers-n1476 (Pants),
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
Lisa Says Gah (lisasaysgah.com).

**Shopify brands whose fiber content is on the product page.** Added
2026-10-22. Same `products.json` for the list, then
`fetch('https://<domain>/products/<handle>')` from any tab (it works across
origins for all of these except Toteme) and read the composition from the page
text, stripped of tags. Anchor to the main product block: product pages also
render "you may also like" items, so only accept a composition that sits near
the product's own title or details section, and drop the piece when that is
unclear. Pre-filter with product tags where the brand has them, which saves
page reads. Domains and tag patterns:
- Khaite (khaite.com), tags `material:Cashmere` and similar.
- The Row (therow.com).
- Toteme (toteme.com). Product pages refuse cross-origin reads: navigate one
  tab to toteme.com first and fetch from there.
- Staud (staud.clothing), tags `fabric-cashmere`, `fabric-silk`, `fabric-linen`.
- Simkhai (simkhai.com), tags `Fabric: Wool` and similar.
- Frame (frame-store.com), tags `filter-fabric::Silk` and similar.
- Rachel Comey (rachelcomey.com), Ronny Kobo (ronnykobo.com), Citizens of
  Humanity (citizensofhumanity.com), Nanushka (nanushka.com, skip vegan
  leather), Another Tomorrow (anothertomorrow.co), Enza Costa (enzacosta.com),
  The Elder Statesman (elder-statesman.com), Hanro (hanro.com), Doen
  (shopdoen.com), Rouje (rouje.com, skip socks), Matteau (matteau-store.com),
  With Jean (withjean.com), Atoir (atoir.com).
- Composition already in `body_html` for: SAME Los Angeles
  (samelosangeles.com), Retrofete (retrofete.com), WeWoreWhat
  (weworewhat.com), Naked Wardrobe (nakedwardrobe.com), Princess Polly
  (us.princesspolly.com), The Frankie Shop (thefrankieshop.com), Few Moda
  (fewmoda.com), Vrg Grl (vrggrl.com), DISSH (dissh.com). Most of Retrofete,
  Naked Wardrobe, Princess Polly, Atoir and With Jean is synthetic or viscose,
  so expect few passes.
- Australian stores (DISSH, With Jean, Atoir): `products.json` prices may be in
  the store's base currency. Take the price from the product page's
  `"priceCurrency":"USD"` offer, and skip the piece if no USD price is shown.

Shopify with no readable composition anywhere: Nili Lotan, Lauren Manoogian,
Cuyana, Everlane. Hand pick only. Balzac Paris and Arch4 price in EUR and GBP,
skip. Arket does not sell in the US, skip.

**Nordstrom. Filtered pull.** Added 2026-10-22. Use the women's category
pages with the Material filter set to one of 100% Cashmere, 100% Cotton, 100%
Linen, 100% Silk or 100% Wool, and collect product links from the rendered
grid in Chrome. Read each product page; composition sits in `copyFeatures`.
Still apply the fiber rule, since the filter is Nordstrom's own tagging. Keep a
run under 40 product pages, one every 3 seconds, and stop at the first block.
Nordstrom is also the route to Vince, Khaite and Lioness.

**Retailers with a material filter, not yet automated.** Bloomingdale's
(Fabric, including 100% Cashmere), Saks (Material, fiber family only),
Mytheresa (Material), Falconeri (shop by yarn), Banana Republic (sweater
fabric), COS, & Other Stories, H&M, J.Crew, Anthropologie, Aritzia, Ganni. Add
these one at a time after the Nordstrom pull proves stable.

**Mango.** 403 on category pages fetched by script, and no material filter.
Hand pick only.
**Neiman Marcus.** Serves a CAPTCHA. Do not attempt to get past it. Manual or
affiliate feed only.

The full brand list with strategy per brand lives at
https://claude.ai/artifact/8V4UYyg5TPHj8bNw2koJvz.

## Nightly pull: sweep first, then only what is new

Added October 22, 2026. This replaces the Monday pull and the one-time overnight
pull. Natalie wants every retailer swept completely once, then only new arrivals
after that. She reviews and vetoes fast, so there is no per run piece cap and no
per brand cap. The only limits are the ones below.

**Categories.** Sweaters, Outerwear, Tailoring, Tops, Dresses, Pants, Denim,
Skirts, Shorts, Sets & jumpsuits, Sleep & lounge, Active, Undergarments. Jeans
and denim pants go in Denim (a denim dress stays in Dresses, a denim shirt in
Tops). Shorts are Shorts, not Pants. Tees, tanks, camis and blouses are Tops.
Matching sets and jumpsuits and rompers are Sets & jumpsuits. Pajamas, robes
and loungewear are Sleep & lounge; bras and underwear stay Undergarments.

**The ledger.** `data/seen/<retailer>.json` records every product we have
fully handled and what happened to it (staged, catalog, rejected, fiber,
not-womens, out-of-scope, no-price-usd, no-composition, dead). `node
scripts/ledger.mjs seed` built it from the catalog and every round file. A
product is in the ledger only when fully handled. Never record anything that
errored, timed out, or was not finished, so it comes back next run. Key is the
product URL without query string, from `keyOf` in `scripts/ledger.mjs`.
Record outcomes with `node scripts/ledger.mjs record <file>` and commit the
ledger with the round file. Natalie's vetoes: when she skips a piece on the
review page, the publish step records it as "rejected".

**The queue.** `data/sweep-status.json` lists every retailer in order with a
status (todo, partial, done), a `cursor` for where a partial sweep stopped
(category, material filter value, page), `lastSweep` and `lastDelta` dates.
`sweepComplete` flips to true when every retailer is done.

**Sift brands.** Added 2026-10-23, Natalie's call. Some brands are mostly
synthetic or viscose but still carry the odd linen shirt or wool coat, and
finding those is work a shopper will not do themselves. These have `"cadence":
"sift"` in the queue (Pretty Little Thing, Princess Polly, Naked Wardrobe,
WeWoreWhat, Retrofete, Atoir, With Jean, H&M, ASOS). Every other retailer is
`"regular"`. Sift brands differ in three ways:
- Order. In SWEEP, skip sift brands until no regular brand is todo or partial.
- Frequency. In DELTA, run a sift brand only when its `lastDelta` is 28 or more
  days old. Regular brands run every night as before.
- Method. Never page the whole catalogue. Shortlist by material first: the
  site's material filter if it has one, otherwise its search or keyword pages
  for linen, cotton, silk, wool, cashmere, merino, alpaca, mohair, hemp,
  leather, suede and shearling. Drop names that say "look", "faux", "vegan",
  "satin" or "effect" without reading them, and record them as `fiber`. Read up
  to 150 compositions per sift brand per run, then mark it partial with a
  cursor.

**Each night.**
1. Read this file, `data/sweep-status.json`, `git status`, and the review page. Query the review page's candidates for status "rejected" or "published" and record those in the ledger (rejected, catalog), so vetoes are never staged again.
   Work on top of whatever is committed.
2. If `sweepComplete` is false, run SWEEP: take retailers in queue order
   starting with any marked partial. For each, enumerate the whole women's
   catalogue in all 13 categories (Shopify: page all of products.json; Massimo
   Dutti: every category id from the runbook; filtered listing retailers: every
   category crossed with every natural material filter value, paging until the
   listing ends; browse retailers: every category listing). Skip anything the
   ledger already has. Read each remaining composition and apply the fiber rule.
   Mark a retailer done only when its enumeration ended with no errors; mark it
   partial with a cursor if you ran out of budget or were blocked.
3. If `sweepComplete` is true, run DELTA: for each retailer, enumerate in
   newest first order (Shopify: all products.json pages, diffing against the
   ledger; listings: sort by Newest and stop paging after a full page of
   products already in the ledger; Massimo Dutti: diff category id lists).
   Read only products not in the ledger. Set `lastDelta`. Sift brands only every 28
   days, see Sift brands above.
4. Budget for one night: stop starting new retailers after about 4 hours of
   work, or after about 400 compositions read, whichever comes first. Finish
   the retailer in progress or mark it partial with a cursor. Never skip a
   retailer just to save time; leave it for tomorrow.
5. Review page limits. The page holds at most 450 photos, because a published
   version may hold 511 files. Before adding, remove the photos of candidates
   that are published or rejected (pass null for those img files in the
   publish). If pending candidates plus new ones would exceed 450, stage only
   what fits, in queue order, and do NOT record the rest in the ledger.
6. Every new piece gets a round file `data/review/round-<date>-nightly.json`
   with `category` from the list above. Run `node scripts/audit.mjs` against a
   temporary merged copy, then record ledger outcomes (staged for new pieces
   and the right negative outcome for each one rejected by the fiber rule or
   scope), update `data/sweep-status.json`, commit, and republish the review
   page with only the new photos. Commit with the attribution lines the
   environment specifies.
7. Push with GitHub Desktop through computer use (Repository menu, Push; Fetch
   first if Push is disabled). If the Mac is locked, leave it committed.
8. Message Natalie once, short: new pieces waiting, retailers swept tonight and
   how many remain, retailers that blocked or yielded nothing, whether pushed.
   When the sweep finishes, say so and that the nightly run is now delta only.

Pacing, fiber rule, USD only, women's only, no accessories, shoes or bags: all
unchanged from the sections above. Old per run caps in the Monday pull section
no longer apply.

## Monday pull, step by step (superseded by the nightly pull above, kept for the source and pacing details)

1. Read `data/catalog.json` and every `data/review/round-*.json` so nothing
   already listed or already offered comes back.
2. Pull from the Shopify brand stores first (both the data group and the
   product page group), then Massimo Dutti, then the Nordstrom filtered pull,
   then Revolve within its pacing. Apply the fiber rule. Pick about 60 across all seven
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

## Stock check, step by step

Added October 23, 2026. Keeps the site honest about what can still be bought.
Every live piece is checked; only a clear answer from the retailer changes
anything.

**What the catalog stores.**
- `stock`: `{ "checkedAt": "YYYY-MM-DD", "sizes": [{ "size": "S", "available": true }, ...] }`,
  sizes in the retailer's own order.
- `soldOutSince`: `"YYYY-MM-DD"`, present only while no size is available. Set
  on the first sold out check, kept on later ones, removed as soon as any size
  is back.
- On the site: a sold out piece shows a "Sold out" tag on the photo (the "New"
  tag's style) and sorts after every in stock piece inside the shopper's sort,
  below the photographed-first rule. Sold out for more than 14 days, it is
  hidden by `lib/catalog.js` but stays in `catalog.json`. Cards with stock
  data show "In stock: XS, S, M" under the price.

**Methods** (all in `scripts/stock-check.browser.js`):
- Shopify stores (the Shopify retailers above that are in the catalog, plus
  Another Tomorrow and Hanro at shop.hanrousa.com): the store must answer
  `products.json?limit=1` first. Then `https://<host>/products/<handle>.js`.
  Sizes come from the option named Size (or the only option; no size option
  means "One size"), and a size is available when any variant in it has
  `available: true`. A 404 means sold out. If the `.js` request fails, the
  full `products.json` is paged: present means read its variants, missing
  from a complete listing means sold out.
- Massimo Dutti: the catalog has the product page URL (`...-l05608565`, the
  8 digit reference) and the image path, whose 11 digit code is reference
  plus 3 digit colour (`05608565420` is colour `420`). The product page HTML
  carries `"iProductId":61854977` near the top (fetched with cookies, from a
  massimodutti.com tab; without cookies it returns a short bot page). Then
  `productsArray`, 20 ids per call. Fields used, checked on 2026-10-23:
  `detail.reference` must start with the reference; the colour is
  `detail.colors[]` with `id` equal to the colour code; its `sizes[]` give
  `name`, `position`, `isBuyable` and `visibilityValue`. Available means
  `visibilityValue: "SHOW"` and `isBuyable: true`. `"SOLD_OUT"` and
  `"COMING_SOON"` mean not available. Any other value fails the piece. Spot
  checks against `/itxrest/2/catalog/store/34009527/30359506/product/<id>/stock`
  matched: SOLD_OUT sizes are `out_of_stock` there. `backSoon` was `"0"`
  everywhere and is not used. A colour no longer in `colors[]` is an error,
  not sold out.
- Every other retailer (Revolve, Vince, Falconeri, Net-a-Porter, FWRD, Pact,
  Pansy and the rest): not checked, left unchanged.

**Pacing and safety.** At most 4 requests in flight, one at a time per store,
300 ms pause after each. A store stops at its first 403 or 429, or after 3
network failures in a row (a 429 without CORS headers shows up only as
"Failed to fetch"; White + Warren did this after about 130 fast requests on
the first run). Timeouts, network errors and answers that do not parse go in
`errors` and never change stock.

**Steps.**
1. In Chrome on Natalie's Mac, open any `https://www.massimodutti.com/us/`
   page.
2. Paste the whole of `scripts/stock-check.browser.js` into the page with the
   JavaScript tool. Load the live pieces and start the run in the background:
   ```js
   const cat = await fetch('https://raw.githubusercontent.com/nctarski/matter/<HEAD sha>/data/catalog.json').then(r => r.json());
   window.matterPieces = cat
     .filter(i => i.url && typeof i.price === 'number' && i.price > 0 && i.colour)
     .map(i => ({ id: i.id, retailer: i.retailer, url: i.url, image: i.image }));
   window.matterStockRun = matterStockCheck(matterPieces);
   ```
   Use the commit sha that matches local `git log -1` (pushed), so the list is
   the catalog on disk. Include sold out pieces that are hidden: they are still
   in the list above, which is how a restock is noticed.
3. Poll `matterStockCheck.progress` until `finished` is true (about 10
   minutes for 500 pieces). Read `matterStockCheck.last.counts`, `.blocked`
   and the errors grouped by reason.
4. The results file lands in Downloads as `matter-stock-<date>.json`
   (standing approval for MATTER runs to save to Downloads). Chrome lets a
   site save only one file automatically and silently drops the next, so a
   rerun needs a tab on a site that has not downloaded yet: a Shopify brand's
   homepage works for Shopify pieces (Massimo Dutti pieces only work from a
   massimodutti.com tab). Chrome names later files
   `matter-stock-<date> (1).json` and so on.
   If a store blocked or errored, wait a few minutes and rerun only the pieces
   that still have no answer. White + Warren (215 pieces) stops answering
   after roughly 130 to 145 requests in a few minutes whatever the pace, so it
   always takes two or three passes.
5. Apply each file in the order it was made:
   `node scripts/apply-stock.mjs ~/Downloads/matter-stock-<date>.json`
6. `node scripts/audit.mjs` (must say No errors) and `npm run build`.
7. Commit `data/catalog.json` with the attribution lines the environment
   specifies, then push with GitHub Desktop (Repository, Push; Fetch first if
   Push is disabled). If the Mac is locked or GitHub Desktop will not respond,
   leave the commit and say one click on Push origin is waiting.
8. Tell Natalie: pieces checked, sold out (and how many newly), low size
   availability (in stock with fewer than half of its sizes available),
   pieces back in stock, pieces hidden after 14 days, how many could not be
   checked and from which retailers, any store that blocked, and whether the
   push went through.

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
