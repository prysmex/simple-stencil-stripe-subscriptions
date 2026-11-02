// Builds a single, self-contained demo page you can open straight from disk (file://):
// the prerendered table plus the components bundled into one inline script.
//
//   pnpm build && pnpm example.standalone   ->   examples/standalone/pricing-demo.html
import { readFile, writeFile } from 'node:fs/promises';
import { build } from 'vite';
import { prerenderHtml } from '../../prerender/index.mjs';
import { fetchPlans } from '../plans.mjs';

const here = path => new URL(path, import.meta.url);

// browsers refuse to load module scripts from file://, so bundle everything into one classic script
const [bundle] = await build({
  configFile: false,
  logLevel: 'warn',
  build: {
    write: false,
    minify: true,
    lib: { entry: here('./components.js').pathname, formats: ['iife'], name: 'PricingTableComponents' },
  },
});
const script = bundle.output[0].code.replace(/<\/script/gi, '<\\/script');

const { products, prices } = await fetchPlans();
const enterprise = products.find(p => p.name === 'Enterprise');

const html = await prerenderHtml(await readFile(here('./template.html'), 'utf8'), {
  currency: 'usd',
  products: products.filter(p => p !== enterprise).map(p => (p.name === 'Teams Pro' ? { ...p, highlight: true } : p)),
  prices,
  extraProducts: [{ ...enterprise, price_label: 'Custom', interval_label: 'Contact us' }],
  recommendExtraProductsFrom: 50,
});

const output = here('./pricing-demo.html');
// a replacer function, because minified code contains `$&`-style patterns that a replacement string would expand
await writeFile(
  output,
  html.replace('</body>', () => `<script>${script}</script></body>`),
);
console.log(`${output.pathname} (${(html.length / 1024).toFixed(0)} KB page + ${(script.length / 1024).toFixed(0)} KB script)`);
