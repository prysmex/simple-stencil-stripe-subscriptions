import { describe, expect, it } from 'vitest';
import type { Price } from '../components/pricing-table/pricing-table';
import { graduatedTotal, seatPrice } from './pricing';

// Teams, monthly, USD (Stripe sends the last tier's limit as null)
const tiers = [
  { up_to: 14, unit_amount: 2900 },
  { up_to: 24, unit_amount: 2200 },
  { up_to: null, unit_amount: 520 },
];

describe('graduatedTotal', () => {
  it('charges each tier only for the seats inside it', () => {
    expect(graduatedTotal(tiers, 14)).toBe(14 * 2900);
    expect(graduatedTotal(tiers, 15)).toBe(14 * 2900 + 2200);
    expect(graduatedTotal(tiers, 24)).toBe(14 * 2900 + 10 * 2200);
    expect(graduatedTotal(tiers, 1000)).toBe(14 * 2900 + 10 * 2200 + 976 * 520);
  });

  it("treats Stripe's 'inf' like null", () => {
    expect(graduatedTotal([{ up_to: 14, unit_amount: 2900 }, { up_to: 'inf', unit_amount: 520 }], 20)).toBe(14 * 2900 + 6 * 520);
  });
});

describe('seatPrice', () => {
  const tiered = (tiers_mode: 'graduated' | 'volume') =>
    ({ billing_scheme: 'tiered', tiers_mode, unit_amount: null, currency_options: { usd: { tiers, unit_amount: null } } }) as unknown as Price;

  it('averages graduated prices over the seats', () => {
    expect(seatPrice(tiered('graduated'), 'usd', 15)).toBeCloseTo((14 * 29 + 22) / 15);
  });

  it('charges every seat the tier the quantity falls in for volume prices', () => {
    expect(seatPrice(tiered('volume'), 'usd', 15)).toBe(22);
    expect(seatPrice(tiered('volume'), 'usd', 1000)).toBe(5.2);
  });

  it('uses the unit amount for per-unit prices', () => {
    expect(seatPrice({ billing_scheme: 'per_unit', unit_amount: 0 } as Price, 'usd', 3)).toBe(0);
  });
});
