// Example config for `pricing-table-prerender` (run: pnpm build && pnpm prerender.example).
//
// Fetches the live plans once at build time (or PLANS_URL's), then writes one static page per language.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fetchPlans } from '../plans.mjs';

const { products, prices } = await fetchPlans();

const pages = [
  { lang: 'en', currency: 'usd', title: 'Pricing', description: 'Plans and pricing', custom: 'Custom', contact: 'Contact us', output: 'www/pricing/index.html' },
  { lang: 'es', currency: 'mxn', title: 'Precios', description: 'Planes y precios', custom: 'A la medida', contact: 'Contáctanos', output: 'www/es/precios/index.html' },
];

// one template per language, generated from pricing.html
const template = await readFile(new URL('./pricing.html', import.meta.url), 'utf8');
await mkdir(new URL('./.generated/', import.meta.url), { recursive: true });

export default {
  pages: await Promise.all(
    pages.map(async page => {
      const html = template
        .replaceAll('{{lang}}', page.lang)
        .replaceAll('{{title}}', page.title)
        .replaceAll('{{description}}', page.description)
        .replaceAll('{{script}}', '/build/simple-stencil-stripe-subscriptions.esm.js');
      const templatePath = `.generated/pricing.${page.lang}.html`;
      await writeFile(new URL(templatePath, import.meta.url), html);

      const enterprise = products.find(p => p.name === 'Enterprise');
      const plansShown = products.filter(p => p !== enterprise).map(p => (p.name === 'Teams Pro' ? { ...p, highlight: true } : p));

      return {
        template: templatePath,
        output: `../../${page.output}`,
        props: {
          currency: page.currency,
          products: plansShown,
          prices,
          extraProducts: [{ ...enterprise, price_label: page.custom, interval_label: page.contact }],
          // from 50 seats on, Enterprise lights up as the recommended plan
          recommendExtraProductsFrom: 50,
        },
      };
    }),
  ),
};
