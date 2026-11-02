import { h, render } from '@stencil/vitest';
import type { Price, Product } from '../src/components/pricing-table/pricing-table';
import { demoData } from './data';

export { clone, demoData, jsonAttribute, pricingTableHtml } from './data';

/**
 * Where a component renders: its shadow root (pricing-table) or the element itself (the scoped cards and input).
 */
export function shadow(el: Element): ShadowRoot | Element {
  return el.shadowRoot ?? el;
}

export function productCards(root: Element): HTMLElement[] {
  return Array.from(shadow(root).querySelectorAll('one-product'));
}

export function cardText(card: Element, selector: string): string {
  return shadow(card).querySelector(selector)?.textContent?.trim() ?? '';
}

export function cardSummary(card: Element) {
  return {
    name: cardText(card, 'h3'),
    price: cardText(card, '.text-4xl'),
    callToAction: card.querySelector('button')?.textContent?.trim(),
  };
}

export function recurrenceLabels(root: Element): string[] {
  return Array.from(shadow(root).querySelectorAll('fieldset label > span')).map(el => el.textContent!);
}

export interface RenderOptions {
  products?: Product[];
  prices?: Price[];
  extraProducts?: Product[];
  currency?: string;
  lang?: string;
  hideTieredInput?: boolean;
  alwaysShowMonthly?: boolean;
  recommendExtraProductsFrom?: number;
  translations?: any;
}

export async function renderPricingTable(options: RenderOptions = {}) {
  const { lang = 'en', ...props } = { ...demoData(), currency: 'usd', ...options };

  const result = await render(
    <div lang={lang}>
      <pricing-table {...props} />
    </div>,
  );
  const table = result.root.querySelector('pricing-table') as HTMLPricingTableElement;
  return { ...result, table };
}
