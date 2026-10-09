# MATTER

A natural fiber clothing aggregator. Fashion first, composition read shell and
lining separately, and the shopper sets their own threshold.

Built with Next.js App Router. No database, no scraping. The whole catalog is
three JSON files you edit by hand, which is deliberate at this size and stays
fast well past a thousand items.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # what Vercel runs. If this passes, the deploy passes.
```

---

## Put it live

1. Push this folder to a new GitHub repo.
2. Go to vercel.com, sign in with GitHub, click **Add New Project** and pick the repo.
3. Accept every default and click **Deploy**. It takes about a minute.
4. In the Vercel project, open **Settings → Domains** and add your domain.
   Vercel prints the DNS records. Paste them into Cloudflare.
5. In **Settings → Environment Variables**, add:

   ```
   NEXT_PUBLIC_SITE_URL = https://yourdomain.com
   ```

   This is what canonical URLs, the sitemap and social cards use. Getting it
   wrong quietly hurts SEO, so do it before you submit the sitemap.

Every push to the repo redeploys automatically after that.

---

## The three files you will actually edit

### `data/catalog.json`

One object per piece. This is the whole product database.

```json
{
  "id": "toteme-signature-double-breasted-coat",
  "retailer": "Net-a-Porter",
  "brand": "Toteme",
  "name": "Signature double-breasted coat",
  "price": 890,
  "url": "",
  "image": "",
  "category": "Outerwear",
  "colour": "Camel",
  "shell": [["Wool", 92], ["Cashmere", 8]],
  "lining": [["Viscose", 100]],
  "isNew": true
}
```

- `id` must be unique. Lowercase, hyphens, no spaces.
- `url` is the affiliate link. Leave it empty and the card renders without a
  link rather than pretending to be clickable.
- `image` is the retailer's image URL. Leave it empty and the card shows a
  tonal placeholder in the garment's colour.
- `shell` and `lining` are arrays of `[fiber, percentage]`. Use `null` for
  `lining` when the piece is unlined. Never merge the two.
- `category` must match one of the categories in `lib/fibers.js`.
- `colour` must match one of the colour names in `lib/fibers.js`.

**The catalog currently holds 60 sample pieces.** Replace them with your own
curation. The site works with any number of items.

### `data/edits.json`

The homepage, in order. Two kinds of block.

```json
{ "type": "strip", "heading": "We read the label so you don't have to.", "body": "..." }
```

```json
{
  "type": "edit",
  "title": "The Fall Edit",
  "by": "Hand selected by our editors",
  "note": "One or two sentences on why this edit exists.",
  "cta": "Shop all outerwear",
  "apply": "outerwear",
  "picks": [{ "id": "toteme-signature-double-breasted-coat", "note": "Your editor note." }]
}
```

`apply` wires the bottom link to a filter state. The available keys are defined
in `EDIT_FILTERS` at the top of `components/Shop.js`. Add a new one there and
you can use it here.

### `data/guides.json`

The fiber education pages. Each guide becomes its own static page at
`/learn/<slug>`, which is what lets Google index them. Add an entry and the
page, the navigation and the sitemap all pick it up with no other change.

Guide text may contain `<strong>` for a term. Nothing else.

---

## Where everything lives

| Path | What it is |
| --- | --- |
| `app/globals.css` | Every colour, font and spacing value, as tokens at the top. Change a value here and it changes everywhere. Nothing else hardcodes a colour. |
| `lib/fibers.js` | The fiber taxonomy and every rule that depends on it. Tiers, the elastane allowance, the default threshold, categories, colours, and the filter logic. |
| `lib/site.js` | Brand name, tagline, domain, description. |
| `components/Shop.js` | The homepage. Curated edits, explainer strips, and the filterable catalog. |
| `components/ProductCard.js` | One product card. |
| `components/HeartsProvider.js` | Hearted items, stored in the viewer's browser. |
| `app/learn/[slug]/page.js` | One fiber guide, statically generated per slug. |
| `app/sitemap.js`, `app/robots.js` | Generated automatically from the guides. |

---

## Things to do before launch

- [ ] Replace the sample catalog with your curation, including real `url` and `image` values.
- [ ] Set `NEXT_PUBLIC_SITE_URL` in Vercel.
- [ ] Remove the prototype notice if one is still in the layout.
- [ ] Add the affiliate disclosure and a privacy policy page.
- [ ] Wire the email form in `components/Signup.js` to ConvertKit or Beehiiv. It currently validates and says plainly that nothing was stored.
- [ ] Submit `yourdomain.com/sitemap.xml` in Google Search Console.

## Known limitations, on purpose

- Hearted items live in one browser. They do not sync across devices. That is
  the right trade at launch and the reason to add accounts later, which is also
  what makes price-drop alerts possible.
- There are no product detail pages. Cards link straight out to the retailer.
  Add them only if click data shows shoppers want an intermediate step.
- Checkout happens on the retailer's site and always will. Taking payment here
  would make you the merchant of record, with inventory, returns and sales tax,
  and would end the affiliate relationship.
