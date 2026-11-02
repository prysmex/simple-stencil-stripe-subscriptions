import { describe, expect, it } from 'vitest';
import { renderToString } from '../hydrate/index.mjs';
import { demoData, pricingTableHtml } from './data';

/**
 * Roughly what a crawler that does not run JavaScript gets: the text of the HTML.
 */
function visibleText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

describe('server-side rendering', () => {
  it('renders the whole table into the HTML', async () => {
    const result = await renderToString(pricingTableHtml(), { fullDocument: false });

    expect(result.diagnostics).toEqual([]);
    expect(result.components.map(c => [c.tag, c.count])).toEqual(
      expect.arrayContaining([
        ['pricing-table', 1],
        ['tiered-input', 1],
        ['one-product', 3],
        ['highlighted-product', 1],
      ]),
    );

    const text = visibleText(result.html);
    for (const expected of ['Monthly', 'Yearly', 'Save 16%', 'Free', 'Teams', 'Teams Pro', 'Enterprise', '$29', '$49', 'Custom', 'Buy Now', 'Contact Sales']) {
      expect(text).toContain(expected);
    }
  });

  it('uses declarative shadow DOM with the styles inlined', async () => {
    const { html } = await renderToString(pricingTableHtml(), { fullDocument: false });

    expect(html).toMatch(/^<pricing-table[^>]*><template shadowrootmode="open"><style/);
    expect(html).toContain('.bg-blue-600');
  });

  it('ships the styles once, shared by every card', async () => {
    const { html } = await renderToString(pricingTableHtml(), { fullDocument: false });

    // the cards render inside the table's shadow root and use its stylesheet; each copy of Tailwind is ~22 KB
    expect(html.match(/shadowrootmode/g)).toHaveLength(1);
    expect(html.match(/<style/g)).toHaveLength(1);
    // the check mark is drawn once and reused
    expect(html.match(/M16\.704 4\.153/g)).toHaveLength(1);
    expect(html.match(/<use /g)!.length).toBeGreaterThan(10);
  });

  it('produces markup the browser parses as-is', async () => {
    const { html } = await renderToString(pricingTableHtml(), { fullDocument: false });

    // the parser closes a <p> at the first block element, which then gets duplicated on hydration
    const paragraphs = html.match(/<p[\s>][\s\S]*?<\/p>/g) ?? [];
    expect(paragraphs.length).toBeGreaterThan(0);
    for (const paragraph of paragraphs) {
      const content = paragraph.slice(paragraph.indexOf('>') + 1);
      expect(content).not.toMatch(/<(div|p|ul|ol|h\d|section|table)[\s>]/);
    }
  });

  it('keeps the data attributes so the browser hydrates with the same data', async () => {
    const data = demoData();
    const { html } = await renderToString(pricingTableHtml('currency="usd"', data), { fullDocument: false });

    const host = html.slice(0, html.indexOf('>'));
    const products = host
      .match(/ products="([^"]*)"/)![1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    expect(JSON.parse(products)).toEqual(data.products);
  });

  it('renders the language of the document', async () => {
    const page = `<html lang="es"><body>${pricingTableHtml('currency="mxn"')}</body></html>`;
    const { html } = await renderToString(page);

    const text = visibleText(html);
    expect(text).toContain('Mensual');
    expect(text).toContain('Comprar Ahora');
    expect(text).toContain('$559');
  });

  it('can render light DOM instead of shadow roots', async () => {
    const page = `<html><head></head><body>${pricingTableHtml()}</body></html>`;
    const { html } = await renderToString(page, { serializeShadowRoot: 'scoped' });

    expect(html).not.toContain('<template');
    expect(visibleText(html)).toContain('Teams Pro');
  });
});
