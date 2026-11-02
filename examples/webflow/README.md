# Pricing pages on www.prysmex.com (Webflow)

[/es/precios](https://www.prysmex.com/es/precios) and [/en/pricing](https://www.prysmex.com/en/pricing) show a
prerendered `<pricing-table>`: the plans, prices and features are in the page's HTML (for search engines), and the
component script from jsDelivr makes it interactive. Each page has two pieces:

| Piece | Where in Webflow | File |
| --- | --- | --- |
| The table (HTML + CSS) | Code Embed `#pricing-table`, inside the section `#pricing-table-container` | `out/<lang>/embed-1-table.html` |
| Its data, the component script and the click handler | Page settings → Custom code → Before `</body>` tag | `out/<lang>/embed-2-scripts.html` |

The prices are baked into both pieces. Nothing fetches them in the browser any more.

## When to update

- **Prices or plans changed in Stripe**, or a product's features (`features_es` / `features_en` in the product's
  metadata).
- **Labels changed** (button texts, "Personaliza", …): edit `PAGES` in [build.mjs](build.mjs).
- **A new version of the component** was published to npm (see below).

## Update the pages

1. Build both pages' pieces (they read the plans from `https://b.prysmex.com/api/billing/plans`):

   ```bash
   pnpm install
   pnpm webflow
   ```

   It writes `out/es/` and `out/en/` and fails if a piece is over 45,000 characters (Webflow takes 50,000).

2. Optional: open `out/es/preview.html` in a browser to see the result.

3. In Webflow, on the **Precios** page (`/es/precios`):
   - Code Embed `#pricing-table`: replace its code with `out/es/embed-1-table.html`.
   - Page settings → Custom code → Before `</body>` tag: replace it with `out/es/embed-2-scripts.html`.

   Same on the **Pricing** page (`/en/pricing`) with `out/en/`.

4. Publish the site.

Claude Code with the Webflow connector can do steps 1–3 for you ("rebuild and update the Webflow pricing pages"):
site `6320f434a57001b89e9177b1`, Precios page `6452f972e32568b228b9af77` (embed `107bffe2-0a50-9aab-751f-a96620e5c938`),
Pricing page `64530e0b6f990dd173b0183b` (embed `77b32e92-19bc-4bc3-8aa6-c5356bba0940`).

## Release a new version of the component

The pages load the component from jsDelivr at the version in `package.json`, and the prerendered HTML must match it.

1. Bump `version` in `package.json` and run `npm publish` (it builds first).
2. Wait until `https://cdn.jsdelivr.net/npm/simple-stencil-stripe-subscriptions@<version>/package.json` answers.
3. Update the pages as above: the new pieces point at the new version.

## Check

- After publishing, the page's source should contain `shadowrootmode`, `<!--t.` comments and the right
  `simple-stencil-stripe-subscriptions@<version>`, and exactly one `<pricing-table`.
- `STRIPE_SECRET_KEY=rk_live_... pnpm check.stripe` compares the table's totals with Stripe's invoice previews (see
  the main README).

## Roll back

[previous/](previous) has each page's Code Embed from before the prerendered table (the 0.4.0 script that built the
table in the browser). Paste it back into the embed, empty the page's Before `</body>` code, and publish.
