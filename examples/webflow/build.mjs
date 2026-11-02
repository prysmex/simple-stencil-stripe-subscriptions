// Builds the prerendered pricing tables for www.prysmex.com/es/precios and /en/pricing, for Webflow:
//
//   pnpm build && pnpm example.webflow
//     -> examples/webflow/out/<lang>/embed-1-table.html     the table, styled and readable without JavaScript: the
//                                                           page's Code Embed (#pricing-table)
//     -> examples/webflow/out/<lang>/embed-2-scripts.html   its data, the component script and the click handler: the
//                                                           page's custom code, before </body>
//     -> examples/webflow/out/<lang>/preview.html           both, in a plain page, to try them locally
//
// They replace the pages' old embed, which fetched the plans and built the table in the browser.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { prerenderHtml, slimPlans } from '../../prerender/index.mjs';
import { fetchPlans } from '../plans.mjs';

// Webflow's Code Embed holds 50,000 characters; keep some room for plans and features being added
const EMBED_LIMIT = 45000;

// the same labels and links the pages' old script used
const PAGES = [
  {
    lang: 'es',
    currency: 'mxn',
    title: 'Precios',
    free: 'Empieza ahora',
    trial: 'Comienza 14 días de prueba',
    enterprise: { price_label: 'Personaliza', interval_label: 'usuarios a la medida', url: '/es/solicita-prueba-prysmex' },
    unit: 'por usuario full seat',
  },
  {
    lang: 'en',
    currency: 'usd',
    title: 'Pricing',
    free: 'Start now',
    trial: 'Start 14 days trial',
    enterprise: { price_label: 'Custom', interval_label: 'custom users', url: '/en/free-trial' },
    unit: 'per full seat user',
  },
];

const here = path => new URL(path, import.meta.url);
const { version } = JSON.parse(await readFile(here('../../package.json'), 'utf8'));
const script = `https://cdn.jsdelivr.net/npm/simple-stencil-stripe-subscriptions@${version}/dist/simple-stencil-stripe-subscriptions/simple-stencil-stripe-subscriptions.esm.js`;
// (without its header comment, which explains the placeholders)
const clickHandlerSource = (await readFile(here('./click-handler.js'), 'utf8')).replace(/^(\/\/.*\n)+/, '');

const { products, prices } = slimPlans(await fetchPlans());
const enterprise = products.find(p => p.name === 'Enterprise');
const free = products.find(p => p.name === 'Free');

// The data moves to the second embed (it would not fit in one), so it comes off the table's tag. It is set back
// before the component script loads, which then takes over the prerendered table with the same data.
const attributes = { products: 'products', prices: 'prices', extraProducts: 'extra-products', translations: 'translations' };
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

let tooBig = false;
for (const page of PAGES) {
  const data = {
    products: products
      .filter(p => p !== enterprise)
      .map(p => ({ ...p, highlight: p.name === 'Teams Pro' || undefined, call_to_action: { label: p === free ? page.free : page.trial } })),
    prices,
    extraProducts: [{ ...enterprise, price_label: page.enterprise.price_label, interval_label: page.enterprise.interval_label }],
    translations: { unit: page.unit },
  };

  const prerendered = await prerenderHtml('<pricing-table></pricing-table>', { lang: page.lang, currency: page.currency, ...data }, { fullDocument: false });
  const tagEnd = prerendered.indexOf('>');
  const table = prerendered.slice(0, tagEnd).replace(new RegExp(` (${Object.values(attributes).join('|')})="[^"]*"`, 'g'), '') + prerendered.slice(tagEnd);

  const dataScript = `(function () {
  var table = document.querySelector('pricing-table');
  var data = ${json(Object.fromEntries(Object.entries(attributes).map(([prop, attribute]) => [attribute, data[prop]])))};
  for (var name in data) table.setAttribute(name, JSON.stringify(data[name]));

  // The component takes over the prerendered table using markers in HTML comments. If something strips them
  // (an HTML minifier, like Webflow's "Minify HTML" may be), it would show every text twice: let it draw the
  // table from scratch instead (crawlers still read the prerendered HTML).
  var root = table.shadowRoot;
  if (root && !document.createTreeWalker(root, NodeFilter.SHOW_COMMENT).nextNode()) {
    table.removeAttribute('s-id');
    Array.prototype.slice.call(root.childNodes).forEach(function (node) {
      if (node.nodeName !== 'STYLE') root.removeChild(node);
    });
  }
})();
`;
  const clickHandler = clickHandlerSource
    .replaceAll('__ENTERPRISE_ID__', enterprise.id)
    .replaceAll('__ENTERPRISE_URL__', page.enterprise.url)
    .replaceAll('__FREE_ID__', free.id);

  const embeds = {
    'embed-1-table.html': `${table}\n`,
    // the data first: the component must not start before it is on the table, or it renders an empty table
    'embed-2-scripts.html': `<script>\n${dataScript}</script>\n<script type="module" src="${script}"></script>\n<script>\n${clickHandler}</script>\n`,
  };

  await mkdir(here(`./out/${page.lang}/`), { recursive: true });
  for (const [file, html] of Object.entries(embeds)) {
    await writeFile(here(`./out/${page.lang}/${file}`), html);
    console.log(`examples/webflow/out/${page.lang}/${file}: ${html.length.toLocaleString('en')} characters (limit ${EMBED_LIMIT.toLocaleString('en')})`);
    tooBig ||= html.length > EMBED_LIMIT;
  }
  await writeFile(
    here(`./out/${page.lang}/preview.html`),
    `<!DOCTYPE html>\n<html lang="${page.lang}">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${page.title} (preview)</title></head>\n<body>\n<section id="pricing-table-container"><div id="pricing-table">\n${embeds['embed-1-table.html']}</div></section>\n${embeds['embed-2-scripts.html']}</body>\n</html>\n`,
  );
}

if (tooBig) {
  console.error('An embed is too big for a Webflow Code Embed');
  process.exit(1);
}
