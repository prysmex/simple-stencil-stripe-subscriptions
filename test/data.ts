import type { Price, Product } from '../src/components/pricing-table/pricing-table';
// Real Stripe test-mode data (trimmed to the fields the components read), taken from the demo page
import stripe from './fixtures/stripe.json';

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Same split the demo page uses: Enterprise is shown as a "contact us" extra product.
 */
export function demoData() {
  // Stripe products come without `prices`; the table attaches them from the `prices` prop
  const products = clone(stripe.products) as unknown as Product[];
  const prices = clone(stripe.prices) as unknown as Price[];
  const enterprise = products.find(p => p.name === 'Enterprise')!;
  enterprise.price_label = 'Custom';
  enterprise.interval_label = 'Contact us';

  return {
    products: products.filter(p => p.name !== 'Enterprise'),
    extraProducts: [enterprise],
    prices,
  };
}

/**
 * Escapes a value for use inside a single-quoted HTML attribute.
 */
export function jsonAttribute(value: unknown): string {
  return JSON.stringify(value).replace(/&/g, '&amp;').replace(/'/g, '&#39;');
}

export function pricingTableHtml(attributes = 'currency="usd"', data = demoData()) {
  return `<pricing-table ${attributes} products='${jsonAttribute(data.products)}' prices='${jsonAttribute(data.prices)}' extra-products='${jsonAttribute(
    data.extraProducts,
  )}'></pricing-table>`;
}
