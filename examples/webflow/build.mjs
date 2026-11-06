// Builds the prerendered pricing tables for www.prysmex.com/es/precios and /en/pricing, for Webflow:
//
//   pnpm build && pnpm example.webflow
//     -> examples/webflow/out/<lang>/embed-1-table.html     the table, styled and readable without JavaScript: the
//                                                           page's Code Embed (#pricing-table)
//     -> examples/webflow/out/<lang>/embed-2-scripts.html   its data, the component script and the click handler: the
//                                                           page's custom code, before </body>
//     -> examples/webflow/out/<lang>/preview.html           both, in a plain page, to try them locally
//
// They replace the pages' old embed, which fetched the plans and built the table in the browser. The browser only
// fetches them now when the page is opened with ?host=, from a non-production environment (other-environment.js).
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
const source = async file => (await readFile(here(file), 'utf8')).replace(/^(\/\/.*\n)+/, '');
const clickHandlerSource = await source('./click-handler.js');
const otherEnvironmentSource = await source('./other-environment.js');

const { products, prices } = slimPlans(await fetchPlans());

// A page's table data. Also runs in the browser, inlined into the second embed, with another environment's plans.
function pageData(products, prices, page) {
  const enterprise = products.find(p => p.name === 'Enterprise');
  return {
    products: products
      .filter(p => p !== enterprise)
      .map(p => ({ ...p, highlight: p.name === 'Teams Pro' || undefined, call_to_action: { label: p.name === 'Free' ? page.free : page.trial } })),
    prices,
    extraProducts: [{ ...enterprise, price_label: page.enterprise.price_label, interval_label: page.enterprise.interval_label }],
  };
}

// The data moves to the second embed (it would not fit in one), so it comes off the table's tag. It is set back
// before the component script loads, which then takes over the prerendered table with the same data.
const attributes = { products: 'products', prices: 'prices', extraProducts: 'extra-products', translations: 'translations' };
const json = value => JSON.stringify(value).replace(/</g, '\\u003c');

let tooBig = false;
for (const page of PAGES) {
  const data = { ...pageData(products, prices, page), translations: { unit: page.unit } };

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
  const clickHandler = clickHandlerSource.replaceAll('__ENTERPRISE_URL__', page.enterprise.url);
  // (functions as replacers, so nothing in the replacement is read as a $ pattern)
  const otherEnvironment = otherEnvironmentSource.replace('__PAGE_DATA__', () => pageData.toString()).replace('__PAGE__', () => json(page));

  const embeds = {
    'embed-1-table.html': `${table}\n`,
    // the data first: the component must not start before it is on the table, or it renders an empty table
    'embed-2-scripts.html': `<script>\n${dataScript}</script>\n<script type="module" src="${script}"></script>\n<script>\n${clickHandler}${otherEnvironment}</script>\n`,
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
