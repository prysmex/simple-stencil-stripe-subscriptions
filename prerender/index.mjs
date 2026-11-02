// Prerenders <pricing-table> into static HTML at build time, so the page ships with the
// prices, plans and features already in the markup (good for SEO) and hydrates in the browser.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { renderToString } from '../hydrate/index.mjs';

const kebabCase = name => name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
const escapeAttribute = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/**
 * Turns pricing-table props into an HTML attribute string. Objects become JSON attributes,
 * which the component reads back when it hydrates in the browser.
 *
 * @param {Record<string, unknown>} props e.g. `{ products, prices, extraProducts, currency: 'usd', recommendExtraProductsFrom: 50 }`
 */
export function pricingTableAttributes(props = {}) {
  return Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => {
      const attribute = kebabCase(name);
      if (value === true) return attribute;
      const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
      return `${attribute}="${escapeAttribute(serialized)}"`;
    })
    .join(' ');
}

const pick = (object, keys) => Object.fromEntries(keys.filter(key => object?.[key] !== undefined).map(key => [key, object[key]]));

/**
 * Keeps only the product and price fields the pricing table reads. Stripe objects carry many more, and the
 * prerendered HTML repeats the data in attributes for the browser to take over. Ids are kept, so `productClicked`
 * handlers can still use `detail.id`, `detail.price.id` and `detail.price.product`.
 *
 * @param {{ products: object[], prices: object[] }} plans
 */
export function slimPlans({ products = [], prices = [] }) {
  return {
    products: products.map(product =>
      pick(product, ['id', 'name', 'description', 'metadata', 'highlight', 'call_to_action', 'price_label', 'interval_label']),
    ),
    prices: prices.map(price => ({
      ...pick(price, ['id', 'product', 'active', 'type', 'billing_scheme', 'tiers_mode', 'unit_amount', 'is_subscribed']),
      ...(price.recurring && { recurring: pick(price.recurring, ['interval', 'interval_count', 'trial_period_days']) }),
      ...(price.currency_options && {
        currency_options: Object.fromEntries(
          Object.entries(price.currency_options).map(([currency, option]) => [
            currency,
            { ...pick(option, ['unit_amount']), ...(option.tiers && { tiers: option.tiers.map(tier => pick(tier, ['up_to', 'unit_amount'])) }) },
          ]),
        ),
      }),
    })),
  };
}

/**
 * Adds the props to every <pricing-table> in the HTML and server-renders the result.
 *
 * @param {string} html a full page (or fragment) containing `<pricing-table>`
 * @param {Record<string, unknown>} props see `pricingTableAttributes`
 * @param {object} [options] passed to Stencil's `renderToString`
 */
export async function prerenderHtml(html, props = {}, options = {}) {
  if (!/<pricing-table[\s>]/.test(html)) {
    throw new Error('The HTML has no <pricing-table> element to prerender');
  }
  const attributes = pricingTableAttributes(props);
  const withData = attributes ? html.replace(/<pricing-table(?=[\s>])/g, () => `<pricing-table ${attributes}`) : html;

  const result = await renderToString(withData, { prettyHtml: false, ...options });
  const errors = result.diagnostics.filter(d => d.level === 'error');
  if (errors.length) {
    throw new Error(`Prerendering failed:\n${errors.map(d => `  ${d.header ?? ''} ${d.messageText}`).join('\n')}`);
  }
  return result.html;
}

/**
 * Prerenders every page of a config:
 *
 *   export default {
 *     pages: [{ template: 'pricing.html', output: 'dist/pricing/index.html', props: { products, prices, currency: 'usd' } }],
 *   };
 *
 * `props` may also be a (async) function. Paths are relative to `cwd`.
 */
export async function prerenderPages(config, { cwd = process.cwd(), log = console.log } = {}) {
  const pages = config?.pages ?? [];
  if (!pages.length) {
    throw new Error('The prerender config has no pages');
  }

  const written = [];
  for (const page of pages) {
    const templatePath = resolve(cwd, page.template);
    const outputPath = resolve(cwd, page.output);
    const props = typeof page.props === 'function' ? await page.props() : page.props;

    const html = await prerenderHtml(await readFile(templatePath, 'utf8'), props, page.renderOptions);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, html);

    log(`${page.template} -> ${page.output} (${(html.length / 1024).toFixed(1)} KB)`);
    written.push(outputPath);
  }
  return written;
}
