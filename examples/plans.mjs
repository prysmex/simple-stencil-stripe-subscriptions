// Loads the plans the way www.prysmex.com does, so the examples carry the live product and price ids
// (a click on a plan sends its price id to the register page). Set PLANS_URL to use another API, e.g. staging.
export const DEFAULT_PLANS_URL = 'https://b.prysmex.com/api/billing/plans';

export async function fetchPlans(url = process.env.PLANS_URL || DEFAULT_PLANS_URL) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load the plans from ${url}: HTTP ${response.status}`);
  }
  // Stripe list objects: { products: { data: [...] }, prices: { data: [...] } }
  const { products, prices } = await response.json();

  if ([...products.data, ...prices.data].some(item => item.livemode === false)) {
    console.warn(`${url} returned Stripe test-mode plans; their ids will not work in production`);
  }
  return { products: products.data, prices: prices.data };
}
