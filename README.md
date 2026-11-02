# simple-stencil-stripe-subscriptions

An alternative for stripe pricing table, basically receives products with prices and renders them based on their recurrence giving you control on the experience,
translations, click handling etc.

[![Built With Stencil](https://img.shields.io/badge/-Built%20With%20Stencil-16161d.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjIuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI%2BCgkuc3Qwe2ZpbGw6I0ZGRkZGRjt9Cjwvc3R5bGU%2BCjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik00MjQuNywzNzMuOWMwLDM3LjYtNTUuMSw2OC42LTkyLjcsNjguNkgxODAuNGMtMzcuOSwwLTkyLjctMzAuNy05Mi43LTY4LjZ2LTMuNmgzMzYuOVYzNzMuOXoiLz4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQyNC43LDI5Mi4xSDE4MC40Yy0zNy42LDAtOTIuNy0zMS05Mi43LTY4LjZ2LTMuNkgzMzJjMzcuNiwwLDkyLjcsMzEsOTIuNyw2OC42VjI5Mi4xeiIvPgo8cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDI0LjcsMTQxLjdIODcuN3YtMy42YzAtMzcuNiw1NC44LTY4LjYsOTIuNy02OC42SDMzMmMzNy45LDAsOTIuNywzMC43LDkyLjcsNjguNlYxNDEuN3oiLz4KPC9zdmc%2BCg%3D%3D&colorA=16161d&style=flat-square)](https://stenciljs.com)

## Usage

```html
<script type="module" src="https://unpkg.com/simple-stencil-stripe-subscriptions/dist/simple-stencil-stripe-subscriptions/simple-stencil-stripe-subscriptions.esm.js"></script>

<pricing-table currency="usd"></pricing-table>

<script>
  const table = document.querySelector('pricing-table');
  table.products = products; // Stripe products
  table.prices = prices; // Stripe prices (with currency_options and tiers expanded)
  table.extraProducts = [enterprise]; // optional "contact us" cards, with price_label / interval_label
  table.addEventListener('productClicked', event => console.log(event.detail));
</script>
```

The language comes from the closest `lang` attribute (`en` and `es` are built in, anything else falls back to English).
Override any string with the `translations` prop. See [the component docs](src/components/pricing-table/readme.md) for every prop.

Set `recommend-extra-products-from="50"` (or `recommendExtraProductsFrom`) to light up the extra products (e.g. Enterprise)
as the recommended option once the seat count reaches 50, with a "we recommend talking with us" message.

`products`, `prices`, `extraProducts` and `translations` can also be passed as JSON attributes
(`products='[...]'`, `extra-products='[...]'`), which is what makes server-side rendering work.

## Prerendering for SEO (static HTML, no server)

Without prerendering the pricing table only exists after JavaScript runs, so crawlers that don't execute JS see an
empty `<pricing-table>`. Prices change rarely, so the simplest setup is to render the table into static HTML at build
time and deploy those files anywhere static (S3/CloudFront, Netlify, GitHub Pages, ...). No server is involved.

The prerendered page contains the plans, prices, features and CTA labels (inside
[declarative shadow DOM](https://developer.chrome.com/docs/css-ui/declarative-shadow-dom), with styles inlined), plus the
data as JSON attributes. When the component script loads, it hydrates that markup with the same data, so tabs, the seat
input and the buttons keep working.

### 1. Write an HTML template

Any page with an empty `<pricing-table>` and the component script:

```html
<html lang="en">
  <head>
    <title>Pricing</title>
    <script type="module" src="https://unpkg.com/simple-stencil-stripe-subscriptions@0.5.0/dist/simple-stencil-stripe-subscriptions/simple-stencil-stripe-subscriptions.esm.js"></script>
  </head>
  <body>
    <pricing-table></pricing-table>
  </body>
</html>
```

Pin the version (or copy `dist/simple-stencil-stripe-subscriptions/` next to your pages) so the hydrating script always
matches the version that prerendered the HTML.

### 2. Write a config: `pricing.prerender.mjs`

```js
// fetched once, at build time
const { products, prices } = await (await fetch('https://b.prysmex.com/api/billing/plans')).json();
const enterprise = products.data.find(p => p.name === 'Enterprise');

export default {
  pages: [
    {
      template: 'pricing.html', // paths are relative to this file
      output: 'dist/pricing/index.html',
      props: {
        currency: 'usd',
        products: products.data.filter(p => p !== enterprise),
        prices: prices.data,
        extraProducts: [{ ...enterprise, price_label: 'Custom', interval_label: 'Contact us' }],
        recommendExtraProductsFrom: 50,
      },
    },
    // one entry per language / currency, e.g. a `lang="es"` template with currency: 'mxn'
  ],
};
```

`props` are the `<pricing-table>` props (`props` can also be an async function).

### 3. Run it as part of your build

```bash
npx pricing-table-prerender pricing.prerender.mjs
```

It exits non-zero if rendering fails, so a broken build never ships. To refresh prices, rebuild and redeploy: on a
schedule, or from the Stripe `price.updated` / `product.updated` webhooks via your host's deploy hook.

[`examples/prerender`](examples/prerender) is a working version of all of this (English/USD and Spanish/MXN pages):

```bash
pnpm build
pnpm prerender.example                                                   # live plans, from https://b.prysmex.com/api/billing/plans
PLANS_URL=https://<staging api>/api/billing/plans pnpm prerender.example   # another API
# -> www/pricing/index.html and www/es/precios/index.html (serve www/ to try them)
```

### Try it without any setup

`pnpm build && pnpm example.standalone` writes `examples/standalone/pricing-demo.html`: a single prerendered file with the
components bundled inline, so it works when opened straight from disk (double-click it). It uses the live plans too
(`PLANS_URL` works the same way).

Both examples need the plans API to answer and fail otherwise. They never fall back to the test fixture: its Stripe
test-mode ids look right but break the register link in production.

### Webflow (www.prysmex.com/es/precios and /en/pricing)

How to update and redeploy them, step by step: [examples/webflow/README.md](examples/webflow/README.md).

`pnpm webflow` (build, then `pnpm example.webflow`) writes, for each page, `examples/webflow/out/<lang>/`:

- `embed-1-table.html`: the prerendered table, styled and readable without JavaScript. It replaces the contents of
  the page's `#pricing-table` Code Embed (the old `@0.4.0` script tag and the script that fetched the plans).
- `embed-2-scripts.html`: its data, the component script (pinned to this package's version on jsDelivr) and the click
  handler (register link with the price id, Enterprise to the demo form). It goes in the page's custom code, before
  `</body>`, so it runs after the table is in the page.
- `preview.html`: both, in a plain page, to try them locally.

Each piece must stay under Webflow's 50,000 characters, so the build fails above 45,000. Prices are baked in: after a
price change, run the build again and replace both pieces. Publish this version to npm first, because the page loads
it from jsDelivr.

If the published page loses the HTML comments inside the table (Webflow's "Minify HTML" may strip them), the second
piece notices and lets the component draw the table from scratch instead of showing every text twice. Check the
published page's source still has `shadowrootmode` and `<!--t.` comments, or turn that option off.

To fit, the data is cut down with `slimPlans()` (only the fields the table reads; exported from `prerender/`) and set
by the second piece before the component script loads.

### Checking the prices against Stripe

`STRIPE_SECRET_KEY=rk_live_... pnpm check.stripe` asks Stripe for an invoice preview at every tier boundary of every
price and currency on the pricing page, and compares Stripe's subtotal (before tax and discounts) with the total the
table shows. The table's side runs [`src/utils/pricing.ts`](src/utils/pricing.ts), the same code as the component.
Previews create nothing in Stripe; a restricted, read-only key is enough. `pnpm check.stripe --dry-run` lists the
checks without calling Stripe.

### Programmatic use / per-request SSR

The same pieces are importable if you'd rather call them from your own build script or a Node server:

```js
import { prerenderHtml } from 'simple-stencil-stripe-subscriptions/prerender/index.mjs';
const html = await prerenderHtml(templateHtml, { products, prices, currency: 'usd' });

// or the raw Stencil hydrate API
import { renderToString } from 'simple-stencil-stripe-subscriptions/hydrate';
```

`renderToString(html, { serializeShadowRoot: 'scoped' })` renders plain light DOM instead of shadow roots, but hoists
the component styles (including Tailwind's preflight) into the page `<head>`, where they can affect the host page.

## Development

Requires Node `^22.12.0 || >=24`.

```bash
pnpm install
pnpm start    # dev server with the demo page (src/index.html)
pnpm build    # dist/, loader/, hydrate/ and www/
pnpm test     # builds, then runs the Vitest suites
```

Tests use [`@stencil/vitest`](https://github.com/stenciljs/vitest):

- `src/**/*.spec.tsx`: components rendered in Stencil's mock DOM, against the built output.
- `src/**/*.unit.ts`, `test/**/*.unit.ts`: plain Node, including server rendering through `hydrate/` and the prerender CLI.

Fixtures are real Stripe test-mode data in [`test/fixtures/stripe.json`](test/fixtures/stripe.json).

Styling is Tailwind v4 via `stencil-tailwind-plugin`; the entry point is [`src/global/tailwind.css`](src/global/tailwind.css).
Only `pricing-table` has a shadow root and a stylesheet. The cards and the input are scoped components that render
inside it and share that stylesheet, which keeps the prerendered HTML to one copy of Tailwind instead of six. As a
result, `<one-product>` and `<highlighted-product>` are unstyled when used outside `<pricing-table>`, and they take
their button label as `call-to-action-label` instead of a `callToAction` slot (changed in 0.5.0).
[`postcss.config.js`](postcss.config.js) makes Tailwind's CSS-variable fallbacks apply inside shadow roots.
