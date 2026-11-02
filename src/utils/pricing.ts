import type { Price, Tier } from '../components/pricing-table/pricing-table';

// Kept free of runtime imports: scripts/check-stripe-totals.mjs compiles and runs this file on its own to compare
// the table's prices with what Stripe bills.

// Stripe returns the last tier's limit as `up_to: null` (and takes 'inf' when a price is created)
function tierLimit(tier: Tier): number {
  return typeof tier.up_to === 'number' ? tier.up_to : Infinity;
}

/**
 * The total for `seats` under graduated pricing, in the currency's smallest unit (cents).
 */
export function graduatedTotal(tiers: Tier[], seats: number): number {
  let totalCost = 0;
  let previousUpTo = 0;
  // Graduated pricing, as Stripe bills it: each tier charges only the seats that fall inside it
  for (const tier of tiers) {
    const upTo = tierLimit(tier);
    totalCost += (Math.min(seats, upTo) - previousUpTo) * tier.unit_amount;
    if (seats <= upTo) {
      break;
    }
    previousUpTo = upTo;
  }
  return totalCost;
}

/**
 * The price per seat the table shows for `quantity` seats, in the currency's main unit (dollars, pesos).
 */
export function seatPrice(price: Price, currency: string, quantity: number): number {
  if (price.billing_scheme !== 'tiered') {
    return price.unit_amount / 100;
  }
  const tiers = price.currency_options[currency].tiers!;
  if (price.tiers_mode === 'graduated') {
    return graduatedTotal(tiers, quantity) / quantity / 100;
  }
  // Volume pricing: every seat pays the price of the tier the quantity falls in
  const tier = tiers.find(tier => quantity <= tierLimit(tier));
  return tier.unit_amount / 100;
}
