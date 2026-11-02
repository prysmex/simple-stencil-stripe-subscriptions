#!/usr/bin/env node
// Checks that the pricing table shows what Stripe actually bills.
//
// For every price and currency on the pricing page, it asks Stripe for an invoice preview at each tier boundary
// (the last seat of a tier and the first of the next) and a few counts in between, then compares Stripe's
// subtotal (before tax and discounts) with the total the table shows for the same number of seats. The table's
// total comes from src/utils/pricing.ts, the same code the component runs. Previews are read-only: nothing is
// created in Stripe.
//
//   STRIPE_SECRET_KEY=rk_live_... pnpm check.stripe
//   pnpm check.stripe --dry-run          # no key: list the checks and the table's totals
//
// Use a restricted, read-only key for the account the live prices are in. PLANS_URL points at another plans
// API (default: https://b.prysmex.com/api/billing/plans).
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { fetchPlans } from '../examples/plans.mjs';

// the table's own price code, compiled with the project's TypeScript (so it runs on any Node)
const pricingSource = await readFile(new URL('../src/utils/pricing.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(pricingSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } });
const { seatPrice } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const dryRun = process.argv.includes('--dry-run');
const key = process.env.STRIPE_SECRET_KEY;
if (!key && !dryRun) {
  console.error('Set STRIPE_SECRET_KEY (a restricted, read-only key is enough), or pass --dry-run');
  process.exit(1);
}

const { products, prices } = await fetchPlans();
const productName = id => products.find(p => p.id === id)?.name ?? id;

// what the table shows as the total for `seats`, in cents: per-seat price times seats, rounded like the display
const tableTotal = (price, currency, seats) => Math.round(seatPrice(price, currency, seats) * seats * 100);

function seatCounts(price, currency) {
  if (price.billing_scheme !== 'tiered') {
    return [1, 15];
  }
  const counts = new Set([1, 2, 7, 50, 1500, 5000]);
  for (const { up_to } of price.currency_options[currency].tiers) {
    if (typeof up_to === 'number') {
      counts.add(up_to).add(up_to + 1);
    }
  }
  return [...counts].sort((a, b) => a - b);
}

async function stripeSubtotal(price, currency, seats) {
  const body = new URLSearchParams({
    currency,
    'customer_details[address][country]': currency === 'mxn' ? 'MX' : 'US',
    'subscription_details[items][0][price]': price.id,
    'subscription_details[items][0][quantity]': String(seats),
  });
  const response = await fetch('https://api.stripe.com/v1/invoices/create_preview', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const invoice = await response.json();
  if (!response.ok) {
    throw new Error(`Stripe ${response.status} for ${price.id} ${currency} x${seats}: ${invoice.error?.message ?? JSON.stringify(invoice)}`);
  }
  return invoice.subtotal;
}

const money = (cents, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(cents / 100);

let checked = 0;
const mismatches = [];
for (const price of prices.filter(p => p.active)) {
  for (const currency of Object.keys(price.currency_options ?? {})) {
    const counts = seatCounts(price, currency);
    const label = `${productName(price.product)}, ${price.recurring?.interval}ly, ${currency.toUpperCase()}`;
    let bad = 0;
    for (const seats of counts) {
      const expected = tableTotal(price, currency, seats);
      if (dryRun) {
        continue;
      }
      const actual = await stripeSubtotal(price, currency, seats);
      checked++;
      if (actual !== expected) {
        bad++;
        mismatches.push(`${label}, ${seats} seats: table ${money(expected, currency)}, Stripe ${money(actual, currency)}`);
      }
    }
    const sample = counts.slice(0, 4).map(n => `${n}: ${money(tableTotal(price, currency, n), currency)}`).join(', ');
    console.log(`${bad ? 'DIFFERS' : dryRun ? 'would check' : 'matches'}  ${label} (${price.id}): ${counts.length} seat counts${dryRun ? ` (${sample}, ...)` : ''}`);
  }
}

if (dryRun) {
  console.log('\nDry run: nothing was sent to Stripe.');
} else if (mismatches.length) {
  console.log(`\n${mismatches.length} of ${checked} totals differ from Stripe:\n  ${mismatches.join('\n  ')}`);
  process.exit(1);
} else {
  console.log(`\nAll ${checked} totals match what Stripe bills (subtotal before tax and discounts).`);
}
